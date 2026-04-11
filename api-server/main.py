from fastapi import FastAPI,WebSocket,WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from routers.auth import auth_router
from routers.space import space_router
from routers.photo.organizer import organizer_photo_router
from routers.photo.attendee import attendee_photo_router
from routers.profiles import profile_router
import redis.asyncio as aioredis
import json

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
app.include_router(organizer_photo_router,prefix="/api/organizer/photos")
app.include_router(attendee_photo_router,prefix="/api/attendee/photos")
app.include_router(profile_router,prefix="/api/profiles")

@app.get("/")
async def root():
    return {"message":"Server is up!"}

@app.websocket("/ws/progress/{task_id}")
async def websocket_endpoint(websocket:WebSocket,task_id:str):
    await websocket.accept()
    client = aioredis.Redis(host="localhost", port=6379, db=2)
    pubsub= client.pubsub()
    await pubsub.subscribe(f"task:{task_id}:progress")
    
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                await websocket.send_text(message["data"].decode())
    #to handle when the client has disconnected            
    except WebSocketDisconnect:
        pass
    #redis itself goes down or connection error mid steam 
    except Exception as e:
        print(f"Unexpected error in websocket handler: {e}")
        await websocket.send_text(json.dumps({"status": "error"}))
    finally:
        await pubsub.unsubscribe(f"task:{task_id}:progress")   
        await client.aclose()         