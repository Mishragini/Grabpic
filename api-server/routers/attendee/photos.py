from fastapi import APIRouter,Depends,File,UploadFile,HTTPException,Query,Form,Request
from lib.middleware import authMiddleware
from typing import Annotated,cast
from lib.database import supabase
from lib.utils import success_response_handler
import asyncio

attendee_photo_router = APIRouter(dependencies=[Depends(authMiddleware)])

@attendee_photo_router.get("/")
async def fetch_photos_from_profile(profile_id:Annotated[str,Query()],page:Annotated[int,Query()]=0,per_page:Annotated[int,Query()]=10):        
    map_db_res = await asyncio.to_thread(supabase.table("face_photo_map")\
        .select("photo_id")\
            .eq("face_profile_id",profile_id)\
                .range(page*per_page,(page+1)*per_page)\
                .execute)
                
    map_data = cast(list[dict],map_db_res.data)
    photo_ids = [row["photo_id"] for row in map_data]
    
    photos_db_res = await asyncio.to_thread(supabase.table("photos")\
        .select("id","public_url")\
            .in_("id",photo_ids)\
                .execute)
    photos = cast(list[dict],photos_db_res.data)
    
    hasMore = len(photos) > per_page
    photos=photos[:per_page]
    
    data = {"photos":photos,"hasMore":hasMore}   
     
    return success_response_handler(data=data,message=f"Photos for profile:${profile_id} fetched successfully!")