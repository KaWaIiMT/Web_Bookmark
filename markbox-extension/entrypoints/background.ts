import { getApiKey } from "@/lib/storage";

/**
 * Background Service Worker
 * - Context menu (right-click to bookmark)
 * - Silent bookmark keyboard shortcut (Ctrl+Shift+S)
 * - Tab info relay for popup/sidepanel
 */

const BASE_URL = "https://ccjproject.top";

export default defineBackground(() => {
  // --- Context Menu ---
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: "bookmark-page",
      title: "收藏当前页面到 MarkBox",
      contexts: ["page"],
    });
    browser.contextMenus.create({
      id: "bookmark-link",
      title: "收藏链接到 MarkBox",
      contexts: ["link"],
    });
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    let url = "";

    if (info.menuItemId === "bookmark-link" && info.linkUrl) {
      url = info.linkUrl;
    } else if (info.menuItemId === "bookmark-page" && tab?.url) {
      url = tab.url;
    }
    if (!url) return;

    try {
      const pageTitle =
        info.menuItemId === "bookmark-page" && tab?.title && !tab.title.startsWith("http")
          ? tab.title
          : undefined;
      await doSilentBookmark(url, pageTitle);
      if (tab?.id) {
        browser.action.setBadgeText({ text: "✓", tabId: tab.id });
        browser.action.setBadgeBackgroundColor({ color: "#7a9e7e", tabId: tab.id });
        setTimeout(() => {
          browser.action.setBadgeText({ text: "", tabId: tab.id! });
        }, 1500);
      }
    } catch {
      if (tab?.id) {
        browser.action.setBadgeText({ text: "✗", tabId: tab.id });
        browser.action.setBadgeBackgroundColor({ color: "#e07050", tabId: tab.id });
        setTimeout(() => {
          browser.action.setBadgeText({ text: "", tabId: tab.id! });
        }, 1500);
      }
    }
  });

  // --- Keyboard Shortcut: Silent Bookmark ---
  browser.commands.onCommand.addListener(async (command) => {
    if (command !== "silent_bookmark") return;
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab?.url) return;
    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("about:") ||
      tab.url.startsWith("edge://")
    ) return;

    try {
      const pageTitle = tab.title && !tab.title.startsWith("http") ? tab.title : undefined;
      await doSilentBookmark(tab.url, pageTitle);
      browser.action.setBadgeText({ text: "✓", tabId: tab.id! });
      browser.action.setBadgeBackgroundColor({ color: "#7a9e7e", tabId: tab.id! });
    } catch {
      browser.action.setBadgeText({ text: "✗", tabId: tab.id! });
      browser.action.setBadgeBackgroundColor({ color: "#e07050", tabId: tab.id! });
    }
    setTimeout(() => {
      browser.action.setBadgeText({ text: "", tabId: tab.id! });
    }, 1500);
  });

  // --- Tab Info Relay (for popup/sidepanel) ---
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "GET_CURRENT_TAB") {
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs) => {
          const tab = tabs[0];
          if (!tab?.url) {
            sendResponse({ success: false, error: "No active tab URL" });
            return;
          }
          sendResponse({
            success: true,
            data: {
              url: tab.url,
              title: tab.title || "",
              favicon: tab.favIconUrl || "",
              tabId: tab.id,
            },
          });
        })
        .catch((err) => {
          sendResponse({ success: false, error: err.message });
        });
      return true;
    }
  });
});

/** Call the MarkBox API to create a bookmark silently */
async function doSilentBookmark(url: string, title?: string) {
  const apiKey = await getApiKey();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const body: Record<string, string> = { url };
  if (title) body.title = title;

  const res = await fetch(`${BASE_URL}/api/bookmarks`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}
