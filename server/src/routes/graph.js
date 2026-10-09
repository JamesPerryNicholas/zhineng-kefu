// server/src/routes/graph.js
import express                from 'express';
import { HumanMessage }       from '@langchain/core/messages';
import { buildCustomerGraph } from '../graphs/customer-graph.js';

const router = express.Router();

let graph = null;
const getGraph = () => {
  if (!graph) graph = buildCustomerGraph();
  return graph;
};

router.post('/stream', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message) return res.status(400).json({ error: 'message 不能为空' });

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const send = (type, data) =>
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  try {
    const g = getGraph();

    const historyMessages = history.map((m) =>
      m.role === 'user'
        ? new HumanMessage(m.content)
        : { _getType: () => 'ai', content: m.content }
    );

    const stream = await g.stream(
      {
        userInput: message,
        messages:  [...historyMessages, new HumanMessage(message)],
      },
      { streamMode: 'updates' }
    );

    for await (const update of stream) {
      const [nodeName, nodeState] = Object.entries(update)[0];

      send('node', { node: nodeName, intent: nodeState.intent || null });

      if (nodeState.orderResult?.steps?.length) {
        send('steps', { steps: nodeState.orderResult.steps });
      }

      if (nodeState.finalAnswer) {
        send('answer', { content: nodeState.finalAnswer });
      }
    }

    send('done', {});
    res.end();
  } catch (err) {
    console.error('[Graph Error]', err.message);
    send('error', { content: '处理请求时出错，请重试' });
    res.end();
  }
});

export default router;
