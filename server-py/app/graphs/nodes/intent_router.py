from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.models.deepseek import create_model

intent_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """你是一个意图分类器。

根据用户的问题，返回以下三个分类之一，只返回分类词，不要有任何其他内容：

- order：用户询问订单状态、物流信息、退款进度等需要查询订单数据的问题
- knowledge：用户询问商品介绍、规格参数、售后政策、退换货规则等可从知识库获取的问题
- general：其他类型的对话、闲聊、无法归类的问题

只输出一个词：order 或 knowledge 或 general""",
        ),
        ("human", "{user_input}"),
    ]
)

_chain = intent_prompt | create_model(temperature=0) | StrOutputParser()

VALID_INTENTS = ["order", "knowledge", "general"]


def intent_router_node(state):
    user_input = state["user_input"]
    raw = _chain.invoke({"user_input": user_input})
    intent = raw.strip().lower()
    final = intent if intent in VALID_INTENTS else "general"
    print(f'[intentRouter] "{user_input}" → {final}')
    return {"intent": final}


def route_by_intent(state):
    mapping = {"order": "orderAgent", "knowledge": "ragNode", "general": "generalChat"}
    return mapping.get(state["intent"], "generalChat")
