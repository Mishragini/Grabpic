from celery import Celery,Task
from typing import cast
from lib.database import supabase
from lib.config import settings
import logging
import numpy as np
import inspireface as isf
import cv2
import uuid
import redis
import json
import base64

REDIS_HOST = settings.REDIS_HOST

#redis client for pubsub
redis_client = redis.Redis(host=REDIS_HOST,port=6379, db=2)

celery_app = Celery(
    "grabpic",
    broker=f"redis://{REDIS_HOST}:6379/0",
    backend=f"redis://{REDIS_HOST}:6379/1" 
)

#bind= True is for reading the task id 
@celery_app.task(bind=True)
def _process_photo(self,photos:list,event_id:str):
    task_id = self.request.id
    total = len(photos)
    
    # Create a session with face recognition features
    opt = isf.HF_ENABLE_FACE_RECOGNITION
    session = isf.InspireFaceSession(opt, isf.HF_DETECT_MODE_ALWAYS_DETECT)
    try:
        #process each photo
        for index,  content in enumerate(photos,start=1):  
            #upload the photo to supabase storage
            filename = content["filename"] or f"{uuid.uuid4()}.jpg"
            content_type = content["content_type"] or "image/jpeg"
            storage_path=f"{event_id}/{filename}"
            photo_url = f"{settings.SUPABASE_STORAGE_URL}/photos/{storage_path}"
            
            # decode once, reuse for both upload and face detection
            image_bytes = base64.b64decode(content["data"])
            try:
                supabase.storage.from_('photos').upload(storage_path, base64.b64decode(content["data"]), {"content-type": content_type})
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
                    "storage_path":storage_path,
                    "public_url":photo_url
                }).execute()
                photo_record = cast(dict,db_response.data[0])
                photo_id = photo_record["id"]
            
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
                   
                    face_crop_path = f"{event_id}/{photo_id}/{uuid.uuid4()}.jpg"
                    # filter on the basis of detection confidence -> store it in inconclusive storage for the orgnizer to review
                    if face.detection_confidence < 0.7:
                        supabase.storage.from_("inconclusive-crops").upload(
                            face_crop_path,
                            face_bytes,
                            {"content-type": "image/jpeg"}
                        )
                        inconclusive_crop_url = f"{settings.SUPABASE_STORAGE_URL}/inconclusive-crops/{face_crop_path}"
                        
                        supabase.table("face_crops").insert({
                            "photo_id":photo_id,
                            "storage_path":face_crop_path,
                            "event_id":event_id,
                            "embedding":embedding_list,
                            "public_url":inconclusive_crop_url
                        }).execute()
                    else:
                        face_crop_url = f"{settings.SUPABASE_STORAGE_URL}/face-crops/{face_crop_path}"
                        
                        supabase.storage.from_("face-crops").upload(
                            face_crop_path,
                            face_bytes,
                            {"content-type": "image/jpeg"}
                        )
                        db_response= supabase.table("face_profiles").insert({
                            "embedding":embedding_list,
                            "event_id":event_id,
                            "representative_crop_path":face_crop_path,
                            "public_url":face_crop_url           
                        }).execute()
                        profile = cast(dict,db_response.data[0]) 
                        matched_profile_id = profile["id"] 
                         
                if matched_profile_id:
                    # guard against duplicate face_photo_map inserts on reprocessed photos
                    supabase.table("face_photo_map").upsert({
                        "face_profile_id": matched_profile_id,
                        "photo_id": photo_id
                    }, on_conflict="face_profile_id,photo_id").execute()
                    
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
        
    finally:
        session.release()    
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
        return {"success": False, "error": "No matching profile found"}
    
    profile = match[0]
    
              
    return {"success": True,"message":"Matching photos fetched successfully","data":{"profile_id":profile["id"],"photo_url":profile["public_url"]}}                       

process_photo = cast(Task,_process_photo)

match_photo = cast(Task,_match_photo)