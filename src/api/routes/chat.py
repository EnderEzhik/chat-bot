from fastapi import APIRouter

from src.api.deps import CurrentUser, SessionDep
from src.models.message import MessageCreate, MessageOut
from src.repositories.sessions import create_session, get_session
from src.repositories.messages import save_message, get_messages_by_session_id, delete_messages_by_session_id
from src.services import bot


router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/session")
async def session(current_user: CurrentUser, session: SessionDep):
    session = await create_session(session, current_user.id)
    return session


@router.post("/message", status_code=201)
async def handle_message(_: CurrentUser, session: SessionDep, message_create: MessageCreate):
    _ = await get_session(session, message_create.session_id)

    await save_message(session, message_create)
    if message_create.sender_type == "bot":
        return

    bot_answer = bot.get_bot_answer(message_create.text)
    bot_message_create = MessageCreate(session_id=message_create.session_id, sender_type="bot", text=bot_answer)
    await save_message(session, bot_message_create)

    return bot_answer


@router.get("/history/{session_id}", response_model=list[MessageOut])
async def get_messages_history(_: CurrentUser, session: SessionDep, session_id: str):
    _ = await get_session(session, session_id)
    messages = await get_messages_by_session_id(session, session_id)
    return messages


@router.delete("/history/{session_id}")
async def delete_messages_history(_: CurrentUser, session: SessionDep, session_id: str):
    _ = await get_session(session, session_id)
    await delete_messages_by_session_id(session, session_id)
