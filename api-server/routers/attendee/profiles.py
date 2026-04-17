from fastapi import APIRouter,UploadFile,File,Form,HTTPException,Query,Depends
from typing import Annotated,cast
from celery_app import match_photo
from lib.utils import check_event_attendee,fetch_event_profiles,success_response_handler
from lib.middleware import authMiddleware
import asyncio

attendee_profile_router = APIRouter(dependencies=[Depends(authMiddleware)])

@attendee_profile_router.post("/match-selfie")
async def match_selfie(photo:Annotated[UploadFile,File()],event_id:Annotated[str,Form()]):
    image_bytes = await photo.read()
    task = match_photo.delay(image_bytes,event_id)
    try:
        result = await asyncio.get_running_loop().run_in_executor(None,lambda:task.get(timeout=30,propagate=True))
    except ValueError as e :
            raise HTTPException(status_code=400,detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Something went wrong!")
    
    if not isinstance(result,dict):
         raise HTTPException(status_code=500, detail="Something went wrong!")
    
    return success_response_handler(message = result["message"], data = result["data"]) 

#why would the attendee need the profiles -> maybe his selfie didnt match
@attendee_profile_router.get("/")
async def get_profiles(event_id:Annotated[str,Query()],page:Annotated[int,Query()],per_page:Annotated[int,Query()]):
    await check_event_attendee(event_id)
    
    data= await fetch_event_profiles(event_id,page,per_page)
    
    return success_response_handler(data=data,message="Profiles fetched successfully.")