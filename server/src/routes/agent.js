// server/src/routes/agent.js
import express                from 'express';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { createCustomerAgent }     from '../agents/customer-agent.js';

const router = express.Router();

const agentApp = createCustomerAgent();

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
    // 将历史记录转为消息对象（排除最后一条，避免重复）
    const historyMessages = history.slice(0, -1).map((m) =>
      m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
    );

    const result = await agentApp.invoke({
      messages: [...historyMessages, new HumanMessage(message)],
    });

    // 从消息列表提取工具调用步骤
    const msgs = result.messages;
    for (let i = 0; i < msgs.length; i++) {
      const msg = msgs[i];
      if (msg.tool_calls?.length) {
        for (const tc of msg.tool_calls) {
          const toolResult = msgs[i + 1];
          send('step', {
            tool:        tc.name,
            toolInput:   tc.args,
            observation: toolResult?.content ?? '',
          });
        }
      }
    }

    const finalMsg = msgs[msgs.length - 1];
    send('answer', { content: finalMsg.content });
    send('done',   {});
    res.end();
  } catch (err) {
    console.error('[Agent Error]', err.message);
    send('error', { content: '处理请求时出错，请重试' });
    res.end();
  }
});

export default router;
