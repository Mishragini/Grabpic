from fastapi import APIRouter,Query,Depends,HTTPException
from typing import Annotated
from lib.utils import check_event_attendee,success_response_handler
from lib.middleware import authMiddleware
from typing import cast
from lib.database import supabase
import asyncio

attendee_space_router = APIRouter(dependencies=[Depends(authMiddleware)])

@attendee_space_router.get("/")
async def get_event(invite_code:Annotated[str,Query()]):
    event_db_res = await asyncio.to_thread(supabase.table("events")\
        .select("id","name")\
            .eq("invite_code",invite_code)\
                .execute)
                
    if not event_db_res.data:
        raise HTTPException(status_code=404,detail="Event not found") 
    
    event= cast(dict,event_db_res.data[0])  
    
    data = {"event":event}
    return success_response_handler(data=data,message="Event fetched successfully")

# don't need this endpoint -> TODO: after confirmation ,make changes in fe and delete it
@attendee_space_router.get("/{event_id}")
async def fetch_space(event_id:str):
    event = await check_event_attendee(event_id)
    
    data = {"event":event}
    
    return success_response_handler(data=data,message=f"Event with {event_id} fetched successfully!")