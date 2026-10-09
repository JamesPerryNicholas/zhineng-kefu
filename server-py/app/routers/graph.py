import json

from fastapi import APIRouter
from fastapi.responses import JSONResponse, StreamingResponse
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel

from app.graphs.customer_graph import build_customer_graph

router = APIRouter()

_graph = None


def _get_graph():
    global _graph
    if _graph is None:
        _graph = build_customer_graph()
    return _graph


class ChatMessage(BaseModel):
    role: str
    content: str


class GraphRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


def _send(event_type, data):
    return f"data: {json.dumps({'type': event_type, **data}, ensure_ascii=False)}\n\n"


@router.post("/stream")
async def graph_stream(req: GraphRequest):
    if not req.message:
        return JSONResponse(status_code=400, content={"error": "message 不能为空"})

    async def event_generator():
        try:
            graph = _get_graph()

            history_messages = [
                HumanMessage(content=m.content) if m.role == "user" else AIMessage(content=m.content)
                for m in req.history
            ]

            async for update in graph.astream(
                {
                    "user_input": req.message,
                    "messages": history_messages + [HumanMessage(content=req.message)],
                },
                stream_mode="updates",
            ):
                node_name, node_state = next(iter(update.items()))

                yield _send("node", {"node": node_name, "intent": node_state.get("intent")})

                order_result = node_state.get("order_result")
                if order_result and order_result.get("steps"):
                    yield _send("steps", {"steps": order_result["steps"]})

                if node_state.get("final_answer"):
                    yield _send("answer", {"content": node_state["final_answer"]})

            yield _send("done", {})
        except Exception as err:
            print(f"[Graph Error] {err}")
            yield _send("error", {"content": "处理请求时出错，请重试"})

    return StreamingResponse(event_generator(), media_type="text/event-stream")
