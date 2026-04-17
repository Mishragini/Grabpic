from fastapi import APIRouter,Depends,Query,HTTPException,Body,Request
from lib.middleware import authMiddleware,organizerMiddleware
from lib.database import supabase
from typing import Annotated,cast
from pydantic import BaseModel,UUID4
from lib.utils import check_event,fetch_event_profiles,success_response_handler
from lib.config import settings
import asyncio

organizer_profile_router=APIRouter(dependencies=[Depends(authMiddleware),Depends(organizerMiddleware)])

@organizer_profile_router.get("/")
async def fetch_profiles(req:Request,event_id:Annotated[str,Query()],page:Annotated[int,Query()],per_page:Annotated[int,Query()]):
    await check_event(event_id,req.state.user["id"])
              
    data= await fetch_event_profiles(event_id,page,per_page)
    
    return success_response_handler(message="Profiles fetched successfully",data={"profiles":data["profiles"],"hasMore":data["hasMore"]})

class RemoveDuplicateProfileReq(BaseModel):
    profile_id:str
    duplicate_profile_ids:list[str]
    
@organizer_profile_router.post("/duplicates/remove")
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
        await asyncio.to_thread(supabase.storage.from_("face-crops").remove,crop_paths)
    
    #rpc call to handle delete and update in transaction
    await asyncio.to_thread(
       supabase.rpc("remove_duplicate_profiles",{
           "p_profile_id":request.profile_id,
           "p_duplicate_ids":request.duplicate_profile_ids
       }).execute
    )
            
    return success_response_handler(message="Duplicate profiles removed successfully!")

class AssignProfileReq(BaseModel):
    profile_id: str| None = None
    face_crop_id:str
    
@organizer_profile_router.post("/face-crops")
async def assign_profile(request:Annotated[AssignProfileReq,Body()]):
    
    storage_path = None
    if request.profile_id:
        profile_db_res,crops_db_res = await asyncio.gather(
            #check if profile_id exists in the db
            asyncio.to_thread(supabase.table("face_profiles").select("storage_path").eq("id",request.profile_id).execute),
            #check if crop_id exists in the db
            asyncio.to_thread(supabase.table("face_crops")\
            .select("photo_id","embedding","event_id","storage_path")\
            .eq("id",request.face_crop_id)\
            .execute)
        )
        if not profile_db_res.data:
            raise HTTPException(status_code=404,detail=f"Profile with id:{request.profile_id} not found")
        else:
            storage_path = cast(dict,profile_db_res.data[0])["storage_path"] 
    
    else:
        #check if crop_id exists in the db
        crops_db_res = await asyncio.to_thread(supabase.table("face_crops")\
            .select("photo_id","embedding","event_id","storage_path")\
            .eq("id",request.face_crop_id)\
            .execute)
        
    if not crops_db_res.data:
        raise HTTPException(status_code=404, detail=f"Face crop with id:{request.face_crop_id} not found")
    
    crops_data = cast(dict,crops_db_res.data[0])  
           
    photo_id = crops_data["photo_id"]
    embedding = crops_data["embedding"]
    event_id = crops_data["event_id"]
    storage_path = crops_data["storage_path"]
    
    profile_id = request.profile_id 
    
    #if no profile_id was sent create a new profile 
    if request.profile_id is None:
        storage_image = await asyncio.to_thread(supabase.storage.from_("inconclusive-crops").download,storage_path)
        
        _, profile_db_res = await asyncio.gather(
           asyncio.to_thread(supabase.storage.from_("face-crops").upload,
            storage_path,
            storage_image),
            asyncio.to_thread(supabase.table("face_profiles").insert({
            "photo_id":photo_id,
            "embedding":embedding,
            "event_id":event_id,
            "representative_crop_path":storage_path,
            "public_url":f"{settings.SUPABASE_STORAGE_URL}/face-crops/{storage_path}"
        }).execute)
        )
        
        profile_data = cast(dict,profile_db_res.data[0])
        profile_id=profile_data["id"]
        
    await asyncio.to_thread(supabase.rpc("assign_profile",{
        "p_profile_id": profile_id,
        "p_photo_id":photo_id,
        "p_crop_id":request.face_crop_id,
    }).execute)    
    
    return success_response_handler(message="Profile assigned successfully",data={"profile_id":profile_id})  
            
@organizer_profile_router.get("/inconclusives")
async def fetch_inconclusive_profiles(req:Request,event_id:Annotated[str,Query()],page:Annotated[int,Query()]=0,per_page:Annotated[int,Query()]=10):
    await check_event(event_id,req.state.user["id"])
    
    db_res = await asyncio.to_thread(supabase.table("face_crops")\
        .select("id","public_url")\
            .eq("event_id",event_id)\
                .eq("processed",False)\
                .range(page*per_page,(page+1)*per_page)\
                .execute)
                
    face_crops = cast(list[dict],db_res.data)
        
    hasMore = len(face_crops)  > per_page
    
    face_crops[:per_page]
    
    return success_response_handler(message=f"Inconclusive crops for event:{event_id} fetched successfully",data={"face_crops":face_crops,"hasMore":hasMore})    