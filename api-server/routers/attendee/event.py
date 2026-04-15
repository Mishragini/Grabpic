from fastapi import APIRouter,Query,Depends,HTTPException
from typing import Annotated
from lib.utils import check_event_attendee
from lib.middleware import authMiddleware
from typing import cast
from lib.database import supabase

attendee_space_router = APIRouter(dependencies=[Depends(authMiddleware)])

@attendee_space_router.get("/")
async def get_event(invite_code:Annotated[str,Query()]):
    event_db_res = supabase.table("events")\
        .select("*")\
            .eq("invite_code",invite_code)\
                .execute()
                
    if not event_db_res:
        raise HTTPException(status_code=404,detail="Event not found") 
    
    event= cast(dict,event_db_res.data[0])  
           
    return {"message":"Event fetched successfully","data":event}


@attendee_space_router.get("/{event_id}")
async def fetch_space(event_id:str):
    event = check_event_attendee(event_id)
    return {"message":f"Event with {event_id} fetched successfully!","data":event}   