from fastapi import APIRouter,Depends,Request
from pydantic import BaseModel
from lib.middleware import authMiddleware
from lib.database import supabase
from lib.utils  import generate_invite_code
from typing import cast

space_router = APIRouter(dependencies=[Depends(authMiddleware)])


class CreateSpaceRequest(BaseModel):
    name:str
           

@space_router.post("/spaces")
async def create_space(request:Request,space:CreateSpaceRequest):
    user = request.state.user
    
    #generate invite code 
    invite_code = generate_invite_code()
    
    supabase_res = supabase.table("events").insert({
        "name":space.name,
        "organizer_id":user["id"],
        "invite_code":invite_code
    }).execute()
    
    event_data = cast(dict,supabase_res.data[0])
    
    return{"message":"Event created successfully","data":event_data}