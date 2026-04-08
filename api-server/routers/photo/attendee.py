from fastapi import APIRouter,Depends,File,UploadFile,HTTPException,Query
from lib.middleware import authMiddleware
from typing import Annotated,cast
from celery_app import match_photo
from pydantic import UUID4
from lib.database import supabase
import asyncio

attendee_photo_router = APIRouter(dependencies=[Depends(authMiddleware)])

@attendee_photo_router.post("/match-selfie")
async def match_selfie(photo:Annotated[UploadFile,File()]):
    image_bytes = await photo.read()
    task = match_photo.delay(image_bytes)
    try:
        result = await asyncio.get_event_loop().run_in_executor(None,lambda:task.get(timeout=30,propagate=True))
    except ValueError as e :
            raise HTTPException(status_code=400,detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    if not isinstance(result,dict):
         raise HTTPException(status_code=500, detail="Unexpected result from task")
     
    return {"message": result["message"], "photos": result["data"]}

@attendee_photo_router.get("/profiles")
async def get_profiles(event_id:Annotated[UUID4,Query()]):
    event_db_res = supabase.table("events")\
        .select("*")\
            .eq("id",event_id)\
                .execute()
    event_data = cast(list[dict],event_db_res.data)   
    
    if not event_data :
        raise HTTPException(status_code=404,detail=f"Event with id:{event_id} not found")
    
    event_name = event_data[0]["name"]         
  
    profile_db_res = supabase.table("face_profiles")\
        .select("*")\
            .eq("event_id",event_id)\
                .execute()
    
    profile_data = cast(list[dict],profile_db_res.data)  
    
    if not profile_data:
        raise HTTPException(status_code=404,detail=f"No profiles found for event:{event_name}")
    
    return {"message":"Profiles fetched successfully","data":profile_data}                
            