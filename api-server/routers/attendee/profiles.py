from fastapi import APIRouter,UploadFile,File,Form,HTTPException,Request,Query,Depends
from typing import Annotated,cast
from celery_app import match_photo
from lib.utils import check_event_attendee,fetch_event_profiles
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
async def get_profiles(event_id:Annotated[str,Query()],page:Annotated[int,Query()],per_page:Annotated[int,Query()]):
    check_event_attendee(event_id)
    
    data= fetch_event_profiles(event_id,page,per_page)
    
    return{"message":"Profiles fetched successfully","data":data["profiles"],"hasMore":data["hasMore"]}