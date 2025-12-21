from datetime import timedelta

from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm

from src.api.deps import SessionDep
from src.core.security import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token
from src.models.token import Token
from src.models.user import UserCreate
from src.repositories import users as user_repo

from loguru import logger


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(session: SessionDep, user_create: UserCreate):
    user = await user_repo.get_user_by_username(session, user_create.username)
    if user:
        logger.info(f"Попытка зарегистрироваться под занятым логином: {user_create.username}")
        raise HTTPException(status_code=400, detail="Username is already in use")
    logger.info(f"Успешная регистрация под логином: {user_create.username}")
    await user_repo.create_user(session, user_create)


@router.post("/login", response_model=Token)
async def login(session: SessionDep, user_login: UserCreate):
    user = await user_repo.authenticate(session, user_login.username, user_login.password)
    if not user:
        logger.warning(f"Неудачная попытка входа: {user_login.username}")
        raise HTTPException(status_code=401, detail="Login or password incorrect")
    access_token = create_access_token(
        data={"username": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    logger.info(f"Пользователь успешно вошел в систему: {user.username}")
    return Token(access_token=access_token)


@router.post("/token", response_model=Token)
async def login_for_access_token(
    session: SessionDep,
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = await user_repo.authenticate(session, form_data.username, form_data.password)
    if not user:
        logger.warning(f"Неудачная попытка входа: {form_data.username}")
        raise HTTPException(status_code=401, detail="Login or password incorrect")

    access_token = create_access_token(
        data={"username": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    logger.info(f"Пользователь успешно вошел в систему: {user.username}")
    return Token(access_token=access_token)
