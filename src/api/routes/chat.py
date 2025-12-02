from fastapi import APIRouter


router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/message")
async def handle_message():
    pass


@router.get("/history/{session_id}")
async def get_messages_history():
    pass


@router.post("/session")
async def create_session():
    pass
