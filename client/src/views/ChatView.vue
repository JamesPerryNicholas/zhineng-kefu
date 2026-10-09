<!--
  第一章：Vue3 对话视图
  功能：
  - 展示完整对话历史
  - 流式输出实时展示（逐字出现效果）
  - 发送按钮 + Enter 键发送
  - 自动滚动到底部
  - 错误提示
-->
<template>
  <div class="chat-page">
    <!-- 顶部 Header -->
    <header class="chat-header">
      <div class="header-left">
        <div class="avatar">购</div>
        <div class="header-info">
          <h1>极速购智能客服</h1>
          <span class="status" :class="{ active: !streaming }">
            {{ streaming ? '回复中...' : '在线' }}
          </span>
        </div>
      </div>
      <button class="clear-btn" @click="clearMessages" title="清空对话">
        清空
      </button>
    </header>

    <!-- 消息列表 -->
    <main class="messages-wrap" ref="messagesRef">
      <!-- 欢迎消息 -->
      <div v-if="messages.length === 0" class="welcome">
        <div class="welcome-icon">👋</div>
        <p>您好！我是极速购智能客服小购</p>
        <p class="sub">有任何购物、订单、物流问题都可以问我～</p>
        <div class="quick-questions">
          <button
            v-for="q in quickQuestions"
            :key="q"
            @click="handleQuickQuestion(q)"
          >
            {{ q }}
          </button>
        </div>
      </div>

      <!-- 历史消息 -->
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message-row"
        :class="msg.role"
      >
        <div class="bubble-wrap">
          <div class="avatar-sm">
            {{ msg.role === 'user' ? '我' : '购' }}
          </div>
          <div class="bubble">
            <p>{{ msg.content }}</p>
          </div>
        </div>
      </div>

      <!-- 流式输出中的消息 -->
      <div v-if="streaming" class="message-row assistant">
        <div class="bubble-wrap">
          <div class="avatar-sm">购</div>
          <div class="bubble streaming">
            <p>{{ streamText || '&nbsp;' }}<span class="cursor">▋</span></p>
          </div>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="error-tip">
        ⚠️ {{ error }}
      </div>
    </main>

    <!-- 输入区 -->
    <footer class="input-area">
      <div class="input-wrap">
        <textarea
          v-model="inputText"
          ref="inputRef"
          placeholder="输入消息，Enter 发送，Shift+Enter 换行"
          :disabled="streaming"
          @keydown.enter.exact.prevent="handleSend"
          rows="1"
          @input="autoResize"
        />
        <button
          class="send-btn"
          :class="{ loading: streaming }"
          :disabled="streaming || !inputText.trim()"
          @click="handleSend"
        >
          <span v-if="!streaming">发送</span>
          <span v-else class="dot-loading">
            <i /><i /><i />
          </span>
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { useChat } from '../composables/useChat.js';

const { messages, streaming, streamText, error, sendMessage, clearMessages } =
  useChat();

const inputText = ref('');
const messagesRef = ref(null);
const inputRef = ref(null);

const quickQuestions = [
  '我的订单在哪里？',
  '如何申请退款？',
  '物流多久到？',
  '如何联系客服？',
];

const scrollToBottom = async () => {
  await nextTick();
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
};

const autoResize = () => {
  const el = inputRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
};

const handleSend = async () => {
  const text = inputText.value.trim();
  if (!text || streaming.value) return;
  inputText.value = '';
  if (inputRef.value) inputRef.value.style.height = 'auto';
  await sendMessage(text, scrollToBottom);
};

const handleQuickQuestion = (q) => {
  inputText.value = q;
  handleSend();
};
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 780px;
  margin: 0 auto;
  background: #f8fafc;
  font-family: -apple-system, 'PingFang SC', sans-serif;
}

/* Header */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.header-left { display: flex; align-items: center; gap: 12px; }
.avatar {
  width: 42px; height: 42px; border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff; font-size: 18px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.header-info h1 { font-size: 16px; font-weight: 600; margin: 0; color: #1e293b; }
.status { font-size: 12px; color: #94a3b8; }
.status.active { color: #22c55e; }
.clear-btn {
  padding: 6px 14px; border-radius: 8px; border: 1px solid #e2e8f0;
  background: #fff; color: #64748b; cursor: pointer; font-size: 13px;
}
.clear-btn:hover { background: #f1f5f9; }

/* Messages */
.messages-wrap {
  flex: 1; overflow-y: auto; padding: 20px 16px;
  display: flex; flex-direction: column; gap: 16px;
}
.welcome {
  text-align: center; padding: 40px 20px; color: #64748b;
}
.welcome-icon { font-size: 40px; margin-bottom: 12px; }
.welcome p { font-size: 16px; margin: 4px 0; color: #475569; }
.welcome .sub { font-size: 13px; color: #94a3b8; }
.quick-questions {
  display: flex; flex-wrap: wrap; gap: 8px;
  justify-content: center; margin-top: 20px;
}
.quick-questions button {
  padding: 8px 14px; border-radius: 20px;
  border: 1px solid #bfdbfe; background: #eff6ff;
  color: #2563eb; font-size: 13px; cursor: pointer;
  transition: all .2s;
}
.quick-questions button:hover { background: #dbeafe; }

/* Message rows */
.message-row { display: flex; }
.message-row.user { justify-content: flex-end; }
.message-row.assistant { justify-content: flex-start; }
.bubble-wrap { display: flex; align-items: flex-end; gap: 8px; max-width: 75%; }
.message-row.user .bubble-wrap { flex-direction: row-reverse; }

.avatar-sm {
  width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
}
.message-row.user .avatar-sm { background: #2563eb; color: #fff; }
.message-row.assistant .avatar-sm { background: #f1f5f9; color: #475569; }

.bubble {
  padding: 12px 16px; border-radius: 16px;
  line-height: 1.7; font-size: 14px;
}
.message-row.user .bubble {
  background: #2563eb; color: #fff;
  border-bottom-right-radius: 4px;
}
.message-row.assistant .bubble {
  background: #fff; color: #1e293b;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.bubble p { margin: 0; white-space: pre-wrap; }
.bubble.streaming { background: #fff; }

.cursor {
  display: inline-block;
  animation: blink 1s step-end infinite;
  color: #2563eb; font-weight: 700;
}
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

.error-tip {
  text-align: center; padding: 10px 16px; border-radius: 8px;
  background: #fef2f2; color: #dc2626; font-size: 13px;
}

/* Input area */
.input-area {
  padding: 14px 16px;
  background: #fff;
  border-top: 1px solid #e2e8f0;
}
.input-wrap { display: flex; gap: 10px; align-items: flex-end; }
textarea {
  flex: 1; resize: none; border: 1px solid #e2e8f0;
  border-radius: 12px; padding: 10px 14px;
  font-size: 14px; font-family: inherit; line-height: 1.6;
  outline: none; transition: border-color .2s;
  background: #f8fafc; min-height: 42px; max-height: 120px;
  overflow-y: auto;
}
textarea:focus { border-color: #2563eb; background: #fff; }
textarea:disabled { opacity: 0.6; cursor: not-allowed; }

.send-btn {
  width: 70px; height: 42px; border-radius: 12px; flex-shrink: 0;
  border: none; background: #2563eb; color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all .2s; display: flex; align-items: center; justify-content: center;
}
.send-btn:hover:not(:disabled) { background: #1d4ed8; }
.send-btn:disabled { background: #bfdbfe; cursor: not-allowed; }

/* Loading dots */
.dot-loading { display: flex; gap: 4px; }
.dot-loading i {
  width: 5px; height: 5px; border-radius: 50%;
  background: #fff; animation: dot 1.2s ease-in-out infinite;
}
.dot-loading i:nth-child(2) { animation-delay: .2s; }
.dot-loading i:nth-child(3) { animation-delay: .4s; }
@keyframes dot { 0%, 80%, 100% { opacity: .2; transform: scale(.8); } 40% { opacity: 1; transform: scale(1); } }
</style>
