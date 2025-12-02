from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker


engine = create_async_engine("sqlite+aiosqlite:///db.db", echo=True)
SessionMaker = async_sessionmaker(bind=engine, expire_on_commit=False)


async def get_session():
    async with SessionMaker() as session:
        yield session
