// server/src/routes/rag.js
import express                  from 'express';
import { ragChainWithSources }  from '../chains/rag-chain.js';

const router = express.Router();

router.post('/query', async (req, res) => {
  const { question } = req.body;

  if (!question) return res.status(400).json({ error: 'question 不能为空' });

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const send = (type, data) =>
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  try {
    const result = await ragChainWithSources.invoke({ question });

    if (result.sources?.length) {
      send('sources', { sources: result.sources });
    }

    send('answer', { content: result.answer });
    send('done', {});
    res.end();
  } catch (err) {
    console.error('[RAG Error]', err.message);
    send('error', { content: '查询出错，请重试' });
    res.end();
  }
});

export default router;
