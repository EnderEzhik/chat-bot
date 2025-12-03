from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import UserCreate
from src.core.database import get_session
from src.repositories import users as user_repo


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
async def register(user_create: UserCreate, session: AsyncSession = Depends(get_session)):
    return await user_repo.create_user(session, user_create)


@router.post("/login")
async def login():
    return { "logged": True }
