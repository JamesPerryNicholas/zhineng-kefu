/**
 * 第一章：Express 路由
 * GET  /api/chat/health  - 健康检查
 * POST /api/chat         - 普通对话（一次性返回）
 * POST /api/chat/stream  - 流式对话（SSE）
 */
import express from 'express';
import {
  customerServiceChain,
  customerServiceStreamChain,
  formatHistory,
} from '../chains/basic-chat.js';

const router = express.Router();

// ─── 健康检查 ────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 普通对话接口 ────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message 字段不能为空' });
  }

  try {
    const response = await customerServiceChain.invoke({
      user_input: message,
      chat_history: formatHistory(history),
      current_time: new Date().toLocaleString('zh-CN'),
    });

    res.json({ content: response });
  } catch (error) {
    console.error('[Chat Error]', error.message);
    res.status(500).json({ error: '服务暂时不可用，请稍后重试' });
  }
});

// ─── 流式对话接口（SSE）─────────────────────────────────────────
router.post('/stream', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message 字段不能为空' });
  }

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲

  // 发送 SSE 数据的工具函数
  const sendData = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const stream = await customerServiceStreamChain.stream({
      user_input: message,
      chat_history: formatHistory(history),
      current_time: new Date().toLocaleString('zh-CN'),
    });

    // 逐块发送给前端
    for await (const chunk of stream) {
      if (chunk) {
        sendData({ content: chunk });
      }
    }

    // 发送结束标记
    sendData({ done: true });
    res.end();
  } catch (error) {
    console.error('[Stream Error]', error.message);
    sendData({ error: '生成回复时出错，请重试' });
    res.end();
  }
});

export default router;
