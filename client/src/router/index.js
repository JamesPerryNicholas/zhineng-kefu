// client/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import ChatView  from '../views/ChatView.vue';
import AgentView from '../views/AgentView.vue';
import RagView   from '../views/RagView.vue';
import GraphView from '../views/GraphView.vue';

const routes = [
  { path: '/',       component: ChatView,  meta: { title: '基础对话' } },
  { path: '/agent',  component: AgentView, meta: { title: 'Agent 订单查询' } },
  { path: '/rag',    component: RagView,   meta: { title: '知识库问答' } },
  { path: '/graph',  component: GraphView, meta: { title: '多 Agent 中枢' } },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
