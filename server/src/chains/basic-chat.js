/**
 * 第一章：Chain 链式调用
 * 使用 LCEL（LangChain Expression Language）管道语法
 * 将 Prompt → Model → OutputParser 串联
 *
 * LCEL 数据流：
 *   输入对象 → Prompt 格式化 → messages 数组 → Model 调用 → AIMessage → Parser 提取 → 字符串
 */
import { StringOutputParser } from '@langchain/core/output_parsers';
import { createModel } from '../models/deepseek.js';
import {
  customerServicePrompt,
  generalChatPrompt,
} from '../prompts/customer-service.js';

// ─── 极速购客服 Chain（非流式）───────────────────────────────────
const model = createModel({ temperature: 0.5 });
const parser = new StringOutputParser();

export const customerServiceChain = customerServicePrompt.pipe(model).pipe(parser);

// ─── 极速购客服 Chain（流式）────────────────────────────────────
const streamingModel = createModel({ temperature: 0.5, streaming: true });

export const customerServiceStreamChain =
  customerServicePrompt.pipe(streamingModel).pipe(parser);

// ─── 通用对话 Chain（演示用）────────────────────────────────────
export const generalChatChain = generalChatPrompt.pipe(model).pipe(parser);

// ─── 工具函数：格式化历史消息 ────────────────────────────────────
/**
 * 将前端传来的 { role, content } 数组转换为 LangChain 消息格式
 * LangChain 支持 human / assistant / system 三种 role
 */
export const formatHistory = (history = []) => {
  return history.map((msg) => {
    if (msg.role === 'user') return ['human', msg.content];
    if (msg.role === 'assistant') return ['assistant', msg.content];
    return null;
  }).filter(Boolean);
};
