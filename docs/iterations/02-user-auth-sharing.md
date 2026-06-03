# 迭代 02 — 用户系统 & 社区分享

> 日期: 2026-06-04
> 依赖: [迭代 01-B](./01-B-feature-roadmap.md)

---

## 决策记录（Grill-Me 结果）

| # | 决策点 | 选择 | 理由 |
|---|--------|------|------|
| 1 | 登录方式 | **GitHub OAuth** | 评委有 GitHub 账号，现场演示流畅；NextAuth.js v5 配置量极少 |
| 2 | 分享级别 | 公开分享（有主） | 链接持久化、可管理、可撤销 |
| 3 | 分享粒度 | 单条 + 批量都支持 | 单条生成分享卡片，批量按收藏夹/标签分享 |
| 4 | 批量组织方式 | **收藏夹（Collection）** | 用户手动创建文件夹，比纯依赖 AI 分类更灵活 |
| 5 | 标签所有权 | 用户私有，可自创修改 | 标签不再是纯 AI 产物，用户可手动增删改 |

---

## 新增数据模型

```prisma
model User {
  id          String   @id @default(cuid())
  name        String?
  email       String?  @unique
  image       String?
  githubId    String?  @unique     // GitHub OAuth ID
  createdAt   DateTime @default(now())
  bookmarks   Bookmark[]
  collections Collection[]
  tags        Tag[]
}

model Collection {
  id        String   @id @default(cuid())
  name      String
  slug      String
  isPublic  Boolean  @default(false)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  bookmarks CollectionBookmark[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model CollectionBookmark {
  collectionId String
  bookmarkId   String
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  bookmark     Bookmark   @relation(fields: [bookmarkId], references: [id], onDelete: Cascade)
  addedAt      DateTime   @default(now())

  @@id([collectionId, bookmarkId])
}

// 修改现有 Bookmark: 加 userId
// 修改现有 Tag: 加 userId，移除 唯一 slug 约束（不同用户可以有同名标签）
```

---

## 实现路线图

### Phase 1: Auth 地基
- [ ] 安装 next-auth v5 (`next-auth@beta`)
- [ ] GitHub OAuth App 注册
- [ ] Prisma schema 加 User，push
- [ ] auth.ts 配置（GitHub provider + Prisma adapter）
- [ ] `<SessionProvider>` 包裹 layout
- [ ] 登录/登出按钮（显示头像）
- [ ] 中间件：未登录 → 跳 GitHub 授权

### Phase 2: 数据隔离
- [ ] Bookmark → 加 userId
- [ ] Tag → 加 userId
- [ ] 所有 API 路由加 session 校验
- [ ] 前端搜索/列表 → 按当前用户过滤

### Phase 3: 收藏夹
- [ ] Collection CRUD API
- [ ] 收藏夹 UI（侧边栏新增"我的收藏夹"）
- [ ] 拖书签到收藏夹
- [ ] 书签添加到收藏夹

### Phase 4: 分享
- [ ] 生成分享链接（`/share/:id`）
- [ ] 公开查看页（不需要登录）
- [ ] 分享卡片预览（OG 优化）
- [ ] 单条书签分享

---

## 当前已确认功能池

| 功能 | 状态 |
|------|------|
| #1 AI 自动归类 + 智能标签 | ✅ 完成 |
| #2 富媒体预览 | ✅ 完成 |
| #3 语义搜索 | ✅ 完成 |
| #4 元数据提取引擎 | ✅ 完成 |
| #5 书签生命周期 | ✅ 完成 |
| #8 共享收藏夹 | 🔨 本次实施 |
| #14 AI 摘要 | ✅ 完成 |
| #21 标签自主创建/修改 | 🔨 本次实施 |
