// client/src/composables/useRag.js
import { ref } from 'vue';

const API_BASE = 'http://localhost:3000/api';

export function useRag() {
  const messages = ref([]);
  const loading  = ref(false);
  const error    = ref('');

  const ask = async (question, scrollCallback) => {
    if (!question.trim() || loading.value) return;

    error.value = '';
    messages.value.push({ role: 'user', content: question });
    scrollCallback?.();

    loading.value = true;

    const assistantIndex = messages.value.length;
    messages.value.push({ role: 'assistant', content: '', sources: [], loading: true });

    try {
      const response = await fetch(`${API_BASE}/rag/query`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ question }),
      });

      const reader  = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder
          .decode(value, { stream: true })
          .split('\n')
          .filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line.slice(6));

            if (parsed.type === 'sources') {
              messages.value[assistantIndex] = {
                ...messages.value[assistantIndex],
                sources: parsed.sources,
              };
            }

            if (parsed.type === 'answer') {
              messages.value[assistantIndex] = {
                role:    'assistant',
                content: parsed.content,
                sources: messages.value[assistantIndex].sources,
                loading: false,
              };
              scrollCallback?.();
            }

            if (parsed.type === 'error') {
              messages.value[assistantIndex] = {
                role: 'assistant', content: parsed.content,
                sources: [], loading: false,
              };
            }
          } catch {}
        }
      }
    } catch (err) {
      error.value = `请求失败：${err.message}`;
      messages.value.pop();
    } finally {
      loading.value = false;
    }
  };

  const clearMessages = () => {
    messages.value = [];
    error.value    = '';
  };

  return { messages, loading, error, ask, clearMessages };
}
