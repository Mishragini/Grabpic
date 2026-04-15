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