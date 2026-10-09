<!-- client/src/views/RagView.vue -->
<template>
  <div class="rag-page">
    <header class="chat-header">
      <div class="header-left">
        <div class="avatar">购</div>
        <div>
          <h1>极速购知识库问答</h1>
          <span class="subtitle">基于商品手册和售后政策</span>
        </div>
      </div>
      <button @click="clearMessages">清空</button>
    </header>

    <main class="messages-wrap" ref="messagesRef">
      <div v-if="messages.length === 0" class="welcome">
        <p>您好，我可以回答关于商品规格、价格、售后政策等问题。</p>
        <div class="quick-btns">
          <button v-for="q in quickQuestions" :key="q" @click="handleQuick(q)">
            {{ q }}
          </button>
        </div>
      </div>

      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="message-row"
        :class="msg.role"
      >
        <div class="avatar-sm">{{ msg.role === 'user' ? '我' : '购' }}</div>
        <div class="message-content">
          <div v-if="msg.loading" class="bubble loading-bubble">
            <span class="dot" /><span class="dot" /><span class="dot" />
          </div>
          <div v-else class="bubble">{{ msg.content }}</div>
          <div v-if="msg.sources && msg.sources.length" class="sources-wrap">
            <span class="sources-label">参考来源</span>
            <span v-for="(src, si) in msg.sources" :key="si" class="source-tag">
              {{ src.source }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="error" class="error-tip">{{ error }}</div>
    </main>

    <footer class="input-area">
      <textarea
        v-model="inputText"
        placeholder="输入问题，Enter 发送"
        :disabled="loading"
        @keydown.enter.exact.prevent="handleSend"
        rows="1"
      />
      <button
        class="send-btn"
        :disabled="loading || !inputText.trim()"
        @click="handleSend"
      >
        {{ loading ? '查询中...' : '发送' }}
      </button>
    </footer>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { useRag } from '../composables/useRag.js';

const { messages, loading, error, ask, clearMessages } = useRag();

const inputText   = ref('');
const messagesRef = ref(null);

const quickQuestions = [
  '蓝牙耳机 X1 Pro 的续航怎么样？',
  '商品可以退货吗？',
  '机械键盘保修多久？',
  '退款需要多少天？',
];

const scrollToBottom = async () => {
  await nextTick();
  if (messagesRef.value)
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
};

const handleSend = async () => {
  const text = inputText.value.trim();
  if (!text || loading.value) return;
  inputText.value = '';
  await ask(text, scrollToBottom);
};

const handleQuick = (q) => {
  inputText.value = q;
  handleSend();
};
</script>

<style scoped>
.rag-page {
  display: flex; flex-direction: column;
  height: 100vh; max-width: 780px;
  margin: 0 auto; background: #f8fafc;
  font-family: -apple-system, 'PingFang SC', sans-serif;
}
.chat-header {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 14px 20px; background: #fff;
  border-bottom: 1px solid #e2e8f0;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.avatar {
  width: 42px; height: 42px; border-radius: 12px;
  background: #0f766e; color: #fff;
  font-size: 18px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.header-left h1     { font-size: 16px; font-weight: 600; margin: 0; color: #1e293b; }
.header-left .subtitle { font-size: 12px; color: #94a3b8; }
.chat-header button {
  padding: 6px 14px; border-radius: 8px;
  border: 1px solid #e2e8f0; background: #fff;
  color: #64748b; cursor: pointer; font-size: 13px;
}
.messages-wrap {
  flex: 1; overflow-y: auto;
  padding: 20px 16px;
  display: flex; flex-direction: column; gap: 16px;
}
.welcome { text-align: center; padding: 40px 20px; color: #64748b; }
.welcome p { font-size: 15px; margin: 0 0 16px; }
.quick-btns { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.quick-btns button {
  padding: 7px 14px; border-radius: 20px;
  border: 1px solid #99f6e4; background: #f0fdfa;
  color: #0f766e; font-size: 13px; cursor: pointer;
}
.message-row { display: flex; gap: 8px; }
.message-row.user { justify-content: flex-end; flex-direction: row-reverse; }
.avatar-sm {
  width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
}
.message-row.user .avatar-sm      { background: #2563eb; color: #fff; }
.message-row.assistant .avatar-sm { background: #f0fdfa; color: #0f766e; }
.message-content {
  display: flex; flex-direction: column; gap: 6px; max-width: 75%;
}
.message-row.user .message-content { align-items: flex-end; }
.bubble {
  padding: 12px 16px; border-radius: 16px;
  font-size: 14px; line-height: 1.7; white-space: pre-wrap;
}
.message-row.user .bubble {
  background: #2563eb; color: #fff; border-bottom-right-radius: 4px;
}
.message-row.assistant .bubble {
  background: #fff; color: #1e293b;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.loading-bubble { display: flex; gap: 5px; align-items: center; min-width: 60px; }
.dot {
  width: 7px; height: 7px; border-radius: 50%; background: #94a3b8;
  animation: dot-bounce 1.2s infinite;
}
.dot:nth-child(2) { animation-delay: .2s; }
.dot:nth-child(3) { animation-delay: .4s; }
@keyframes dot-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: .4; }
  40%           { transform: translateY(-5px); opacity: 1; }
}
.sources-wrap {
  display: flex; align-items: center;
  gap: 6px; flex-wrap: wrap;
}
.sources-label { font-size: 11px; color: #94a3b8; }
.source-tag {
  font-size: 11px; padding: 2px 8px;
  background: #f0fdfa; color: #0f766e;
  border: 1px solid #99f6e4; border-radius: 4px;
}
.error-tip {
  text-align: center; padding: 10px 16px;
  background: #fef2f2; color: #dc2626;
  border-radius: 8px; font-size: 13px;
}
.input-area {
  padding: 14px 16px; background: #fff;
  border-top: 1px solid #e2e8f0;
  display: flex; gap: 10px; align-items: flex-end;
}
textarea {
  flex: 1; resize: none; border: 1px solid #e2e8f0;
  border-radius: 12px; padding: 10px 14px;
  font-size: 14px; font-family: inherit;
  outline: none; background: #f8fafc;
  min-height: 42px; max-height: 120px;
}
textarea:focus    { border-color: #0f766e; background: #fff; }
textarea:disabled { opacity: 0.6; }
.send-btn {
  width: 80px; height: 42px; border-radius: 12px;
  border: none; background: #0f766e; color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
}
.send-btn:hover:not(:disabled) { background: #0d6b62; }
.send-btn:disabled { background: #99f6e4; color: #0f766e; cursor: not-allowed; }
</style>
