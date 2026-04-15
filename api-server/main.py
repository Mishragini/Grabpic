from fastapi import FastAPI,WebSocket,WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from routers.auth import auth_router
from routers.organizer.space import organizer_space_router
from routers.organizer.photos import organizer_photo_router
from routers.attendee.photos import attendee_photo_router
from routers.organizer.profiles import organizer_profile_router
from routers.attendee.event import attendee_space_router
from routers.attendee.profile import attendee_profile_router
import redis.asyncio as aioredis
import json
import logging

logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],# In production, limit this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth_router,prefix="/api/auth")
app.include_router(organizer_space_router,prefix="/api/organizer/spaces")
app.include_router(organizer_photo_router,prefix="/api/organizer/photos")
app.include_router(attendee_photo_router,prefix="/api/attendee/photos")
app.include_router(organizer_profile_router,prefix="/api/organizer/profiles")
app.include_router(attendee_space_router,prefix="/api/attendee/spaces")
app.include_router(attendee_profile_router,prefix="/api/attendee/profiles")


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
        latest = await client.get(f"task:{task_id}:latest")
        if latest:
            await websocket.send_text(latest.decode())
    except WebSocketDisconnect:
        await pubsub.unsubscribe(f"task:{task_id}:progress")
        await client.aclose()
        return
    except Exception:
        logger.exception("redis get latest for task %s", task_id)

    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                payload = message["data"]
                if isinstance(payload, bytes):
                    await websocket.send_text(payload.decode())
                else:
                    await websocket.send_text(str(payload))
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("progress pubsub stream failed task_id=%s", task_id)
        try:
            await websocket.send_text(json.dumps({"error": True}))
        except WebSocketDisconnect:
            pass
    finally:
        await pubsub.unsubscribe(f"task:{task_id}:progress")
        await client.aclose()