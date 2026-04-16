from fastapi import APIRouter,Depends,File,UploadFile,HTTPException,Form,Query,Request,Response
from lib.middleware import authMiddleware,organizerMiddleware
from lib.database import supabase
from typing import Annotated,cast
from celery_app import process_photo
from lib.utils import is_image,check_event,delete_bucket_folder
import base64
import asyncio
    
organizer_photo_router = APIRouter(dependencies=[Depends(authMiddleware),Depends(organizerMiddleware)])

@organizer_photo_router.post("/upload")
async def upload(req:Request,photos:Annotated[list[UploadFile],File()],event_id:Annotated[str,Form()]):
    check_event(event_id,req.state.user["id"])
         
    photo_contents=[]
    
    #check if the files sent are image
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
async def fetch_inconclusive_face_crops(req:Request,event_id:Annotated[str,Query()]):
    check_event(event_id,req.state.user["id"])
    db_res = supabase.table("face_crops")\
        .select("*")\
            .eq("event_id",event_id)\
                .eq("processed",False)\
                .execute()
    face_crops = cast(list[dict],db_res.data)
    return {"message":"Crops fetched successfully!","data":face_crops}
    
@organizer_photo_router.get("/")
async def fetch_event_photos(req:Request,event_id:Annotated[str,Query()],page:Annotated[int,Query()]=0,per_page:Annotated[int,Query()]=10):
    check_event(event_id,req.state.user["id"])
    
    photos_db_res = supabase.table("photos")\
        .select("*")\
            .eq("event_id",event_id)\
                .range(page*per_page,(page+1)*per_page)\
                .execute()
    
    photos = cast(list[dict],photos_db_res.data)
    
    for photo in photos:
        url = supabase.storage.from_("photos").get_public_url(photo["storage_path"])
        photo["photo_url"] = url
        
    hasMore = False    
        
    if len(photos) > per_page:
        photos.pop()
        hasMore = True    

    return {"message":f"Photos for event {event_id} fetched successfully","data":photos,"hasMore":hasMore}


@organizer_photo_router.delete("/{photo_id}",status_code=204)  
async def delete_photo(req:Request,photo_id:str,event_id:Annotated[str,Query()]):
    check_event(event_id,req.state.user["id"])
    
    photo_db_res = supabase.table("photos")\
        .select("id","storage_path")\
            .eq("id",photo_id)\
                .eq("event_id",event_id)\
                    .execute()
                    
    if not photo_db_res.data:
        raise HTTPException(status_code=400,detail="Photo not found")
    
    photo = cast(dict,photo_db_res.data[0])
    
    await asyncio.gather(
        asyncio.to_thread(delete_bucket_folder,"photos",photo["storage_path"]),
        asyncio.to_thread(delete_bucket_folder,"face-crops",f"{event_id}/{photo_id}"),
        asyncio.to_thread(delete_bucket_folder,"inconclusive-crops",f"{event_id}/{photo_id}")
    )
    
    supabase.table("photos").delete().eq("id",photo_id).execute()                    