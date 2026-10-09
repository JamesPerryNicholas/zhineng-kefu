from langgraph.graph import END, START, StateGraph

from app.graphs.nodes.answer_synthesizer import answer_synthesizer_node
from app.graphs.nodes.general_chat import general_chat_node
from app.graphs.nodes.intent_router import intent_router_node, route_by_intent
from app.graphs.nodes.order_agent import order_agent_node
from app.graphs.nodes.rag_node import rag_node
from app.graphs.state import GraphState


def build_customer_graph():
    graph = StateGraph(GraphState)
    graph.add_node("intentRouter", intent_router_node)
    graph.add_node("orderAgent", order_agent_node)
    graph.add_node("ragNode", rag_node)
    graph.add_node("generalChat", general_chat_node)
    graph.add_node("answerSynthesizer", answer_synthesizer_node)

    graph.add_edge(START, "intentRouter")

    graph.add_conditional_edges(
        "intentRouter",
        route_by_intent,
        {
            "orderAgent": "orderAgent",
            "ragNode": "ragNode",
            "generalChat": "generalChat",
        },
    )

    graph.add_edge("orderAgent", "answerSynthesizer")
    graph.add_edge("ragNode", "answerSynthesizer")
    graph.add_edge("generalChat", "answerSynthesizer")
    graph.add_edge("answerSynthesizer", END)

    return graph.compile()
