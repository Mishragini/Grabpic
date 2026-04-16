from fastapi import HTTPException
from lib.database import supabase
from typing import cast
import secrets
import magic

def generate_invite_code():
    return secrets.token_hex(6)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}

def is_image(file_bytes:bytes):
    mime = magic.from_buffer(file_bytes,mime=True)
    return mime in ALLOWED_CONTENT_TYPES

def check_event(event_id:str,user_id:str):
    event_db_res = supabase.table("events")\
        .select("*")\
            .eq("id",event_id)\
                .eq("organizer_id",user_id)\
                .execute()
                
    event = cast(dict,event_db_res.data[0])
    
    if not event:
        raise HTTPException(status_code=404,detail=f"Event with {event_id} not found")
    
    return event 

def check_event_attendee(event_id:str):
    event_db_res = supabase.table("events")\
        .select("*")\
            .eq("id",event_id)\
            .execute()   
            
    event = cast(dict,event_db_res.data[0])
    
    if not event:
        raise HTTPException(status_code=404,detail=f"Event not found")
    
    return event   

def fetch_event_profiles(event_id:str,page:int,per_page:int):
    profile_db_res = supabase.table("face_profiles")\
         .select("representative_crop_path","id")\
             .eq("event_id",event_id)\
                 .range(page*per_page,((page+1)* per_page))\
                 .execute()

    profile_data = cast(list[dict],profile_db_res.data)

    hasMore = False

    if len(profile_data) > per_page:
        hasMore = True
        profile_data.pop()
    if profile_data:
        for profile in profile_data:
            url = supabase.storage.from_("face-crops").get_public_url(profile["representative_crop_path"])
            profile["photo_url"] = url
            
    return{"profiles":profile_data,"hasMore":hasMore}

def delete_bucket_folder(bucket:str,folder_prefix:str):
    listed = supabase.storage.from_(bucket).list(folder_prefix)
    
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
        supabase.storage.from_(bucket).remove(paths=file_paths)
    
    #face-crops and inconclusive-crops
    #recursive call with the folders prefix when only event_id is provided   
    for subfolder in subfolder_paths:
        delete_bucket_folder(bucket,subfolder)                                 