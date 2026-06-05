const STORAGE_KEYS = {
  API_KEY: "markbox_api_key",
  API_URL: "markbox_api_url",
} as const;

export async function getApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEY);
  return result[STORAGE_KEYS.API_KEY] || null;
}

export async function setApiKey(key: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.API_KEY]: key });
}

export async function clearApiKey(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.API_KEY);
}

export async function getApiUrl(): Promise<string> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.API_URL);
  return result[STORAGE_KEYS.API_URL] || "http://localhost:3000";
}

export async function setApiUrl(url: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.API_URL]: url });
}
