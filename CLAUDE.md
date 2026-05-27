# 音乐整理项目规范

## 1. 项目概述
Music Organize 是一个音乐文件管理系统，能够自动扫描、标记和整理下载目录中的音乐文件到结构化的音乐库中，并兼容 Subsonic 协议以支持远程访问。

## 2. 目录结构
```
music-organize/
├── frontend/          # Web 用户界面 (React)
├── backend/           # API 服务器 (Node.js)
├── scripts/           # 扫描和整理的 CLI 脚本
├── config/            # 配置文件
├── docs/              # 文档
└── README.md
```

## 3. 命名规范
- **文件**: 小写连字符格式 lowercase-with-hyphens.js
- **目录**: 小写连字符格式 lowercase-with-hyphens
- **类**: 大驼峰格式 PascalCase
- **函数/变量**: 小驼峰格式 camelCase
- **常量**: 大写下划线格式 UPPER_CASE_WITH_UNDERSCORES

## 4. 编码标准
- 使用 TypeScript 保证类型安全
- 遵循 ESLint 规则
- 为公共函数编写 JSDoc 注释
- 优先使用 async/await 而非回调函数

## 5. 环境配置

### 5.1 环境文件

项目使用 `.env` 文件存储敏感配置信息，该文件已添加到 `.gitignore`，不会被 git 同步。

| 文件 | 说明 | 是否同步 |
|------|------|----------|
| `.env` | 本地开发环境配置，包含敏感信息 | 否 |
| `.env.example` | 示例配置文件，不含敏感信息 | 是 |

### 5.2 环境变量说明

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `PORT` | 服务器监听端口 | `3000` | 否 |
| `DATABASE_PATH` | SQLite 数据库文件路径 | `./data/music-organize.db` | 否 |
| `STORAGE_PATH` | 音乐文件存储目录 | `./media/organized` | 否 |
| `ADMIN_USERNAME` | 默认管理员用户名 | `admin` | 否 |
| `ADMIN_PASSWORD` | 默认管理员密码 | `password` | 否 |
| `ACOUSTID_API_KEY` | Acoustid API 密钥 | 空 | 否 |
| `LOG_LEVEL` | 日志级别 (debug/info/warn/error) | `info` | 否 |

### 5.3 Acoustid API 密钥

Acoustid 用于音频指纹识别，可提高歌曲标签的准确性。获取方式：

1. 访问 https://acoustid.org/api-key
2. 使用邮箱注册并获取免费 API 密钥
3. 将密钥设置到 `ACOUSTID_API_KEY` 环境变量中

### 5.4 使用步骤

1. 从 `.env.example` 复制一份为 `.env`
2. 根据需要修改 `.env` 中的配置项
3. 确保 `.env` 文件不被 git 提交（已在 `.gitignore` 中配置）

## 6. Git 工作流程
- 主分支: `main`
- 功能分支: `feature/xxx`
- 提交信息: 中文，使用命令式语气

## 7. 依赖要求
- Node.js >= 18
- npm 或 yarn
- 数据库: SQLite（嵌入式）
- chromaprint (fpcalc): 用于生成音频指纹，用于 Acoustid 匹配

## 8. 部署方式
- Subsonic API 端点位于 `/rest/*`
- Web 用户界面位于 `/`

## 9. 维护说明
- 启用日志轮转
- 建议定期备份
- 定期清理临时文件
- 增加、修改、删除需求需要先完善需求文档，文档内容确定后再依据文档进行开发