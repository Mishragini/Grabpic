from fastapi import APIRouter,UploadFile,File,Form,HTTPException,Request,Query,Depends
from typing import Annotated,cast
from celery_app import match_photo
from lib.utils import check_event_attendee
from lib.database import supabase
from lib.middleware import authMiddleware
import asyncio

attendee_profile_router = APIRouter(dependencies=[Depends(authMiddleware)])

@attendee_profile_router.post("/match-selfie")
async def match_selfie(photo:Annotated[UploadFile,File()],event_id:Annotated[str,Form()]):
    image_bytes = await photo.read()
    task = match_photo.delay(image_bytes,event_id)
    try:
        result = await asyncio.get_event_loop().run_in_executor(None,lambda:task.get(timeout=30,propagate=True))
    except ValueError as e :
            raise HTTPException(status_code=400,detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    if not isinstance(result,dict):
         raise HTTPException(status_code=500, detail="Unexpected result from task")
     
    return {"message": result["message"], "data": result["data"]}

#why would the attendee need the profiles -> maybe his selfie didnt match
@attendee_profile_router.get("/")
async def get_profiles(req:Request,invite_code:Annotated[str,Query()]):
    event = check_event_attendee(invite_code)
    
    event_name = event["name"]         
  
    profile_db_res = supabase.table("face_profiles")\
        .select("*")\
            .eq("event_id",event["id"])\
                .execute()
    
    profile_data = cast(list[dict],profile_db_res.data)  
    
    if not profile_data:
        raise HTTPException(status_code=404,detail=f"No profiles found for event:{event_name}")
    
    return {"message":"Profiles fetched successfully","data":profile_data}                