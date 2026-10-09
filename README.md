# 极速购 AI 客服系统 — Python 版运行手册

项目采用 Vue 3 前端（`client/`）和 Python FastAPI 后端（`server-py/`）。
Node.js 仅用于前端依赖安装、开发和构建，无需运行 Node.js 后端。

前端启动：

```bash
cd client
npm install
npm run dev
```

前端默认地址为 `http://localhost:5173`，Python 后端使用下文的 `3000` 端口。

## 1. 环境准备

```bash
cd server-py
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## 2. 配置环境变量

复制示例文件并填入真实配置：

```bash
cp .env.example .env
```

`.env` 需要填写：

| 变量 | 说明 |
| --- | --- |
| `DEEPSEEK_API_KEY` | DeepSeek 对话模型 Key（必填） |
| `DEEPSEEK_BASE_URL` | 默认 `https://api.deepseek.com/v1` |
| `MODEL_NAME` | 默认 `deepseek-chat` |
| `ZHIPU_API_KEY` | 智谱 AI Embedding Key（RAG 功能必填，二选一） |
| `DASHSCOPE_API_KEY` | 阿里云百炼 Embedding Key（二选一，需同时修改 `app/models/embedding.py` 启用对应代码块） |
| `PG_HOST` / `PG_PORT` / `PG_USER` / `PG_PASSWORD` / `PG_DATABASE` | PostgreSQL 连接信息（RAG 功能必填） |

## 3. 准备 PostgreSQL + pgvector

确保本地/远端 Postgres 已安装 `pgvector` 扩展，并创建好 `.env` 中指定的数据库：

```sql
CREATE DATABASE jisu_ai;
\c jisu_ai
CREATE EXTENSION IF NOT EXISTS vector;
```

> 知识库表 `knowledge_embeddings` 由 `langchain_postgres.PGVector` 自动创建，无需手动建表。

## 4. 知识库入库（RAG 功能必做，且每次更新知识库后需重新执行）

```bash
python -m app.scripts.ingest
```

成功后会输出「切分完成」「入库完成」。该脚本会清空并重建 `knowledge_embeddings` 表中的数据。

## 5. 启动服务

```bash
uvicorn app.main:app --reload --port 3000
```

启动后访问 `http://localhost:3000/` 应返回服务信息 JSON。

## 6. 接口列表

| 接口 | 说明 |
| --- | --- |
| `GET  /api/chat/health` | 健康检查 |
| `POST /api/chat` | 普通对话（一次性返回） |
| `POST /api/chat/stream` | 流式对话（SSE） |
| `POST /api/agent/stream` | 客服 Agent 对话（自动调用订单/物流工具，SSE） |
| `POST /api/rag/query` | 知识库问答（SSE） |
| `POST /api/graph/stream` | LangGraph 多节点工作流对话（意图路由 → 订单/知识库/闲聊 → 答案合成，SSE） |

### 请求示例

```bash
# 普通对话
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好"}'

# Agent 对话（订单查询）
curl -N -X POST http://localhost:3000/api/agent/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "帮我查一下订单 ORD-001 的状态"}'

# RAG 知识库问答
curl -N -X POST http://localhost:3000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"question": "退换货政策是什么？"}'

# Graph 工作流对话
curl -N -X POST http://localhost:3000/api/graph/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "我的快递到哪了，单号 SF1234567890"}'
```

SSE 接口需加 `-N` 参数禁用 curl 缓冲，才能看到流式输出。

## 7. 常见问题

- **启动时报 Postgres 连接/密码错误**：`app/chains/rag_chain.py` 在模块导入时会立即连接数据库初始化向量库，确保 `.env` 中的 Postgres 配置正确且服务已启动，再启动 FastAPI。
- **RAG 查询无结果**：检查是否已执行第 4 步的 `ingest` 脚本。
- **模型调用报 401/403**：检查 `DEEPSEEK_API_KEY` / `ZHIPU_API_KEY` 是否正确、额度是否充足。
