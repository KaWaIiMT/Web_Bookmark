# MarkBox — AI 智能书签管理器

## 项目简介

MarkBox 是一个 AI 驱动的书签管理工具：粘贴链接 → AI 自动提取摘要、生成标签、建议分类。支持拖拽排序、画廊/时间线/仪表板多视图、GitHub OAuth 登录、收藏夹公开分享、语音搜索、深色模式。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.2.6 (Turbopack) | 全栈框架 (App Router) |
| React | 19.2.4 | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Prisma | 7.8.0 | ORM (SQLite via libsql) |
| next-auth | 5.0.0-beta.31 | GitHub OAuth 认证 |
| Tailwind CSS | 4.x | 原子化 CSS |
| shadcn/ui + base-ui | latest | UI 组件库 |
| motion (Framer Motion) | 12.x | 动画引擎 |
| dnd-kit | latest | 拖拽排序 |
| Recharts | 2.x | 图表（仪表板） |
| DeepSeek V4 Flash | API | AI 标签/分类/摘要 |
| date-fns | 4.x | 日期处理 |
| sonner | 2.x | Toast 通知 |
| next-themes | 0.4.x | 深色模式 |
| lucide-react | 1.x | 图标库 |

## 环境要求

- **Node.js** ≥ 20.x
- **npm** ≥ 10.x
- 能够访问 DeepSeek API（中国大陆网络）或使用代理

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/KaWaIiMT/Web_Bookmark.git
cd Web_Bookmark
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local`，然后填写以下三项：

| 变量 | 说明 | 在哪里获取 |
|------|------|------------|
| `AUTH_GITHUB_ID` | GitHub OAuth App Client ID | [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers) |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Client Secret | 同上，创建 OAuth App 后生成 |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | [platform.deepseek.com](https://platform.deepseek.com) → API Keys |

**OAuth App 重要设置：** 创建 GitHub OAuth App 时，Callback URL 必须填：
```
http://localhost:3000/api/auth/callback/github
```

### 4. 初始化数据库

```bash
npx prisma db push
```

这会根据 `prisma/schema.prisma` 自动创建 SQLite 数据库文件 `dev.db`。

### 5. 启动开发服务器

```bash
npm run dev
```

打开 `http://localhost:3000`，点击右上角 **登录** 使用 GitHub 账号登录即可使用。

## 环境变量完整列表

```bash
# .env.local
AUTH_GITHUB_ID=你的GitHub_OAuth_Client_ID
AUTH_GITHUB_SECRET=你的GitHub_OAuth_Client_Secret
AUTH_SECRET=任意随机字符串（用于加密session，可用 openssl rand -hex 32 生成）
DEEPSEEK_API_KEY=你的DeepSeek_API_Key

# 以下两项仅中国大陆用户需要（GFW 代理）
# 如果不在大陆，可以不设置
HTTP_PROXY=http://127.0.0.1:7897
HTTPS_PROXY=http://127.0.0.1:7897
```

**AUTH_SECRET 生成方法：**
```bash
# 在终端运行
openssl rand -hex 32
# 或者用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 项目结构

```
src/
├── app/                        # Next.js App Router
│   ├── api/                    # REST API 路由
│   │   ├── ai/categorize/      # AI 标签/分类 API
│   │   ├── auth/[...nextauth]/ # NextAuth 认证端点
│   │   ├── bookmarks/          # 书签 CRUD + 排序
│   │   ├── categories/         # 分类 CRUD + 排序
│   │   ├── collections/        # 收藏夹 CRUD
│   │   ├── metadata/           # URL 元数据提取
│   │   ├── search/             # 全文搜索
│   │   └── stats/              # 统计数据 / 时间线 / 周报
│   ├── login/                  # 登录页面
│   ├── settings/               # 设置页面
│   └── share/[id]/             # 公开分享页面
├── components/                 # React 组件
│   ├── ui/                     # shadcn/ui 基础组件
│   ├── Sidebar.tsx             # 侧边栏（可拖拽排序分类）
│   ├── AddBookmarkDialog.tsx   # 添加/编辑书签对话框
│   ├── SortableBookmarkGrid.tsx# 可拖拽排序的卡片网格
│   ├── BookmarkCard.tsx        # 书签卡片
│   ├── BookmarkDetailSheet.tsx # 书签详情抽屉
│   ├── MasonryGallery.tsx      # 画廊/瀑布流视图
│   ├── DashboardView.tsx       # 仪表板（饼图+柱状图+词云）
│   ├── TimelineView.tsx        # 时间线视图
│   ├── WeeklyReport.tsx        # 每周周报
│   ├── WordCloud.tsx           # 纯 CSS 词云
│   ├── VoiceSearch.tsx         # 语音搜索（Web Speech API）
│   ├── ViewTabs.tsx            # 视图切换选项卡
│   ├── ThemeProvider.tsx       # 深色/浅色主题
│   └── ThemeToggle.tsx         # 主题切换按钮
├── lib/                        # 工具库
│   ├── auth.ts                 # NextAuth 配置
│   ├── prisma.ts               # Prisma 客户端
│   ├── metadata.ts             # 元数据提取（cheerio + B站API）
│   ├── deepseek.ts             # DeepSeek AI 调用
│   ├── types.ts                # TypeScript 类型定义
│   ├── sounds.ts               # Web Audio API 拖拽音效
│   └── utils.ts                # cn() 工具函数
└── generated/prisma/           # Prisma 生成的客户端代码
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（localhost:3000） |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | ESLint 代码检查 |
| `npx prisma db push` | 同步数据库 schema |
| `npx prisma studio` | 打开 Prisma Studio（数据库 GUI） |

## 常见问题

### Q: 登录时提示 "Server error / Configuration"？
A: 检查 `.env.local` 中的 `AUTH_GITHUB_ID` 和 `AUTH_GITHUB_SECRET` 是否正确，以及 GitHub OAuth App 的 Callback URL 是否设置正确。

### Q: 中国大陆无法登录 GitHub OAuth？
A: 设置 `HTTP_PROXY` 和 `HTTPS_PROXY` 为你的代理地址（如 Clash 默认 `127.0.0.1:7897`）。

### Q: AI 分类不生效？
A: 检查 `DEEPSEEK_API_KEY` 是否配置正确。AI 分类失败不影响书签保存。

### Q: 数据库在哪里？
A: SQLite 数据库文件 `dev.db` 在项目根目录，由 Prisma 自动创建。`.gitignore` 已将其排除。
