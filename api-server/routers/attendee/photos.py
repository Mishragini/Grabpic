from fastapi import APIRouter,Depends,File,UploadFile,HTTPException,Query,Form,Request
from lib.middleware import authMiddleware
from typing import Annotated,cast
from lib.database import supabase

attendee_photo_router = APIRouter(dependencies=[Depends(authMiddleware)])

@attendee_photo_router.get("/")
async def fetch_photos_from_profile(profile_id:Annotated[str,Query()],page:Annotated[int,Query()]=0,per_page:Annotated[int,Query()]=10):
    
    profile_db_res = supabase.table("face_profiles")\
        .select("*")\
            .eq("id",profile_id)\
                .execute()
    
    if not profile_db_res.data:
        raise HTTPException(status_code=404,detail=f"Profile with id:{profile_id} not found")
        
    map_db_res = supabase.table("face_photo_map")\
        .select("photo_id")\
            .eq("face_profile_id",profile_id)\
                .execute()
                
    map_data = cast(list[dict],map_db_res.data)
    photo_ids = [row["photo_id"] for row in map_data]
    
    photos_db_res = supabase.table("photos")\
        .select("*")\
            .in_("id",photo_ids)\
                .range(page*per_page,(page+1)*per_page)\
                .execute()
    photos = cast(list[dict],photos_db_res.data)
    
    hasMore = False
    
    if len(photos)>per_page:
        hasMore = True
    
    for photo in photos:
        url = supabase.storage.from_("photos").get_public_url(photo["storage_path"]) 
        photo["photo_url"] = url
        
        
    return {"message":f"Photos for profile:${profile_id}fetched successfully!","data":photos,"hasMore":hasMore}             