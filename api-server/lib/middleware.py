from fastapi import Request,HTTPException
import jwt
from lib.config import settings
from lib.database import supabase
from lib.types import Role
from typing import cast 

async def authMiddleware(request:Request):
    auth_token = request.cookies.get("auth-token")
    if not auth_token:
        raise HTTPException(status_code=401,detail="Unauthenticated!")
    try:
        decoded_token = jwt.decode(auth_token,settings.JWT_SECRET_KEY,settings.ALGORITHM)
    except:
        raise HTTPException(status_code=401,detail="Invalid token!")    
  
    user = supabase.table("users")\
            .select("*")\
            .eq("id",decoded_token["user_id"])\
            .execute()
            
    if not user.data:
        raise HTTPException(status_code=401, detail="User not found!")
        
    user_data:dict = cast(dict,user.data[0])
    request.state.user = user_data    
    
    return 

async def organizerMiddleware(request:Request):
    user = request.state.user
    
    if not user or not user["role"] == Role.organizer:
        raise HTTPException(status_code=401, detail="Access denied")
    
    return
            