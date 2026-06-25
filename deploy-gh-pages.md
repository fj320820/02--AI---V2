# GitHub Pages 部署指南

由于当前环境无法直接连接Vercel，请按以下步骤手动部署到 GitHub Pages：

## 步骤1：创建GitHub仓库

1. 访问 https://github.com/new
2. 仓库名称：`moxiang-guoxue-ai`
3. 选择 Public（公开）
4. 点击 "Create repository"

## 步骤2：上传项目文件

在项目文件夹中执行：

```bash
cd /workspace/moxiang-demo

# 初始化git仓库
git init
git add .
git commit -m "Initial commit"

# 添加远程仓库（替换为你的用户名）
git remote add origin https://github.com/你的用户名/moxiang-guoxue-ai.git

# 推送到main分支
git branch -M main
git push -u origin main
```

## 步骤3：开启GitHub Pages

1. 打开仓库页面：https://github.com/你的用户名/moxiang-guoxue-ai
2. 点击 "Settings" 标签
3. 左侧菜单选择 "Pages"
4. "Source" 选择 "Deploy from a branch"
5. Branch 选择 "main"，文件夹选择 "/ (root)"
6. 点击 "Save"

## 步骤4：获取公网链接

等待1-2分钟后，访问：
```
https://你的用户名.github.io/moxiang-guoxue-ai/
```

## 注意：AI功能说明

GitHub Pages 是纯静态托管，**不支持后端服务**。因此：

- 页面可以正常访问和浏览
- 中文输入功能可以正常使用
- **AI老师问答和诸葛亮对话会降级到本地关键词匹配**（不调用DeepSeek API）

如果需要完整的AI功能，需要部署到有后端支持的服务（如Vercel、Render、Railway等）。

## 替代方案：使用 Render 或 Railway

如果希望保留AI功能，可以：
1. 注册 https://render.com（免费）
2. 创建新的 Web Service
3. 连接你的 GitHub 仓库
4. 自动部署，获得公网链接

Render 支持 Python Flask 后端，可以完整保留AI功能。
