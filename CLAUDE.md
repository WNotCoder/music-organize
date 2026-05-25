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
- 开发环境: `.env.development`
- 生产环境: `.env.production`
- 敏感信息通过环境变量管理

## 6. Git 工作流程
- 主分支: `main`
- 功能分支: `feature/xxx`
- 提交信息: 英文，使用命令式语气

## 7. 依赖要求
- Node.js >= 18
- npm 或 yarn
- 数据库: SQLite（嵌入式）

## 8. 部署方式
- Subsonic API 端点位于 `/rest/*`
- Web 用户界面位于 `/`

## 9. 维护说明
- 启用日志轮转
- 建议定期备份
- 定期清理临时文件