import jwt
from jwt import InvalidTokenError

from typing import Annotated

from fastapi import Depends, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import User
from src.models.token import TokenData
from src.core.database import SessionMaker
from src.core.security import oauth_scheme, SECRET_KEY, ALGORITHM
from src.repositories.users import get_user


async def get_session():
    async with SessionMaker() as session:
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_session)]


OAuthToken = Annotated[str, Depends(oauth_scheme)]


async def get_current_user(db_session: SessionDep, token: OAuthToken):
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials", headers={ "WWW-Authenticate": "Bearer"})

    try:
        payload = jwt.decode(jwt=token,
                             key=SECRET_KEY,
                             algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401)

        token_data = TokenData(user_id=user_id)
    except InvalidTokenError as ex:
        raise HTTPException(status_code=402)

    user = await get_user(db_session, int(token_data.user_id))
    if not user:
        raise HTTPException(status_code=403)

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
