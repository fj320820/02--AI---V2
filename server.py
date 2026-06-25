#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
墨香国学AI - Flask 后端服务
接入真实大模型 API，为前端提供 AI 对话能力
支持：DeepSeek / 通义千问 / 智谱 / Moonshot
"""
import json
import os
import sys
import time
import traceback

# 尝试导入 requests，如果没有则安装
try:
    import requests
except ImportError:
    print("正在安装 requests...")
    os.system(f"{sys.executable} -m pip install requests --break-system-packages -q")
    import requests

# 尝试导入 flask，如果没有则安装
try:
    from flask import Flask, request, jsonify, send_from_directory
except ImportError:
    print("正在安装 flask...")
    os.system(f"{sys.executable} -m pip install flask --break-system-packages -q")
    from flask import Flask, request, jsonify, send_from_directory

# 导入配置
try:
    from config import AI_PROVIDER, API_KEYS, MODEL_NAMES, API_ENDPOINTS, PORT, HOST, DEBUG
except ImportError:
    print("错误：找不到 config.py，请复制 config.example.py 为 config.py 并填入 API Key")
    sys.exit(1)

app = Flask(__name__)

# 静态文件目录
STATIC_DIR = os.path.dirname(os.path.abspath(__file__))


# ===== AI 提示词模板 =====

TEACHER_SYSTEM_PROMPT = '''你是「墨香国学AI」的AI老师，专门为初中生讲解《出师表》。

你的风格：
1. 像一位耐心、有趣的语文老师，用初中生听得懂的语言
2. 不掉书袋，不用生僻词，不写长篇大论
3. 回答控制在150-250字之间
4. 善于用比喻和生活化的例子
5. 鼓励学生思考，而不是直接给标准答案
6. 如果学生问的问题和《出师表》无关，温和地引导回来

你掌握的知识：
- 《出师表》全文、译文、注释、历史背景
- 诸葛亮生平：隆中对、三顾茅庐、赤壁之战、北伐、五丈原
- 三国历史：蜀汉、曹魏、东吴的基本情况
- 相关人物：刘备、刘禅、司马懿、马谡、魏延、杨仪等
- 《出师表》的文学价值和现实意义

注意：你只回答与《出师表》、诸葛亮、三国历史相关的问题。如果学生问完全不相关的问题，礼貌地说：这个问题超出了我的知识范围哦，我主要擅长讲解《出师表》和诸葛亮的故事。有什么关于古文的问题想问我吗？'''

KONGMING_SYSTEM_PROMPT = '''你是诸葛亮，字孔明，号卧龙，蜀汉丞相。现在是建兴五年（公元227年），你正在五丈原军营中。

你的身份和状态：
- 你五十四岁，积劳成疾，身体每况愈下
- 你正在准备第五次北伐
- 你面前是一位来自千年后的年轻人（学生）
- 你说话简洁有力，不啰嗦，不解释概念
- 你用文言与白话混合的风格，像一位沉稳的老者

对话规则（非常重要）：
1. 你的回复必须是三段式结构：
   - 【判断】先给出你的直接结论（1-2句话）
   - 【应对】说明你会怎么做，为什么这样做（2-4句话）
   - 【留问】反问对方一个引人深思的问题（1句话）
2. 不要解释历史概念，不要写作文，不要总结道理
3. 只做决策与回应，形成对话的压迫感和沉浸感
4. 偶尔在回复前加一个动作描写，如"[按剑而坐]"、"[抚须沉思]"
5. 回复控制在100-200字之间

你的性格：
- 谨慎但不犹豫
- 忠诚但不愚忠
- 聪明但不炫耀
- 严肃中带一丝温情

你掌握的知识：
- 三国历史、蜀汉政治、军事战略
- 你的所有经历：隆中对、赤壁、入蜀、北伐
- 你对刘备的承诺、对刘禅的担忧
- 你对司马懿、魏延、杨仪等人的看法'''


# ===== AI API 调用 =====

def call_ai_api(system_prompt, user_message, mode="teacher"):
    """调用大模型 API，返回生成的文本"""
    provider = AI_PROVIDER
    api_key = API_KEYS.get(provider, "")
    
    if not api_key:
        return None, "未配置 API Key，请在 config.py 中填入你的 API Key"
    
    endpoint = API_ENDPOINTS.get(provider, "")
    model = MODEL_NAMES.get(provider, "")
    
    if not endpoint or not model:
        return None, f"不支持的 AI 提供商: {provider}"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.7 if mode == "teacher" else 0.8,
        "max_tokens": 500 if mode == "teacher" else 400,
        "stream": False
    }
    
    try:
        resp = requests.post(
            endpoint,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if resp.status_code == 200:
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            return content.strip(), None
        else:
            error_msg = f"API 返回错误 {resp.status_code}: {resp.text[:200]}"
            return None, error_msg
            
    except requests.exceptions.Timeout:
        return None, "AI 响应超时，请稍后重试"
    except requests.exceptions.ConnectionError:
        return None, "无法连接到 AI 服务，请检查网络"
    except Exception as e:
        return None, f"AI 调用失败: {str(e)}"


# ===== 路由 =====

@app.route("/")
def index():
    return send_from_directory(STATIC_DIR, "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(STATIC_DIR, path)

@app.route("/api/teacher", methods=["POST", "OPTIONS"])
def api_teacher():
    """AI 老师问答接口"""
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response
    
    data = request.get_json(force=True, silent=True) or {}
    question = data.get("question", "").strip()
    
    if not question:
        return jsonify({"status": "error", "error": "问题不能为空"}), 400
    
    # 调用 AI
    reply, error = call_ai_api(TEACHER_SYSTEM_PROMPT, question, mode="teacher")
    
    if error:
        return jsonify({
            "status": "fallback",
            "question": question,
            "reply": f"AI 服务暂时不可用（{error}）。请稍后再试，或换个问题问我。",
            "is_ai": False
        })
    
    return jsonify({
        "status": "ok",
        "question": question,
        "reply": reply,
        "is_ai": True
    })

@app.route("/api/kongming", methods=["POST", "OPTIONS"])
def api_kongming():
    """诸葛亮对话接口"""
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response
    
    data = request.get_json(force=True, silent=True) or {}
    question = data.get("question", "").strip()
    
    if not question:
        return jsonify({"status": "error", "error": "问题不能为空"}), 400
    
    # 调用 AI
    reply, error = call_ai_api(KONGMING_SYSTEM_PROMPT, question, mode="kongming")
    
    if error:
        return jsonify({
            "status": "fallback",
            "question": question,
            "reply": f"[ 帐外风沙骤起 ]\n\n此间信号不稳，丞相的话未能传到。请稍后再问。\n\n（{error}）",
            "is_ai": False
        })
    
    return jsonify({
        "status": "ok",
        "question": question,
        "reply": reply,
        "is_ai": True
    })

@app.route("/api/health")
def health():
    """健康检查接口"""
    provider = AI_PROVIDER
    has_key = bool(API_KEYS.get(provider, ""))
    return jsonify({
        "status": "ok",
        "provider": provider,
        "has_api_key": has_key,
        "model": MODEL_NAMES.get(provider, "unknown")
    })


# ===== 启动 =====

if __name__ == "__main__":
    print("=" * 50)
    print("  墨香国学AI - AI 后端服务")
    print("=" * 50)
    print(f"  AI 提供商: {AI_PROVIDER}")
    print(f"  模型: {MODEL_NAMES.get(AI_PROVIDER, 'unknown')}")
    print(f"  API Key: {'已配置 ✓' if API_KEYS.get(AI_PROVIDER) else '未配置 ✗'}")
    print(f"  服务地址: http://localhost:{PORT}")
    print(f"  健康检查: http://localhost:{PORT}/api/health")
    print("=" * 50)
    
    if not API_KEYS.get(AI_PROVIDER):
        print("\n⚠️  警告：未配置 API Key！")
        print("   请编辑 config.py，填入你的 API Key")
        print("   推荐使用 DeepSeek（https://platform.deepseek.com）")
        print("   新用户注册通常赠送免费额度\n")
    
    app.run(host=HOST, port=PORT, debug=DEBUG)

# Vercel Serverless 入口
# vercel.json 会调用此模块
app = app
