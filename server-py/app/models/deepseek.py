"""
模型封装
将 DeepSeek 封装为 LangChain ChatModel
DeepSeek 兼容 OpenAI 协议，使用 ChatOpenAI 并替换 base_url 即可
"""
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
MODEL_NAME = os.getenv("MODEL_NAME", "deepseek-chat")


def create_model(**overrides) -> ChatOpenAI:
    """创建 DeepSeek 模型实例，可通过 overrides 覆盖默认参数，如 temperature=0, streaming=True"""
    params = {
        "model": MODEL_NAME,
        "api_key": DEEPSEEK_API_KEY,
        "base_url": DEEPSEEK_BASE_URL,
        "temperature": 0.7,
        "streaming": False,
    }
    params.update(overrides)
    return ChatOpenAI(**params)


# 默认导出一个标准实例（非流式）
model = create_model()

# 流式实例，用于 SSE 接口
streaming_model = create_model(streaming=True)
