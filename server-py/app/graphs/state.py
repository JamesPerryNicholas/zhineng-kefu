"""LangGraph 状态定义"""
from typing import Annotated, Optional

from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


class GraphState(TypedDict):
    messages: Annotated[list, add_messages]

    user_input: str

    # order | knowledge | general
    intent: str

    order_result: Optional[dict]
    rag_result: str
    final_answer: str
