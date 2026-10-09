// server/src/graphs/customer-graph.js
import { StateGraph, START, END }          from '@langchain/langgraph';
import { GraphState }                      from './state.js';
import { intentRouterNode, routeByIntent } from './nodes/intent-router.js';
import { orderAgentNode }                  from './nodes/order-agent.js';
import { ragNode }                         from './nodes/rag-node.js';
import { generalChatNode }                 from './nodes/general-chat.js';
import { answerSynthesizerNode }           from './nodes/answer-synthesizer.js';

export const buildCustomerGraph = () => {
  const graph = new StateGraph(GraphState)
    .addNode('intentRouter',      intentRouterNode)
    .addNode('orderAgent',        orderAgentNode)
    .addNode('ragNode',           ragNode)
    .addNode('generalChat',       generalChatNode)
    .addNode('answerSynthesizer', answerSynthesizerNode)

    .addEdge(START, 'intentRouter')

    .addConditionalEdges('intentRouter', routeByIntent, {
      orderAgent:  'orderAgent',
      ragNode:     'ragNode',
      generalChat: 'generalChat',
    })

    .addEdge('orderAgent',   'answerSynthesizer')
    .addEdge('ragNode',      'answerSynthesizer')
    .addEdge('generalChat',  'answerSynthesizer')
    .addEdge('answerSynthesizer', END);

  return graph.compile();
};
