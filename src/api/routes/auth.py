from datetime import timedelta

from fastapi import APIRouter, status, HTTPException

from src.api.deps import SessionDep
from src.models.user import UserCreate, UserLogin
from src.models.token import Token
from src.repositories import users as user_repo
from src.core.security import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, verify_password


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(session: SessionDep, user_create: UserCreate):
    await user_repo.create_user(session, user_create)


@router.post("/login", response_model=Token)
async def login(session: SessionDep, user_login: UserLogin):
    auth_error = HTTPException(status_code=400, detail="Login or password incorrect")
    user = await user_repo.get_user_by_username(session, user_login.username)
    if not user:
        raise auth_error
    if not verify_password(user_login.password, user.hashed_password):
        raise auth_error

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(access_token=access_token, token_type="bearer")
