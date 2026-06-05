import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "MarkBox — AI 书签管家",
    description: "一键收藏网页，AI 自动分类与标签",
    version: "0.1.0",
    permissions: ["activeTab", "storage", "scripting", "sidePanel", "contextMenus"],
    host_permissions: [
      "http://localhost:3000/*",
      "https://markbox.app/*",
    ],
    side_panel: {
      default_path: "entrypoints/sidepanel/index.html",
    },
    icons: {
      16: "icons/icon.svg",
      32: "icons/icon.svg",
      48: "icons/icon.svg",
      128: "icons/icon.svg",
    },
    action: {
      default_title: "收藏到 MarkBox",
      default_popup: "entrypoints/popup/index.html",
      default_icon: {
        16: "icons/icon.svg",
        32: "icons/icon.svg",
      },
    },
    commands: {
      _execute_action: {
        suggested_key: { default: "Ctrl+Shift+D" },
      },
      silent_bookmark: {
        suggested_key: { default: "Ctrl+Shift+S" },
        description: "静默收藏当前页面",
      },
    },
  },
  vite: () => ({
    resolve: {
      alias: {
        "@": new URL(".", import.meta.url).pathname,
      },
    },
  }),
});
