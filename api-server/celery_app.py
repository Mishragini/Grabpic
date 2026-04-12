from celery import Celery,Task
from typing import cast
from lib.database import supabase
import logging
import numpy as np
import inspireface as isf
import cv2
import uuid
import redis
import json
import base64

#redis client for pubsub
redis_client = redis.Redis(host="localhost",port=6379, db=2)

celery_app = Celery(
    "grabpic",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1" 
)

#bind= True is for reading the task id 
@celery_app.task(bind=True)
def _process_photo(self,photos:list,event_id:str):
    task_id = self.request.id
    try:
        total = len(photos)
        # Create a session with face recognition features
        opt = isf.HF_ENABLE_FACE_RECOGNITION
        session = isf.InspireFaceSession(opt, isf.HF_DETECT_MODE_ALWAYS_DETECT)

        #process each photo
        for index,  content in enumerate(photos,start=1):  
            #upload the photo to supabase storage
            filename = content["filename"] or f"{uuid.uuid4()}.jpg"
            content_type = content["content_type"] or "image/jpeg"
            storage_path=filename
            try:
                supabase.storage.from_('photos').upload(filename, base64.b64decode(content["data"]), {"content-type": content_type})
            except Exception as e:
                if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                    pass
                else:
                    raise

            # Check if this photo is already in the db
            existing = supabase.table("photos")\
                .select("id")\
                .eq("storage_path", storage_path)\
                .eq("event_id",event_id)\
                .execute()
            
            if existing.data:
                existing_photo = cast(dict,existing.data[0])
                photo_id = existing_photo["id"]  

            else :
               #add it in the db table
                db_response = supabase.table("photos").insert({
                    "event_id": event_id,
                    "storage_path":storage_path
                }).execute()
                photo_record = cast(dict,db_response.data[0])
                photo_id = photo_record["id"]
            

            #fetch the image bytes from supabase storage
            image_bytes = supabase.storage.from_("photos").download(storage_path)
            #convert the image bytes to image array for cv2 to decode 
            image_array = np.frombuffer(image_bytes,dtype=np.uint8)
            # Load the image using OpenCV.
            image = cv2.imdecode(image_array,cv2.IMREAD_COLOR)

            if image is None:
                raise ValueError(f"Failed to decode image from storage path: {storage_path}")
                      
            # Perform face detection on the image.
            faces = session.face_detection(image)

            if not faces:
                continue
            
            for face in faces:
                #get the embedding of the face
                embedding = session.face_feature_extract(image,face)
                embedding_list = embedding.tolist()

                #get the matching profile for the face embeddig via supabase defined function
                result = supabase.rpc("match_face_profile", {
                    "query_embedding": embedding_list,
                    "match_threshold": 0.45,
                    "p_event_id": event_id
                }).execute()

                match = cast(list[dict], result.data)

                if match:
                    matched_profile_id = match[0]["id"]
                else:
                    matched_profile_id = None

                if  matched_profile_id is None:
                     # Get the face crop
                    x1, y1, x2, y2 = face.location

                    # Convert to int and clamp to image bounds
                    h, w = image.shape[:2]
                    x1 = max(0, int(x1))
                    y1 = max(0, int(y1))
                    x2 = min(w, int(x2))
                    y2 = min(h, int(y2))

                    # Guard against zero-area crop
                    if x2 <= x1 or y2 <= y1:
                        logging.warning(f"Skipping invalid face crop region: ({x1},{y1},{x2},{y2}) for image shape {image.shape}")
                        continue  # skip this face, move to next
                    
                    face_crop = image[y1:y2, x1:x2]

                    # Double-check crop isn't empty
                    if face_crop is None or face_crop.size == 0:
                        logging.warning("face_crop is empty after slicing, skipping")
                        continue
                    
                    _, buffer = cv2.imencode(".jpg", face_crop)
                    face_bytes = buffer.tobytes()  
                   
                    face_crop_path = f"{uuid.uuid4()}/{storage_path.replace('/','_')}"

                    # filter on the basis of detection confidence -> store it in inconclusive storage for the orgnizer to review
                    if face.detection_confidence < 0.7:
                        supabase.storage.from_("inconclusive-crops").upload(
                            face_crop_path,
                            face_bytes,
                            {"content-type": "image/jpeg"}
                        )
                        supabase.table("face_crops").insert({
                            "photo_id":photo_id,
                            "storage_path":face_crop_path,
                            "event_id":event_id,
                            "embedding":embedding_list
                        }).execute()
                    else:
                        supabase.storage.from_("face-crops").upload(
                            face_crop_path,
                            face_bytes,
                            {"content-type": "image/jpeg"}
                        )
                        db_response= supabase.table("face_profiles").insert({
                            "embedding":embedding_list,
                            "photo_id":photo_id,
                            "event_id":event_id,
                            "representative_crop_path":face_crop_path
                        }).execute()
                        profile = cast(dict,db_response.data[0]) 
                        matched_profile_id = profile["id"]  
                #insert the map for non conclusive crops skip
                if matched_profile_id:  
                    supabase.table("face_photo_map").insert({
                        "face_profile_id": matched_profile_id,
                        "photo_id": photo_id
                    }).execute() 
            #update the processed status of the photo    
            supabase.table("photos").update({
            "processed": True
            }).eq("id", photo_id).execute() 
            # publish fires and forgets 
            # in case our client takes time to connect to ws 
            # the client wont show until a new publish is made 
            # to handle that we set the latest value in the key value store
            redis_client.set(
                f"task:{task_id}:latest",json.dumps({
                "processed": index,
                "total":total}))

            #pushing progress to redis pubsub
            redis_client.publish(f"task:{task_id}:progress",json.dumps({
                "processed": index,
                "total":total
            }))       
        done = json.dumps({"completed": True, "processed": total, "total": total})
        redis_client.set(f"task:{task_id}:latest", done)
        redis_client.publish(f"task:{task_id}:progress", done)
    except Exception:
        logging.exception("process_photo failed task_id=%s event_id=%s", task_id, event_id)
        err = json.dumps({"error": True})
        redis_client.set(f"task:{task_id}:latest", err)
        redis_client.publish(f"task:{task_id}:progress", err)
    return


@celery_app.task
def _match_photo(image_bytes,event_id:str):
    image_array = np.frombuffer(image_bytes,dtype=np.uint8)
    
    image = cv2.imdecode(image_array,cv2.IMREAD_COLOR)
    
    opt = isf.HF_ENABLE_FACE_RECOGNITION
    session = isf.InspireFaceSession(opt, isf.HF_DETECT_MODE_ALWAYS_DETECT)
    
    faces = session.face_detection(image)
    
    if not faces:
        raise ValueError("No face found")
    
    if len(faces) > 1:
        raise ValueError(f"Found multiple faces")
    
    
    embedding = session.face_feature_extract(image,faces[0])
    embedding_list = embedding.tolist()
    
    rpc_res =supabase.rpc("match_face_profile", {
            "query_embedding": embedding_list,
            "match_threshold": 0.45,
            "p_event_id": event_id
        }).execute()
    
    match = cast(list[dict], rpc_res.data)
    
    if not match:
        raise ValueError("No matching profile found")
    
    profile_id = match[0]["id"]
    
    map_db_res = supabase.table("face_photo_map")\
        .select("photo_id")\
            .eq("face_profile_id",profile_id)\
                .execute()
                
    map_data = cast(list[dict],map_db_res.data)
    photo_ids = [row["photo_id"] for row in map_data]
    
    photos_db_res = supabase.table("photos")\
        .select("*")\
            .in_("id",photo_ids)\
                .execute()
    photos = cast(list[dict],photos_db_res.data)            
    return {"message":"Matching photos fetched successfully","data":photos}                       

process_photo = cast(Task,_process_photo)

match_photo = cast(Task,_match_photo)