import json

from fastapi import APIRouter
from fastapi.responses import JSONResponse, StreamingResponse
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel

from app.agents.customer_agent import create_customer_agent

router = APIRouter()

_agent_app = create_customer_agent()


class ChatMessage(BaseModel):
    role: str
    content: str


class AgentRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


def _send(event_type, data):
    return f"data: {json.dumps({'type': event_type, **data}, ensure_ascii=False)}\n\n"


@router.post("/stream")
async def agent_stream(req: AgentRequest):
    if not req.message:
        return JSONResponse(status_code=400, content={"error": "message 不能为空"})

    async def event_generator():
        try:
            # 将历史记录转为消息对象（排除最后一条，避免重复）
            history_messages = [
                HumanMessage(content=m.content) if m.role == "user" else AIMessage(content=m.content)
                for m in req.history[:-1]
            ]

            result = await _agent_app.ainvoke(
                {"messages": history_messages + [HumanMessage(content=req.message)]}
            )

            # 从消息列表提取工具调用步骤
            msgs = result["messages"]
            for i, msg in enumerate(msgs):
                tool_calls = getattr(msg, "tool_calls", None)
                if tool_calls:
                    for tc in tool_calls:
                        tool_result = msgs[i + 1] if i + 1 < len(msgs) else None
                        yield _send(
                            "step",
                            {
                                "tool": tc["name"],
                                "toolInput": tc["args"],
                                "observation": tool_result.content if tool_result else "",
                            },
                        )

            final_msg = msgs[-1]
            yield _send("answer", {"content": final_msg.content})
            yield _send("done", {})
        except Exception as err:
            print(f"[Agent Error] {err}")
            yield _send("error", {"content": "处理请求时出错，请重试"})

    return StreamingResponse(event_generator(), media_type="text/event-stream")
