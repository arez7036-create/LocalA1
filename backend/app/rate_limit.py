from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import redis.asyncio as redis
from app.database import get_async_session
from app.auth import current_active_user
from app.models import User
from app.config import get_settings

settings = get_settings()

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

async def rate_limit_dependency(
    request: Request,
    user: User = Depends(current_active_user),
    db = Depends(get_async_session),
):
    if user.is_superuser or user.rate_limit == 0:
        return True
    
    limit = user.rate_limit or 50
    window = user.rate_window or 3600
    key = f"ratelimit:{user.id}"
    
    current = await redis_client.incr(key)
    if current == 1:
        await redis_client.expire(key, window)
    
    if current > limit:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: {limit} requests per {window}s"
        )
    return True