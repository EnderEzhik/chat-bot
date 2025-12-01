from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles


app = FastAPI()

app.mount("/static", StaticFiles(directory="src/static"), name="static")


@app.get("/")
async def index():
    return RedirectResponse("/static/index.html")


@app.post("/auth/register")
async def register():
    pass


@app.post("/auth/login")
async def login():
    pass


@app.post("/chat/message")
async def handle_message():
    pass


@app.get("/chat/history/{session_id}")
async def get_messages_history():
    pass


@app.post("/chat/session")
async def create_session():
    pass
