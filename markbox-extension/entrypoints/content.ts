import { extractMetadataFromDocument } from "@/lib/metadata";

/**
 * Content script — injected into the active tab to extract page metadata.
 * Runs in the page's DOM context, has direct access to the document.
 */
export default defineContentScript({
  matches: ["<all_urls>"],
  async main() {
    // Listen for metadata extraction requests from popup/background
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === "EXTRACT_METADATA") {
        try {
          const metadata = extractMetadataFromDocument(document);
          sendResponse({ success: true, data: metadata });
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Failed to extract metadata";
          sendResponse({ success: false, error: msg });
        }
        return true; // Keep message channel open for async response
      }

      if (message?.type === "PING") {
        sendResponse({ success: true });
        return true;
      }
    });
  },
});
