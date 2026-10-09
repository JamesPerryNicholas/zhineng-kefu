import json

from fastapi import APIRouter
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from app.chains.rag_chain import rag_chain_with_sources

router = APIRouter()


class RagRequest(BaseModel):
    question: str


def _send(event_type, data):
    return f"data: {json.dumps({'type': event_type, **data}, ensure_ascii=False)}\n\n"


@router.post("/query")
async def rag_query(req: RagRequest):
    if not req.question:
        return JSONResponse(status_code=400, content={"error": "question 不能为空"})

    async def event_generator():
        try:
            result = rag_chain_with_sources.invoke({"question": req.question})

            if result.get("sources"):
                yield _send("sources", {"sources": result["sources"]})

            yield _send("answer", {"content": result["answer"]})
            yield _send("done", {})
        except Exception as err:
            print(f"[RAG Error] {err}")
            yield _send("error", {"content": "查询出错，请重试"})

    return StreamingResponse(event_generator(), media_type="text/event-stream")
