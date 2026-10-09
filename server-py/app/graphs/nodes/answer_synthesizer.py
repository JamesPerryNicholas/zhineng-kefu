import json

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.models.deepseek import create_model

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """你是极速购电商平台的客服助手小购。

根据以下查询结果，为用户生成一个清晰、友好的回答。
称呼用户为"亲"，语气专业，内容简洁准确。

订单查询结果（如有）：{order_result}
知识库查询结果（如有）：{rag_result}""",
        ),
        ("human", "{user_input}"),
    ]
)

_chain = prompt | create_model(temperature=0.5) | StrOutputParser()


def answer_synthesizer_node(state):
    user_input = state["user_input"]
    order_result = state.get("order_result")
    rag_result = state.get("rag_result")
    final_answer = state.get("final_answer")
    intent = state.get("intent")

    # general 意图已在 generalChatNode 生成答案，直接透传
    if intent == "general" and final_answer:
        return {"final_answer": final_answer}

    result = _chain.invoke(
        {
            "user_input": user_input,
            "order_result": json.dumps(order_result["answer"], ensure_ascii=False)
            if order_result
            else "无",
            "rag_result": rag_result or "无",
        }
    )
    return {"final_answer": result}
