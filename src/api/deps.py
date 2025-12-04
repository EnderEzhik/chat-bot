from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordRequestForm

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import SessionMaker


async def get_session():
    async with SessionMaker() as session:
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_session)]


OAuthDep = Annotated[OAuth2PasswordRequestForm, Depends()]
