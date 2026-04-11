from fastapi import APIRouter,HTTPException,Response,Request,Depends,File,UploadFile,Form
from pydantic import BaseModel,EmailStr
from lib.types import Role
from lib.database import supabase
from lib.config import settings
from typing import cast,Annotated,Optional
from lib.middleware import authMiddleware
from lib.utils import is_image
import uuid
import jwt
import bcrypt

auth_router= APIRouter()
    
class LoginRequest(BaseModel):
    username:str
    password:str

@auth_router.post("/signup")
async def signup(response:Response,
    username: Annotated[str,Form()],
    password: Annotated[str,Form()],
    full_name:Annotated[str,Form()],
    email: Annotated[EmailStr,Form()],
    role: Role = Form(),
    image:Annotated[Optional[UploadFile],File()]=None,
    ):
    existing_user = supabase.table("users")\
           .select("*")\
           .or_(f"email.eq.{email},username.eq.{username}")\
           .execute()
           
    if existing_user.data:
        raise HTTPException(status_code=400,detail="User already exists")
    storage_path = None
    if image:
        image_content = await image.read()
        if not is_image(image_content):
            raise HTTPException(status_code=400,detail=f"{image.filename} is not a valid image.")
        storage_path = f"{uuid.uuid4()}image.filename" or f"{uuid.uuid4()}.{image.content_type}"
        supabase.storage.from_("user-avatars").upload(
            storage_path,
            image_content,
            {"content-type": image.content_type or "image/jpeg"}
        )
        
    
    hashed_password = bcrypt.hashpw(password.encode(),bcrypt.gensalt()).decode("utf-8")
    
    
    new_user = supabase.table("users").insert({
        "username": username,
        "email":email,
        "hashed_password": hashed_password,
        "role":role,
        "full_name":full_name,
        "avatar":storage_path
    }).execute()
    
    new_user_data: dict = cast(dict, new_user.data[0]) 
    
    token = jwt.encode({"user_id":new_user_data["id"],"role":new_user_data["role"]},settings.JWT_SECRET_KEY,settings.ALGORITHM)
    
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
    
    token = jwt.encode({"user_id":existing_user_data["id"],"role":existing_user_data["role"]},settings.JWT_SECRET_KEY,settings.ALGORITHM)
    
    response.set_cookie(key="auth-token",value=token)
    
    return{"message":"Logged in successfully","data" : {"token":token,"user_id":existing_user_data["id"],"role":existing_user_data["role"]}}


@auth_router.get("/me",dependencies=[Depends(authMiddleware)])
async def me(request:Request):
    user = request.state.user
    
    if not user:
        raise HTTPException(status_code=401,detail="Not authenticated")
    
    if user["avatar"]:
        avatar_url = supabase.storage.from_("user-avatars").get_public_url(user["avatar"])    
        user["avatar_url"] = avatar_url
        
    return{"message":"User fetched successfully","data":user}

@auth_router.get("/logout")
async def logout(response:Response):
    response.delete_cookie("auth-token")
    return {"message":"Logged out successfully!"}
