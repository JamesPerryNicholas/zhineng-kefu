from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import agent, chat, graph, rag

app = FastAPI(title="极速购 AI 客服系统")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat")
app.include_router(agent.router, prefix="/api/agent")
app.include_router(rag.router, prefix="/api/rag")
app.include_router(graph.router, prefix="/api/graph")


@app.get("/")
async def root():
    return {
        "service": "极速购 AI 客服系统",
        "version": "1.0.0",
        "routes": {
            "chat": "POST /api/chat/stream",
            "agent": "POST /api/agent/stream",
            "rag": "POST /api/rag/query",
            "graph": "POST /api/graph/stream",
        },
    }
