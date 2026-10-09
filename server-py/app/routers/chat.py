"""
第一章：FastAPI 路由
GET  /api/chat/health  - 健康检查
POST /api/chat         - 普通对话（一次性返回）
POST /api/chat/stream  - 流式对话（SSE）
"""
import json
from datetime import datetime

from fastapi import APIRouter
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from app.chains.basic_chat import (
    customer_service_chain,
    customer_service_stream_chain,
    format_history,
)

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


def _now():
    return datetime.now().strftime("%Y/%m/%d %H:%M:%S")


# ─── 健康检查 ────────────────────────────────────────────────────
@router.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


# ─── 普通对话接口 ────────────────────────────────────────────────
@router.post("")
async def chat(req: ChatRequest):
    if not req.message:
        return JSONResponse(status_code=400, content={"error": "message 字段不能为空"})

    try:
        response = await customer_service_chain.ainvoke(
            {
                "user_input": req.message,
                "chat_history": format_history([m.model_dump() for m in req.history]),
                "current_time": _now(),
            }
        )
        return {"content": response}
    except Exception as error:
        print(f"[Chat Error] {error}")
        return JSONResponse(status_code=500, content={"error": "服务暂时不可用，请稍后重试"})


# ─── 流式对话接口（SSE）─────────────────────────────────────────
@router.post("/stream")
async def chat_stream(req: ChatRequest):
    if not req.message:
        return JSONResponse(status_code=400, content={"error": "message 字段不能为空"})

    async def event_generator():
        try:
            async for chunk in customer_service_stream_chain.astream(
                {
                    "user_input": req.message,
                    "chat_history": format_history([m.model_dump() for m in req.history]),
                    "current_time": _now(),
                }
            ):
                if chunk:
                    yield f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"

            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as error:
            print(f"[Stream Error] {error}")
            yield f"data: {json.dumps({'error': '生成回复时出错，请重试'}, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
