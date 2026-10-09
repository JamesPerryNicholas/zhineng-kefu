from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent

from app.models.deepseek import create_model
from app.tools.order_tools import all_tools

_model = create_model(temperature=0)
_agent_app = create_react_agent(
    model=_model,
    tools=all_tools,
    prompt="""你是极速购的订单查询助手。
根据用户的问题，调用相应工具查询订单或物流信息。
只查询数据，不需要生成最终的客服回答。""",
)


def order_agent_node(state):
    user_input = state["user_input"]
    try:
        result = _agent_app.invoke({"messages": [HumanMessage(content=user_input)]})

        # 从消息列表提取工具调用步骤
        msgs = result["messages"]
        steps = []
        for i, msg in enumerate(msgs):
            tool_calls = getattr(msg, "tool_calls", None)
            if tool_calls:
                for tc in tool_calls:
                    obs = msgs[i + 1].content if i + 1 < len(msgs) else ""
                    steps.append({"tool": tc["name"], "input": tc["args"], "obs": obs})

        final_msg = msgs[-1]
        return {"order_result": {"answer": final_msg.content, "steps": steps}}
    except Exception as err:
        print(f"[orderAgentNode] {err}")
        return {"order_result": {"answer": "查询订单信息时出错", "steps": []}}
