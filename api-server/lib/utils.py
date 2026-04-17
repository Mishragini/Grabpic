from fastapi import HTTPException
from fastapi.responses import JSONResponse
from lib.database import supabase
from typing import cast
import secrets
import magic
import asyncio

def generate_invite_code():
    return secrets.token_hex(6)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}

def is_image(file_bytes:bytes):
    mime = magic.from_buffer(file_bytes,mime=True)
    return mime in ALLOWED_CONTENT_TYPES

async def check_event(event_id:str,user_id:str):
    event_db_res = await asyncio.to_thread(supabase.table("events")\
        .select("id")\
            .eq("id",event_id)\
                .eq("organizer_id",user_id)\
                .execute)
                
    event = cast(dict,event_db_res.data[0])
    
    if not event:
        raise HTTPException(status_code=404,detail=f"Event with {event_id} not found")
    
    return event 

async def check_event_attendee(event_id:str):
    event_db_res = await asyncio.to_thread(supabase.table("events")\
        .select("id,name")\
            .eq("id",event_id)\
            .execute)   
            
    event = cast(dict,event_db_res.data[0])
    
    if not event:
        raise HTTPException(status_code=404,detail=f"Event not found")
    
    return event   

async def fetch_event_profiles(event_id:str,page:int,per_page:int):
    profile_db_res = await asyncio.to_thread(supabase.table("face_profiles")\
         .select("public_url","id")\
             .eq("event_id",event_id)\
                 .range(page*per_page,((page+1)* per_page))\
                 .execute)

    profile_data = cast(list[dict],profile_db_res.data)

    hasMore = len(profile_data) > per_page
    profiles = profile_data[:per_page]
            
    return{"profiles":profiles,"hasMore":hasMore}

async def delete_bucket_folder(bucket:str,folder_prefix:str):
    listed = await asyncio.to_thread(supabase.storage.from_(bucket).list,folder_prefix)
    
    if not listed:
        return
    
    file_paths = []
    subfolder_paths = []
    
    for item in listed:
        full_path = f"{folder_prefix}/{item['name']}"
        
        #item.get("id") returns null for folder and a real uuid for files
        if item.get("id") is None:
            subfolder_paths.append(full_path)
            
        else:
            file_paths.append(full_path)
            
    if file_paths:
        await asyncio.to_thread(supabase.storage.from_(bucket).remove,paths=file_paths)
    
    #face-crops and inconclusive-crops
    #recursive call with the folders prefix when only event_id is provided   
    for subfolder in subfolder_paths:
        await delete_bucket_folder(bucket,subfolder)
        
    return

def success_response_handler(data=None,message="Success",status_code=200):
    return JSONResponse(status_code=status_code,content={"message":message,"data":data})                                         