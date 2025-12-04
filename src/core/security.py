import jwt

from datetime import datetime, timedelta, timezone

from fastapi.security import OAuth2PasswordBearer

from sqlalchemy.ext.asyncio import AsyncSession

from pwdlib import PasswordHash

from src.models.user import UserInDB


SECRET_KEY = "secret_key_change_it_later"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


password_hash = PasswordHash.recommended()

oauth_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password, hashed_password) -> bool:
    return password_hash.verify(plain_password, hashed_password)


async def authenticate_user(password: str, user: UserInDB | None):
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
