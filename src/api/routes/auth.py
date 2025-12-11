from datetime import timedelta

from fastapi import APIRouter, status, HTTPException

from src.api.deps import SessionDep
from src.core.security import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, verify_password
from src.models.token import Token
from src.models.user import UserCreate
from src.repositories import users as user_repo


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(session: SessionDep, user_create: UserCreate):
    user = await user_repo.get_user_by_username(session, user_create.username)
    if user:
        raise HTTPException(status_code=400, detail="Username is already in use")
    await user_repo.create_user(session, user_create)


@router.post("/login", response_model=Token)
async def login(session: SessionDep, user_login: UserCreate):
    auth_error = HTTPException(status_code=401, detail="Login or password incorrect")

    user = await user_repo.authenticate(session, user_login.username, user_login.password)
    if not user:
        raise auth_error

    access_token = create_access_token(
        data={"username": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(access_token=access_token, token_type="bearer")
