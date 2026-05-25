# UI 设计参考文档 - React + Tailwind CSS 风格

---

## 1. 设计风格偏好

### 1.1 整体风格
- [x] 现代简约
- [x] 深色主题（适合音乐播放器）
- [ ] 浅色主题
- [x] 渐变色彩（适度使用）
- [x] 扁平化设计

### 1.2 颜色方案（基于项目设计规范）

| 类型 | 颜色值 | 用途 |
|------|--------|------|
| 主色调 (Primary) | `#1a1a2e` (深蓝色) | 页面背景、主要区域 |
| 次色调 (Secondary) | `#4a1942` (紫色) | 按钮、链接、高亮元素 |
| 成功色 (Success) | `#00C16A` (green-500) | 成功状态、完成提示 |
| 信息色 (Info) | `#3B82F6` (blue-500) | 信息提示、通知 |
| 警告色 (Warning) | `#F59E0B` (amber-500) | 警告提示、待处理 |
| 错误色 (Error) | `#EF4444` (red-500) | 错误提示、表单验证 |
| 中性色 (Neutral) | `#64748B` (slate-500) | 边框、分隔线 |
| 背景色 | `#1a1a2e` (深蓝色) | 页面背景 |
| 卡片背景 | `#16213e` | 卡片、面板背景 |
| 主要文字 | `#ffffff` | 标题、正文 |
| 辅助文字 | `#a0a0a0` | 提示文字、次要内容 |

### 1.3 字体方案（Tailwind CSS 默认）

| 用途 | 字体名称 | 字号 | 字重 |
|------|----------|------|------|
| 标题 | Inter | 24px - 32px | Semibold (600) |
| 副标题 | Inter | 18px - 20px | Medium (500) |
| 正文 | Inter | 14px - 16px | Regular (400) |
| 小字/提示 | Inter | 12px | Light (300) |

---

## 2. 布局参考

### 2.1 整体布局
- [x] 侧边栏导航 + 主内容区
- [x] 顶部导航栏（移动端可折叠）
- [x] 底部导航（移动端）

### 2.2 卡片设计（Tailwind CSS 风格）
- [x] 圆角半径：`8px` (rounded-lg)
- [x] 阴影效果：`shadow-lg`（适度阴影）
- [x] 边框：`border border-purple-900/50`（紫色边框）
- [x] 背景：`bg-[#16213e]`

### 2.3 按钮样式（Tailwind CSS 风格）
- [x] 圆角半径：`6px` (rounded-md)
- [x] 悬停效果：颜色加深 + 轻微缩放
- [x] 激活状态：颜色变化 + 阴影
- [x] 高度：`40px` (h-10)
- [x] 主按钮背景：`bg-[#4a1942]`（紫色）

---

## 3. 参考网站/应用

### 3.1 参考链接

| 序号 | 网站/应用名称 | URL | 参考点 |
|------|--------------|-----|--------|
| 1 | Nuxt UI | https://ui.nuxt.com | 组件设计、配色方案、布局 |
| 2 | Spotify | https://open.spotify.com | 深色主题、专辑封面展示 |
| 3 | Apple Music | https://music.apple.com | 播放界面设计、交互模式 |

### 3.2 Tailwind CSS 组件参考

| 组件 | Tailwind CSS 类名 | 用途 |
|------|-----------------|------|
| 按钮 | `btn` (自定义) | 操作按钮 |
| 卡片 | `card` (自定义) | 内容展示 |
| 输入框 | `input` (自定义) | 表单输入 |
| 选择框 | `select` (自定义) | 下拉选择 |
| 开关 | `switch` (自定义) | 开关控制 |
| 进度条 | `progress` (自定义) | 进度展示 |
| 表格 | `table` | 数据列表 |
| 弹窗 | `Modal` (React 组件) | 模态框 |
| Toast | `Toast` (React 组件) | 消息提示 |
| 加载 | `Spinner` (React 组件) | 加载状态 |

---

## 4. 页面设计要求

### 4.1 仪表盘页面
- [x] 统计卡片：Nuxt UI Card 组件，展示音乐数量、歌手数量、专辑数量
- [x] 扫描状态：进度条 + 状态标签
- [x] 最近更新：列表展示，带封面缩略图

### 4.2 音乐库页面
- [x] 展示方式：网格视图为主，支持切换为列表视图
- [x] 封面尺寸：`180x180px` 或 `200x200px`
- [x] 悬停效果：缩放 + 阴影加深

### 4.3 设置页面
- [x] 表单风格：分组式布局，使用 UCard 包裹
- [x] 配置分组：存储配置、刮削配置、Subsonic 配置

### 4.4 任务管理页面
- [x] 任务列表样式：表格形式，展示任务状态、进度、时间
- [x] 进度条设计：Nuxt UI UProgress 组件

---

## 5. 交互设计

### 5.1 动画效果
- [x] 页面切换动画：淡入效果 (fade-in)
- [x] 按钮点击效果：轻微缩放 + 颜色变化
- [x] 卡片悬停效果：上移 + 阴影加深

### 5.2 加载状态
- [x] 加载动画样式：脉冲效果 (pulse)
- [x] 进度提示：百分比显示

### 5.3 错误提示
- [x] 提示样式：Toast（Nuxt UI useToast）
- [x] 位置：顶部右侧

---

## 6. 响应式设计

### 6.1 断点设置（Tailwind CSS 默认）

| 设备类型 | 屏幕宽度 | Tailwind 断点 | 布局调整 |
|----------|----------|---------------|----------|
| 桌面端 | >= 1024px | lg | 完整侧边栏 + 主内容区 |
| 平板端 | 640px - 1023px | md | 侧边栏可折叠 |
| 移动端 | < 640px | sm | 底部导航 + 抽屉式侧边栏 |

---

## 7. 图标风格

- [x] 线性图标（Lucide）
- [x] 图标库：Lucide React

---

## 8. Tailwind CSS 主题配置示例

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-[#1a1a2e] text-white;
    font-family: 'Inter', sans-serif;
  }
}

@layer components {
  .btn {
    @apply px-4 py-2 rounded-md font-medium transition-all duration-200;
  }
  
  .btn-primary {
    @apply bg-[#4a1942] hover:bg-[#5a2952] text-white;
  }
  
  .card {
    @apply bg-[#16213e] rounded-lg border border-purple-900/50 shadow-lg;
  }
  
  .input {
    @apply w-full px-3 py-2 bg-[#0f0f1a] border border-slate-700 rounded-md 
           focus:outline-none focus:border-[#4a1942] transition-colors;
  }
}
```

```typescript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a2e',
        secondary: '#4a1942',
      },
    },
  },
  plugins: [],
}
```

---

## 附录

### 设计资源链接
- Tailwind CSS：https://tailwindcss.com
- Lucide React：https://lucide.dev/docs/lucide-react
- React Icons：https://react-icons.github.io/react-icons/