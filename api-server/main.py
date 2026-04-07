from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from routers.auth import auth_router
from routers.space import space_router
from routers.photo import photo_router
from routers.profiles import profile_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],# In production, limit this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth_router,prefix="/api/auth")
app.include_router(space_router,prefix="/api/spaces")
app.include_router(photo_router,prefix="/api/photos")
app.include_router(profile_router,prefix="/api/profiles")

@app.get("/")
async def root():
    return {"message":"Server is up!"}