from fastapi import APIRouter,Depends,File,UploadFile,HTTPException,Form,Query
from lib.middleware import authMiddleware,organizerMiddleware
from lib.database import supabase
from typing import Annotated,cast
from celery_app import process_photo
from lib.utils import is_image
import uuid
    
photo_router = APIRouter(dependencies=[Depends(authMiddleware),Depends(organizerMiddleware)])

@photo_router.post("/upload")
async def upload(photos:Annotated[list[UploadFile],File()],event_id:Annotated[str,Form()]):
    #check if the files sent are image
    event_res = supabase.table("events")\
           .select("*")\
               .eq("id",event_id)\
                   .execute()
    event_data = cast(dict,event_res.data[0])
        
    if not event_data:
            raise HTTPException(status_code=404,detail="Event not found.")
         
    photo_contents=[]
    for photo in photos:
        contents = await photo.read()
        if not is_image(contents):
            raise HTTPException(status_code=415, detail=f"'{photo.filename}' is not a valid image.")
        photo_contents.append(contents)
    
    #process eah photo
    for photo, contents in zip(photos, photo_contents):  
        #upload the photo to supabase storage
        filename = photo.filename or f"{uuid.uuid4()}.jpg"
        content_type = photo.content_type or "image/jpeg"
        storage_path=filename
        try:
            supabase.storage.from_('photos').upload(filename, contents, {"content-type": content_type})
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                continue
            else:
                raise

        # Check if this photo is already in the db
        existing = supabase.table("photos")\
            .select("id")\
            .eq("storage_path", storage_path)\
            .execute()

        if existing.data:
            continue  # already processed, skip
        
        #add it in the db table
        db_response = supabase.table("photos").insert({
            "event_id": event_id,
            "storage_path":storage_path
        }).execute()
        
        photo_record = cast(dict,db_response.data[0])
        
        #send for processing to task
        process_photo.delay(storage_path,photo_record["id"],event_id)
        
    return {"message":"Processing Photo"}

@photo_router.get("/face-crops")
async def fetch_inconclusive_face_crops(event_id:Annotated[str,Query()]):
    db_res = supabase.table("face_crops")\
        .select("*")\
            .eq("event_id",event_id)\
                .eq("processed",False)\
                .execute()
    face_crops = cast(list[dict],db_res.data)
    return {"message":"Crops fetched successfully!","data":face_crops}
    
