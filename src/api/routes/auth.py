from datetime import timedelta

from fastapi import APIRouter, HTTPException

from src.api.deps import SessionDep, OAuthDep
from src.models.user import UserCreate, User
from src.models.token import Token
from src.repositories import users as user_repo
from src.core.security import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, authenticate_user


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
async def register(session: SessionDep, user_create: UserCreate):
    await user_repo.create_user(session, user_create)
    return


@router.post("/login", response_model=Token)
async def login(session: SessionDep, form_data: OAuthDep):
    user = await user_repo.get_user(session, form_data.username)
    user = await authenticate_user(form_data.password, user)
    if not user:
        raise HTTPException(status_code=401, detail="Login or password incorrect", headers={"WWW-Authenticate": "Bearer"})

    access_token = create_access_token(
        data={"sub": user.login},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(access_token=access_token, token_type="bearer")
