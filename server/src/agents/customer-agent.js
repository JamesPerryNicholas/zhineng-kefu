// server/src/agents/customer-agent.js
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { createModel }      from '../models/deepseek.js';
import { allTools }         from '../tools/order-tools.js';

const model = createModel({ temperature: 0 });

const SYSTEM_PROMPT = `你是极速购电商平台的智能客服助手小购。

回答规则：
1. 需要查询数据时，先调用对应工具获取真实数据，不要猜测或编造
2. 语气友好，称呼用户为"亲"
3. 拿到数据后用自然语言组织回答，不要直接粘贴 JSON
4. 如果用户没有提供订单号但需要查询，先询问订单号

当前时间：${new Date().toLocaleString('zh-CN')}`;

export const createCustomerAgent = () =>
  createReactAgent({ llm: model, tools: allTools, prompt: SYSTEM_PROMPT });
