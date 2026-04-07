from fastapi import APIRouter,Depends,Query,HTTPException,Body
from lib.middleware import authMiddleware,organizerMiddleware
from lib.database import supabase
from typing import Annotated,cast
from pydantic import BaseModel,UUID4

profile_router=APIRouter(dependencies=[Depends(authMiddleware),Depends(organizerMiddleware)])

@profile_router.get("/")
async def fetch_profiles(event_id:Annotated[str,Query()]):
    event_db_res = supabase.table("events")\
        .select("*")\
            .eq("id",event_id)\
                .execute()
    if not event_db_res.data:
        raise HTTPException(status_code=404,detail=f"Event with {event_id} not found.") 
              
    profile_db_res = supabase.table("face_profiles")\
        .select("representative_crop_path")\
            .eq("event_id",event_id)\
                .execute()
    
    profile_data = cast(list[dict],profile_db_res.data)
    
    return{"message":"Profiles fetched successfully","data":profile_data}

class RemoveDuplicateProfileReq(BaseModel):
    profile_id:str
    duplicate_profile_ids:list[str]
    
@profile_router.post("/duplicates/remove")
async def remove_duplicate_profile(request: Annotated[RemoveDuplicateProfileReq, Body()]):
    # fetch all duplicate profiles
    profile_db_res = supabase.table("face_profiles")\
        .select("representative_crop_path")\
        .in_("id", request.duplicate_profile_ids)\
        .execute()
    
    # extract all crop paths from the list of results
    profiles_data = cast(list[dict], profile_db_res.data)
    crop_paths = [p["representative_crop_path"] for p in profiles_data]
    
    # delete all crops from storage in one call
    if crop_paths:
        supabase.storage.from_("face-crops").remove(crop_paths)
    
    # reassign all photo mappings to the main profile
    supabase.table("face_photo_map")\
        .update({"face_profile_id": request.profile_id})\
        .in_("face_profile_id", request.duplicate_profile_ids)\
        .execute()
    
    # delete all duplicate profiles
    supabase.table("face_profiles")\
        .delete()\
        .in_("id", request.duplicate_profile_ids)\
        .execute()
            
    return {"message": "Duplicate profile removed successfully!"}

class AssignProfileReq(BaseModel):
    profile_id: UUID4| None = None
    face_crop_id:UUID4
    
@profile_router.post("/face-crop")
async def assign_profile(request:Annotated[AssignProfileReq,Body()]):
    if request.profile_id:
        profile_db_res = supabase.table("face_profiles").select("*").eq("id",request.profile_id).execute()
        if not profile_db_res.data:
            raise HTTPException(status_code=404,detail=f"Profile with id:{request.profile_id} not found") 
        
    crops_db_res = supabase.table("face_crops")\
        .select("*")\
            .eq("id",request.face_crop_id)\
                .execute()
    if not crops_db_res.data:
        raise HTTPException(status_code=404, detail=f"Face crop with id:{request.face_crop_id} not found")
    
    crops_data = cast(dict,crops_db_res.data[0])  
           
    photo_id = crops_data["photo_id"]
    embedding = crops_data["embedding"]
    event_id = crops_data["event_id"]
    storage_path = crops_data["storage_path"]
    
    profile_id = request.profile_id 
    
    if request.profile_id is None:
        storage_image = supabase.storage.from_("inconclusive-crops").download(storage_path)
        supabase.storage.from_("face-crops").upload(
            storage_path,
            storage_image
        )
        profile_db_res = supabase.table("face_profiles").insert({
            "photo_id":photo_id,
            "embedding":embedding,
            "event_id":event_id,
            "representative_crop_path":storage_path
        }).execute()
        profile_data = cast(dict,profile_db_res.data[0])
        profile_id=profile_data["id"]
        
    supabase.table("face_photo_map").insert({
        "face_profile_id":str(profile_id),
        "photo_id":photo_id
    }).execute() 
    
    supabase.table("face_crops").update({"processed":True}).eq("id",request.face_crop_id).execute()   
            
    return{"message":"Profile assigned successfully","data":{"profile_id":profile_id}}