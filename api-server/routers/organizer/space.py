from fastapi import APIRouter,Depends,Request,Query,Body,HTTPException,Response
from pydantic import BaseModel
from lib.middleware import authMiddleware,organizerMiddleware
from lib.database import supabase
from lib.utils  import generate_invite_code,check_event,delete_bucket_folder
from typing import cast,Annotated
import asyncio

organizer_space_router = APIRouter(dependencies=[Depends(authMiddleware),Depends(organizerMiddleware)])

class CreateSpaceRequest(BaseModel):
    name:str
           

@organizer_space_router.post("/")
async def create_space(request:Request,space:Annotated[CreateSpaceRequest,Body()]):
    user = request.state.user
    
    event_db_res = supabase.table("events")\
        .select("*")\
            .eq("organizer_id",user["id"])\
                .eq("name",space.name)\
                    .execute()
    
    if event_db_res.data:
        raise HTTPException(status_code=409,detail=f"Event with name:{space.name} already exists!")                
    
    #generate invite code 
    invite_code = generate_invite_code()
    
    supabase_res = supabase.table("events").insert({
        "name":space.name,
        "organizer_id":user["id"],
        "invite_code":invite_code
    }).execute()
    
    event_data = cast(dict,supabase_res.data[0])
    
    return{"message":"Event created successfully","data":event_data}

@organizer_space_router.get("/")
async def fetch_spaces(request:Request,page:Annotated[int,Query()]=0,per_page:Annotated[int,Query()]=5):
    user = request.state.user
    
    space_db_res = supabase.table("events")\
        .select("*")\
            .eq("organizer_id",user["id"])\
                .range(page*per_page,((page + 1) * per_page) - 1)\
                .execute()
    
    space_data = cast(list[dict],space_db_res.data)        
               
    return {"message":"Events fetched successfully","data":space_data}


@organizer_space_router.get("/{event_id}")
async def fetch_space(req:Request,event_id:str):
    check_event(event_id,req.state.user["id"])
    
    db_res = supabase.table("events")\
        .select("id","invite_code","name")\
            .eq("id",event_id)\
                .execute()
                
    event = cast(dict,db_res.data[0])
    
    return {"message":f"Event with {event_id} fetched successfully!","data":event}

@organizer_space_router.delete("/{event_id}",status_code=204)
async def delete_event(req:Request,event_id:str):
    check_event(event_id,req.state.user["id"])
    
    await asyncio.gather(
        asyncio.to_thread(delete_bucket_folder,"photos",event_id),
        asyncio.to_thread(delete_bucket_folder,"face-crops",event_id),
        asyncio.to_thread(delete_bucket_folder,"inconclusive-crops",event_id)
    )
    
    supabase.table("events").delete().eq("id",event_id).execute()  