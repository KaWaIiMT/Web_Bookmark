-- Create indexes for bookmark filtering performance
CREATE INDEX IF NOT EXISTS "Bookmark_userId_status_idx" ON "Bookmark"("userId", "status");
CREATE INDEX IF NOT EXISTS "Bookmark_userId_categoryId_idx" ON "Bookmark"("userId", "categoryId");
CREATE INDEX IF NOT EXISTS "Bookmark_userId_order_createdAt_idx" ON "Bookmark"("userId", "order", "createdAt");
