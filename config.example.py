# 墨香国学AI - API 配置文件
# 复制此文件为 config.py 并填入你的 API Key

# ===== AI 模型配置 =====
# 支持：deepseek / qwen / zhipu / moonshot
AI_PROVIDER = "deepseek"

# API Keys（请填入你自己的Key）
API_KEYS = {
    "deepseek": "YOUR_DEEPSEEK_API_KEY",
    "qwen": "YOUR_QWEN_API_KEY",
    "zhipu": "YOUR_ZHIPU_API_KEY",
    "moonshot": "YOUR_MOONSHOT_API_KEY",
}

# 模型名称
MODEL_NAMES = {
    "deepseek": "deepseek-chat",
    "qwen": "qwen-turbo",
    "zhipu": "glm-4-flash",
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
PORT = 8080
HOST = "0.0.0.0"
DEBUG = True
