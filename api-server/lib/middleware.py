from fastapi import Request,HTTPException
from jose import jwt,JWTError
from lib.config import settings
from lib.database import supabase
from typing import cast 

async def authMiddleware(request:Request):
    auth_token = request.cookies.get("auth-token")
    if not auth_token:
        raise HTTPException(status_code=401,detail="Unauthenticated!")
    try:
        decoded_token = jwt.decode(auth_token,settings.JWT_SECRET_KEY,settings.ALGORITHM)
        print("decoded_token",decoded_token)
    except JWTError:
        raise HTTPException(status_code=401,detail="Invalid token!")    
  
    user = supabase.table("users")\
            .select("*")\
            .eq("id",decoded_token["user_id"])\
            .execute()
            
    if not user.data:
        raise HTTPException(status_code=401, detail="User not found!")
        
    user_data:dict = cast(dict,user.data[0])        
    request.state.user = user_data    
    
    return; 
            