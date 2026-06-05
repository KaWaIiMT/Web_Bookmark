import { useState, useEffect, useCallback } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { BookmarkPreviewCard } from "@/components/BookmarkPreviewCard";
import { AlreadyBookmarkedView } from "@/components/AlreadyBookmarkedView";
import { ErrorFallbackView } from "@/components/ErrorFallbackView";
import { Toast } from "@/components/Toast";
import { api } from "@/lib/api";
import { getApiUrl } from "@/lib/storage";
import { extractMetadataFromDocument } from "@/lib/metadata";
import type {
  BookmarkData,
  ExtractedMetadata,
  AICategorizeOutput,
  PopupStep,
} from "@/lib/types";

export default function App() {
  const [step, setStep] = useState<PopupStep>("loading");
  const [tabUrl, setTabUrl] = useState("");
  const [tabTitle, setTabTitle] = useState("");
  const [metadata, setMetadata] = useState<ExtractedMetadata | null>(null);
  const [aiResult, setAiResult] = useState<AICategorizeOutput | null>(null);
  const [existingBookmark, setExistingBookmark] = useState<BookmarkData | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [baseUrl, setBaseUrl] = useState("http://localhost:3000");

  // Initialize: get tab URL and check auth
  useEffect(() => {
    init();
  }, []);

  const init = useCallback(async () => {
    try {
      const url = await getApiUrl();
      setBaseUrl(url);

      // Get current tab info
      browser.runtime.sendMessage({ type: "GET_CURRENT_TAB" }, (response) => {
        if (!response?.success) {
          setErrorMsg(response?.error || "无法获取当前页面信息");
          setStep("error");
          return;
        }

        const { url: pageUrl, title: pageTitle } = response.data;
        setTabUrl(pageUrl);
        setTabTitle(pageTitle);

        // Check for restricted pages
        if (
          pageUrl.startsWith("chrome://") ||
          pageUrl.startsWith("chrome-extension://") ||
          pageUrl.startsWith("about:") ||
          pageUrl.startsWith("edge://")
        ) {
          setStep("error");
          return;
        }

        // Start the flow (pass pageTitle directly to avoid React closure issue)
        startBookmarkFlow(pageUrl, pageTitle);
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "初始化失败");
      setStep("error");
    }
  }, []);

  async function startBookmarkFlow(url: string, pageTitle: string) {
    setStep("loading");

    try {
      // Step 1: Extract metadata from page DOM (via content script)
      const metaResult = await extractMetadataFromTab();
      // Determine the best available title
      const domTitle = metaResult?.title;
      const realTabTitle =
        pageTitle && !pageTitle.startsWith("http") && !pageTitle.startsWith("https")
          ? pageTitle
          : "";
      // Prefer DOM title, fall back to tab title, then hostname for display only
      const displayTitle = domTitle || realTabTitle || new URL(url).hostname;
      const extractedMeta = metaResult || {
        title: displayTitle,
        description: "",
        coverImage: "",
        favicon: "",
        siteName: new URL(url).hostname,
        contentType: "webpage",
      };
      setMetadata(extractedMeta);
      // Store the real title (DOM or tab) for saving; empty if neither available
      setTitle(domTitle || realTabTitle);

      // Step 2: Check if URL is already bookmarked
      const existing = await api.checkDuplicate(url);
      if (existing) {
        setExistingBookmark(existing);
        setStep("already_bookmarked");
        return;
      }

      // Step 3: Get AI categorization
      try {
        const ai = await api.categorize({
          title: extractedMeta.title,
          description: extractedMeta.description,
          siteName: extractedMeta.siteName,
          contentType: extractedMeta.contentType,
        });
        setAiResult(ai);
        setTags(ai.tags || []);
      } catch {
        // AI categoriation failed — continue without it
        setAiResult(null);
        setTags([]);
        setCategoryId(null);
      }

      setStep("preview");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "加载失败");
      setStep("error");
    }
  }

  async function extractMetadataFromTab(): Promise<ExtractedMetadata | null> {
    try {
      // Query the active tab and try to send message to content script
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tabId = tabs[0]?.id;
      if (!tabId) return null;

      const response = await browser.tabs.sendMessage(tabId, {
        type: "EXTRACT_METADATA",
      });
      if (response?.success) {
        return response.data as ExtractedMetadata;
      }
      return null;
    } catch {
      // Content script may not be injected yet or page is restricted
      return null;
    }
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      await api.createBookmark({
        url: tabUrl,
        title: title || undefined,
        description: aiResult?.summary || metadata?.description || "",
        categoryId,
      });
      setToast({ message: "收藏成功！", type: "success" });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "收藏失败",
        type: "error",
      });
      setSaving(false);
    }
  }

  function handleToastDone() {
    setToast(null);
    if (toast?.type === "success") {
      // Close the popup after success
      setTimeout(() => window.close(), 300);
    }
  }

  async function handleSaveLinkOnly(url: string, manualTitle: string) {
    setSaving(true);
    try {
      await api.createBookmark({
        url,
        title: manualTitle || url,
      });
      setToast({ message: "链接已保存！", type: "success" });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "保存失败",
        type: "error",
      });
      setSaving(false);
    }
  }

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-[560px]">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
          <h1 className="text-base font-display font-bold text-[var(--foreground)]">
            MarkBox
          </h1>
          {step === "preview" && (
            <span className="text-[10px] text-[var(--muted-foreground)] font-sans">
              预览
            </span>
          )}
        </header>

        {/* Content */}
        <div className="flex-1">
          {step === "loading" && <SkeletonLoader />}

          {step === "preview" && metadata && (
            <BookmarkPreviewCard
              url={tabUrl}
              metadata={metadata}
              aiResult={aiResult}
              tags={tags}
              title={title}
              categoryId={categoryId}
              saving={saving}
              onTitleChange={setTitle}
              onTagRemove={(tag) => setTags((t) => t.filter((x) => x !== tag))}
              onTagAdd={(tag) => setTags((t) => [...t, tag])}
              onCategoryChange={setCategoryId}
              onConfirm={handleConfirm}
            />
          )}

          {step === "already_bookmarked" && existingBookmark && (
            <AlreadyBookmarkedView
              bookmark={existingBookmark}
              baseUrl={baseUrl}
            />
          )}

          {step === "error" && (
            <ErrorFallbackView
              url={tabUrl}
              defaultTitle={tabTitle}
              onSaveLinkOnly={handleSaveLinkOnly}
              saving={saving}
            />
          )}
        </div>

        {/* Footer */}
        {step === "preview" && (
          <div className="px-4 py-2 border-t border-[var(--border)] text-center">
            <p className="text-[10px] text-[var(--foreground)]/20 font-sans">
              使用 Ctrl+Shift+D 静默收藏
            </p>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={handleToastDone}
        />
      )}
    </AuthGuard>
  );
}
