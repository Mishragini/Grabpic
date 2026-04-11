from fastapi import APIRouter,Depends,File,UploadFile,HTTPException,Form,Query
from lib.middleware import authMiddleware,organizerMiddleware
from lib.database import supabase
from typing import Annotated,cast
from celery_app import process_photo
from lib.utils import is_image
import base64
    
organizer_photo_router = APIRouter(dependencies=[Depends(authMiddleware),Depends(organizerMiddleware)])

@organizer_photo_router.post("/upload")
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
        photo_contents.append({
            "filename": photo.filename,
            "content_type": photo.content_type,
            "data": base64.b64encode(contents).decode("utf-8")  # JSON-safe
        })
    
    task = process_photo.delay(photo_contents,event_id)
        
    return {"message":"Processing Photo","task_id":task.id}

@organizer_photo_router.get("/face-crops")
async def fetch_inconclusive_face_crops(event_id:Annotated[str,Query()]):
    db_res = supabase.table("face_crops")\
        .select("*")\
            .eq("event_id",event_id)\
                .eq("processed",False)\
                .execute()
    face_crops = cast(list[dict],db_res.data)
    return {"message":"Crops fetched successfully!","data":face_crops}
    
