// server/src/scripts/ingest.js
// 文档入库脚本，执行一次即可，知识库更新时重新执行
// 运行：node src/scripts/ingest.js

import { readFileSync }        from 'fs';
import { join, dirname }       from 'path';
import { fileURLToPath }       from 'url';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PGVectorStore }       from '@langchain/community/vectorstores/pgvector';
import { Document }            from '@langchain/core/documents';
import { embeddings }          from '../models/embedding.js';
import { pool }                from '../db/postgres.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

const loadDocs = () => {
  const files = ['products.md', 'policies.md'];
  return files.map((file) => {
    const content = readFileSync(
      join(__dirname, '../data/knowledge', file),
      'utf-8'
    );
    return new Document({ pageContent: content, metadata: { source: file } });
  });
};

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize:    500,
  chunkOverlap: 50,
});

const ingest = async () => {
  console.log('开始处理文档...');

  const docs   = loadDocs();
  const chunks = await splitter.splitDocuments(docs);
  console.log(`切分完成，共 ${chunks.length} 个片段`);

  // 清空旧数据（全量更新场景）
  const client = await pool.connect();
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS knowledge_embeddings (
        id       bigserial PRIMARY KEY,
        content  text,
        metadata jsonb,
        embedding vector(1536)
      );`
    );
    await client.query('TRUNCATE knowledge_embeddings;');
  } finally {
    client.release();
  }

  await PGVectorStore.fromDocuments(chunks, embeddings, PG_CONFIG);

  console.log('入库完成');
  await pool.end();
};

ingest().catch((err) => {
  console.error('入库失败：', err.message);
  process.exit(1);
});
