from app.chains.rag_chain import rag_chain


def rag_node(state):
    user_input = state["user_input"]
    try:
        result = rag_chain.invoke({"question": user_input})
        return {"rag_result": result}
    except Exception as err:
        print(f"[ragNode] {err}")
        return {"rag_result": "查询知识库时出错"}
