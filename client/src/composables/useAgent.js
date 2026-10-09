// client/src/composables/useAgent.js
import { ref, nextTick } from 'vue';

const API_BASE = 'http://localhost:3000/api';

export function useAgent() {
  const messages = ref([]);
  const loading  = ref(false);
  const steps    = ref([]);
  const error    = ref('');

  const sendMessage = async (userInput, scrollCallback) => {
    if (!userInput.trim() || loading.value) return;

    error.value = '';
    steps.value = [];
    messages.value.push({ role: 'user', content: userInput });
    scrollCallback?.();

    loading.value = true;

    const assistantIndex = messages.value.length;
    messages.value.push({ role: 'assistant', content: '', thinking: true });

    try {
      const history = messages.value
        .slice(0, -1)
        .slice(-10)
        .filter((m) => !m.thinking)
        .map(({ role, content }) => ({ role, content }));

      const response = await fetch(`${API_BASE}/agent/stream`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: userInput, history }),
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

            if (parsed.type === 'step') {
              steps.value.push({
                tool:        parsed.tool,
                toolInput:   parsed.toolInput,
                observation: parsed.observation,
              });
              await nextTick();
              scrollCallback?.();
            }

            if (parsed.type === 'answer') {
              messages.value[assistantIndex] = {
                role:    'assistant',
                content: parsed.content,
                steps:   [...steps.value],
              };
              await nextTick();
              scrollCallback?.();
            }

            if (parsed.type === 'done') {
              steps.value = [];
            }

            if (parsed.type === 'error') {
              messages.value[assistantIndex] = {
                role:    'assistant',
                content: parsed.content,
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
    steps.value    = [];
    error.value    = '';
  };

  return { messages, loading, steps, error, sendMessage, clearMessages };
}
