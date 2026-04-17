from fastapi import Request,HTTPException
import jwt
from lib.config import settings
from lib.database import supabase
from lib.types import Role
from typing import cast
import asyncio 

_UNAUTHED = HTTPException(status_code=401,detail="Unauthenticated!")

async def authMiddleware(request:Request):
    auth_token = request.cookies.get("auth-token")
    if not auth_token:
        raise _UNAUTHED
    try:
        decoded_token = jwt.decode(auth_token,settings.JWT_SECRET_KEY,algorithms=[settings.ALGORITHM])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        raise _UNAUTHED   
  
    user = await asyncio.to_thread(supabase.table("users")\
            .select("id","username","role","avatar_url")\
            .eq("id",decoded_token["user_id"])\
            .execute)
            
    if not user.data:
        raise _UNAUTHED
        
    user_data:dict = cast(dict,user.data[0])
    request.state.user = user_data    
    
    return 

async def organizerMiddleware(request:Request):
    user = request.state.user
    
    if not user or not user["role"] == Role.organizer:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    return
            