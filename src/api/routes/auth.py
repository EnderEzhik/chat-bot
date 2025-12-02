from fastapi import APIRouter

from src.models.user import UserCreate


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
async def register(user_create: UserCreate):
    return { "user": user_create }


@router.post("/login")
async def login():
    return { "logged": True }
