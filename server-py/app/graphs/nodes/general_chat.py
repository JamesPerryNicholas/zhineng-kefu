from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.models.deepseek import create_model

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", '你是极速购电商平台的客服助手小购。语气友好，称呼用户为"亲"，回复简洁。'),
        ("placeholder", "{chat_history}"),
        ("human", "{user_input}"),
    ]
)

_chain = prompt | create_model(temperature=0.7) | StrOutputParser()


def general_chat_node(state):
    user_input = state["user_input"]
    messages = state.get("messages") or []
    chat_history = [
        ("human" if m.type == "human" else "assistant", m.content) for m in messages[-8:]
    ]

    result = _chain.invoke({"user_input": user_input, "chat_history": chat_history})
    return {"final_answer": result}
