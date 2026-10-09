// server/src/graphs/nodes/general-chat.js
import { createModel }        from '../../models/deepseek.js';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

const prompt = ChatPromptTemplate.fromMessages([
  ['system', '你是极速购电商平台的客服助手小购。语气友好，称呼用户为"亲"，回复简洁。'],
  ['placeholder', '{chat_history}'],
  ['human', '{userInput}'],
]);

const chain = prompt.pipe(createModel({ temperature: 0.7 })).pipe(new StringOutputParser());

export const generalChatNode = async (state) => {
  const { userInput, messages } = state;
  const chatHistory = (messages || [])
    .slice(-8)
    .map((m) => [m._getType?.() === 'human' ? 'human' : 'assistant', m.content])
    .filter(Boolean);

  const result = await chain.invoke({ userInput, chat_history: chatHistory });
  return { finalAnswer: result };
};
