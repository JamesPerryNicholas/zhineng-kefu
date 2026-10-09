// server/src/chains/rag-chain.js
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';
import { StringOutputParser }  from '@langchain/core/output_parsers';
import { ChatPromptTemplate }  from '@langchain/core/prompts';
import { PGVectorStore }       from '@langchain/community/vectorstores/pgvector';
import { createModel }         from '../models/deepseek.js';
import { embeddings }          from '../models/embedding.js';
import { pool }                from '../db/postgres.js';

const PG_CONFIG = {
  pool,
  tableName: 'knowledge_embeddings',
  columns: {
    idColumnName:       'id',
    vectorColumnName:   'embedding',
    contentColumnName:  'content',
    metadataColumnName: 'metadata',
  },
};

// 初始化 VectorStore（模块加载时执行一次）
const vectorStore = await PGVectorStore.initialize(embeddings, PG_CONFIG);

const retriever = vectorStore.asRetriever({ k: 4 });

const ragPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `你是极速购电商平台的专业客服助手小购。

请根据以下知识库内容回答用户的问题。
如果知识库中没有相关内容，请如实告知用户，不要编造信息。
回答语气友好，称呼用户为"亲"，回复简洁清晰。

知识库内容：
{context}`,
  ],
  ['human', '{question}'],
]);

const formatDocs = (docs) =>
  docs.map((doc) => doc.pageContent).join('\n\n---\n\n');

const model = createModel({ temperature: 0 });

// 标准 RAG Chain
export const ragChain = RunnableSequence.from([
  {
    context:  (input) => retriever.pipe(formatDocs).invoke(input.question),
    question: (input) => input.question,
  },
  ragPrompt,
  model,
  new StringOutputParser(),
]);

// 带来源信息的 RAG Chain
export const ragChainWithSources = RunnableSequence.from([
  RunnablePassthrough.assign({ docs: (input) => retriever.invoke(input.question) }),
  {
    answer: RunnableSequence.from([
      (input) => ({
        context:  formatDocs(input.docs),
        question: input.question,
      }),
      ragPrompt,
      model,
      new StringOutputParser(),
    ]),
    sources: (input) =>
      input.docs.map((doc) => ({
        content: doc.pageContent.slice(0, 100) + '...',
        source:  doc.metadata.source,
      })),
  },
]);
