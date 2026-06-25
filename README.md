# 墨香国学AI - 部署与体验指南

## 在线体验（推荐）

如果提供了在线链接，请直接访问链接体验完整功能（含 DeepSeek AI）。

## 本地体验

### 方式1：完整 AI 体验（需要 API Key）

1. 安装依赖：
   ```bash
   pip install flask requests
   ```

2. 设置环境变量：
   - Windows: `set DEEPSEEK_API_KEY=你的API密钥`
   - Mac/Linux: `export DEEPSEEK_API_KEY=你的API密钥`

3. 启动服务：
   ```bash
   python server.py
   ```

4. 浏览器访问 http://localhost:8080

### 方式2：快速预览（无 AI，纯前端）

直接用浏览器打开 `index.html` 即可预览界面。

> 注意：此方式下 AI 老师和诸葛亮对话会使用本地关键词匹配，非真实大模型回复。

## 技术栈

- 前端：HTML5 + CSS3 + JavaScript（无框架）
- 后端：Python Flask
- AI：DeepSeek API（需配置 API Key）
