/**
 * 第一章：Vue3 Composable
 * useChat — 封装对话逻辑，包含流式输出、历史管理
 * 在 View 组件中直接使用，保持组件简洁
 */
import { ref, nextTick } from 'vue';

const API_BASE = 'http://localhost:3000/api';

export function useChat() {
  const messages = ref([]);       // 完整消息历史 [{ role, content }]
  const streaming = ref(false);   // 是否正在流式输出
  const streamText = ref('');     // 当前流式输出的文本片段
  const error = ref('');          // 错误信息

  // ─── 发送消息（流式）───────────────────────────────────────────
  const sendMessage = async (userInput, scrollCallback) => {
    if (!userInput.trim() || streaming.value) return;

    error.value = '';
    messages.value.push({ role: 'user', content: userInput });
    scrollCallback?.();

    streaming.value = true;
    streamText.value = '';

    try {
      // 取最近 10 条历史，避免 Token 超限
      const history = messages.value
        .slice(-10)
        .map(({ role, content }) => ({ role, content }));

      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput, history }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      // 读取 SSE 流
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const raw = line.slice(6).trim();
          try {
            const parsed = JSON.parse(raw);

            if (parsed.error) {
              error.value = parsed.error;
              break;
            }
            if (parsed.done) break;
            if (parsed.content) {
              streamText.value += parsed.content;
              await nextTick();
              scrollCallback?.();
            }
          } catch {
            // 忽略解析失败的片段
          }
        }
      }

      // 流结束，将完整回复存入历史
      if (streamText.value) {
        messages.value.push({ role: 'assistant', content: streamText.value });
      }
    } catch (err) {
      error.value = `请求失败：${err.message}`;
    } finally {
      streaming.value = false;
      streamText.value = '';
      scrollCallback?.();
    }
  };

  // ─── 清空对话 ───────────────────────────────────────────────────
  const clearMessages = () => {
    messages.value = [];
    error.value = '';
  };

  return {
    messages,
    streaming,
    streamText,
    error,
    sendMessage,
    clearMessages,
  };
}
