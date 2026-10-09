"""
文档入库脚本，执行一次即可，知识库更新时重新执行
运行：python -m app.scripts.ingest
"""
import os

from langchain_core.documents import Document
from langchain_postgres import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.db.postgres import PG_CONNECTION_STRING
from app.models.embedding import embeddings

COLLECTION_NAME = "knowledge_embeddings"

_KNOWLEDGE_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "knowledge")


def _load_docs():
    files = ["products.md", "policies.md"]
    docs = []
    for file in files:
        with open(os.path.join(_KNOWLEDGE_DIR, file), "r", encoding="utf-8") as f:
            content = f.read()
        docs.append(Document(page_content=content, metadata={"source": file}))
    return docs


def ingest():
    print("开始处理文档...")

    docs = _load_docs()
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)
    print(f"切分完成，共 {len(chunks)} 个片段")

    # 清空旧数据（全量更新场景）
    vector_store = PGVector(
        embeddings=embeddings,
        collection_name=COLLECTION_NAME,
        connection=PG_CONNECTION_STRING,
        use_jsonb=True,
        pre_delete_collection=True,
    )
    vector_store.add_documents(chunks)

    print("入库完成")


if __name__ == "__main__":
    ingest()
