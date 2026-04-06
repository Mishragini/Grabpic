from fastapi import APIRouter,HTTPException,Response
from pydantic import BaseModel,EmailStr
from enum import Enum
from lib.database import supabase
from jose import jwt
from lib.config import settings
from typing import cast
import bcrypt
import os

auth_router= APIRouter()

class Role(str,Enum):
    organizer="organizer"
    attendee="attendee"

class SignupRequest(BaseModel):
    username: str
    password:str
    full_name:str
    email:EmailStr
    role: Role
    
class LoginRequest(BaseModel):
    username:str
    password:str

@auth_router.post("/signup")
async def signup(user:SignupRequest,response:Response):
    existing_user = supabase.table("users")\
           .select("*")\
           .or_(f"email.eq.{user.email},username.eq.{user.username}")\
           .execute()
           
    if existing_user.data:
        raise HTTPException(status_code=400,detail="User already exists")
    
    hashed_password = bcrypt.hashpw(user.password.encode(),bcrypt.gensalt()).decode("utf-8")
    
    new_user = supabase.table("users").insert({
        "username": user.username,
       "email":user.email,
        "hashed_password": hashed_password,
        "role":user.role,
        "full_name":user.full_name
    }).execute()
    
    new_user_data: dict = cast(dict, new_user.data[0]) 
    
    token = jwt.encode({"user_id":new_user_data["id"]},settings.JWT_SECRET_KEY,settings.ALGORITHM)
    
    response.set_cookie(key="auth-token",value=token)
    
    return{"message":"User registered successfully!","data":{"token":token,"user_id":new_user_data["id"],"role":new_user_data["role"]}}

@auth_router.post("/login")
async def login(user:LoginRequest,response:Response):
    existing_user= supabase.table("users")\
        .select("hashed_password","id","role")\
        .eq("username",user.username)\
        .execute()
    existing_user_data = cast(dict,existing_user.data[0])
    
    password_match = bcrypt.checkpw(user.password.encode(),existing_user_data["hashed_password"].encode())  
    
    if not existing_user or not password_match:
        raise HTTPException(status_code=400,detail="Invalid Credentials")
    
    token = jwt.encode({"user_id":existing_user_data["id"]},settings.JWT_SECRET_KEY,settings.ALGORITHM)
    
    response.set_cookie(key="auth-token",value=token)
    
    return{"message":"Logged in successfully","data" : {"token":token,"user_id":existing_user_data["id"],"role":existing_user_data["role"]}}
    