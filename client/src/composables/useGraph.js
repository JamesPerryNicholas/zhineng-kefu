// client/src/composables/useGraph.js
import { ref, nextTick } from 'vue';

const API_BASE = 'http://localhost:3000/api';

export const NODE_LABELS = {
  intentRouter:      '意图识别',
  orderAgent:        '订单查询',
  ragNode:           '知识库检索',
  generalChat:       '通用对话',
  answerSynthesizer: '整理回答',
};

export const INTENT_LABELS = {
  order:     '订单查询',
  knowledge: '知识库问答',
  general:   '通用对话',
};

export function useGraph() {
  const messages    = ref([]);
  const loading     = ref(false);
  const currentNode = ref('');
  const error       = ref('');

  const sendMessage = async (userInput, scrollCallback) => {
    if (!userInput.trim() || loading.value) return;

    error.value       = '';
    currentNode.value = '';
    messages.value.push({ role: 'user', content: userInput });
    scrollCallback?.();

    loading.value = true;

    const assistantIndex = messages.value.length;
    messages.value.push({
      role: 'assistant', content: '',
      nodes: [], intent: '', steps: [], loading: true,
    });

    try {
      const history = messages.value
        .slice(0, -1).slice(-8)
        .filter((m) => !m.loading)
        .map(({ role, content }) => ({ role, content }));

      const response = await fetch(`${API_BASE}/graph/stream`, {
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

            if (parsed.type === 'node') {
              currentNode.value = NODE_LABELS[parsed.node] || parsed.node;
              const msg = messages.value[assistantIndex];
              if (!msg.nodes.includes(parsed.node)) {
                messages.value[assistantIndex] = {
                  ...msg,
                  nodes:  [...msg.nodes, parsed.node],
                  intent: parsed.intent
                    ? (INTENT_LABELS[parsed.intent] || parsed.intent)
                    : msg.intent,
                };
              }
              await nextTick();
              scrollCallback?.();
            }

            if (parsed.type === 'steps') {
              messages.value[assistantIndex] = {
                ...messages.value[assistantIndex],
                steps: parsed.steps,
              };
            }

            if (parsed.type === 'answer') {
              messages.value[assistantIndex] = {
                ...messages.value[assistantIndex],
                content: parsed.content,
                loading: false,
              };
              currentNode.value = '';
              await nextTick();
              scrollCallback?.();
            }

            if (parsed.type === 'error') {
              messages.value[assistantIndex] = {
                ...messages.value[assistantIndex],
                content: parsed.content,
                loading: false,
              };
              currentNode.value = '';
            }
          } catch {}
        }
      }
    } catch (err) {
      error.value = `请求失败：${err.message}`;
      messages.value.pop();
    } finally {
      loading.value     = false;
      currentNode.value = '';
    }
  };

  const clearMessages = () => {
    messages.value    = [];
    currentNode.value = '';
    error.value       = '';
  };

  return { messages, loading, currentNode, error, sendMessage, clearMessages };
}
