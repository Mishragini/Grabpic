from celery import Celery,Task
from typing import cast
from lib.database import supabase
from typing import cast
import numpy as np
import inspireface as isf
import cv2
import uuid

celery_app = Celery(
    "grabpic",
    broker="redis://localhost:6379/0",
)

@celery_app.task
def _process_photo(storage_path:str,photo_id:str):
    #fetch the image bytes from supabase storage
    image_bytes = supabase.storage.from_("photos").download(storage_path)
    #convert the image bytes to image array for cv2 to decode 
    image_array = np.frombuffer(image_bytes,dtype=np.uint8)
    # Load the image using OpenCV.
    image = cv2.imdecode(image_array,cv2.IMREAD_COLOR)
    
    if image is None:
        raise ValueError(f"Failed to decode image from storage path: {storage_path}")
    
    # Create a session with face recognition features
    opt = isf.HF_ENABLE_FACE_RECOGNITION
    session = isf.InspireFaceSession(opt, isf.HF_DETECT_MODE_ALWAYS_DETECT)

    # Perform face detection on the image.
    faces = session.face_detection(image)
    
    if not faces:
        return
    
    for face in faces:
        #get the embedding of the face
        embedding = session.face_feature_extract(image,face)
        embedding_list = embedding.tolist()
        
        #get the matching profile for the face embeddig via supabase defined function
        result = supabase.rpc("match_face_profile", {
            "query_embedding": embedding_list,
            "match_threshold": 0.45,
        }).execute()
        
        matches = cast(list[dict], result.data)

        if matches:
            matched_profile_id = matches[0]["id"]
        else:
            matched_profile_id = None
               
        if  matched_profile_id is None:
            #get the face crop 
            x1,y1,x2,y2=face.location
            face_crop = image[y1:y2,x1:x2]   
            _,buffer = cv2.imencode(".jpg",face_crop)
            face_bytes = buffer.tobytes()
            face_crop_path = f"{uuid.uuid4()}/{storage_path.replace('/','_')}.jpeg"
            
            # filter on the basis of detection confifence -> store it in inconclsive storage for the orgnizer to review
            if face.detection_confidence < 0.7:
                supabase.storage.from_("inconclusive-crops").upload(
                    face_crop_path,
                    face_bytes,
                    {"content-type": "image/jpeg"}
                )
            else:
                supabase.storage.from_("face-crops").upload(
                    face_crop_path,
                    face_bytes,
                    {"content-type": "image/jpeg"}
                )
                db_response= supabase.table("face_profiles").insert({
                    "embedding":embedding_list,
                    "photo_id":photo_id,
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
    
    return

process_photo = cast(Task,_process_photo)