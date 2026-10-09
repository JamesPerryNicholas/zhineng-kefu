// server/src/index.js
import express     from 'express';
import cors        from 'cors';
import 'dotenv/config';
import chatRouter  from './routes/chat.js';
import agentRouter from './routes/agent.js';
import ragRouter   from './routes/rag.js';
import graphRouter from './routes/graph.js';

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/chat',  chatRouter);
app.use('/api/agent', agentRouter);
app.use('/api/rag',   ragRouter);
app.use('/api/graph', graphRouter);

app.get('/', (req, res) => {
  res.json({
    service: '极速购 AI 客服系统',
    version: '1.0.0',
    routes: {
      chat:  'POST /api/chat/stream',
      agent: 'POST /api/agent/stream',
      rag:   'POST /api/rag/query',
      graph: 'POST /api/graph/stream',
    },
  });
});

app.listen(PORT, () => {
  console.log(`\n极速购 AI 客服服务已启动：http://localhost:${PORT}\n`);
});
