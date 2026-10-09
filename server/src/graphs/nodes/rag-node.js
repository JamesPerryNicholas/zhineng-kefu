// server/src/graphs/nodes/rag-node.js
import { ragChain } from '../../chains/rag-chain.js';

export const ragNode = async (state) => {
  const { userInput } = state;
  try {
    const result = await ragChain.invoke({ question: userInput });
    return { ragResult: result };
  } catch (err) {
    console.error('[ragNode]', err.message);
    return { ragResult: '查询知识库时出错' };
  }
};
