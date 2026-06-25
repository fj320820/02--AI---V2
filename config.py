# 墨香国学AI - API 配置文件
# API Key 请通过环境变量设置，不要直接填写在此文件中

import os

# ===== AI 模型配置 =====
# 支持：deepseek / qwen / zhipu / moonshot
AI_PROVIDER = "deepseek"

# API Keys（从环境变量读取，不要在代码中硬编码）
# 部署时设置环境变量：DEEPSEEK_API_KEY=sk-xxxx
API_KEYS = {
    "deepseek": os.environ.get("DEEPSEEK_API_KEY", ""),
    "qwen": os.environ.get("QWEN_API_KEY", ""),
    "zhipu": os.environ.get("ZHIPU_API_KEY", ""),
    "moonshot": os.environ.get("MOONSHOT_API_KEY", ""),
}

# 模型名称
MODEL_NAMES = {
    "deepseek": "deepseek-chat",
    "qwen": "qwen-turbo",
    "zhipu": "glm-4.7-flash",
    "moonshot": "moonshot-v1-8k",
}

# API 端点
API_ENDPOINTS = {
    "deepseek": "https://api.deepseek.com/v1/chat/completions",
    "qwen": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    "zhipu": "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    "moonshot": "https://api.moonshot.cn/v1/chat/completions",
}

# ===== 服务器配置 =====
PORT = int(os.environ.get("PORT", 8080))
HOST = "0.0.0.0"
DEBUG = False
