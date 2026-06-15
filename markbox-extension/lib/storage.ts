const STORAGE_KEYS = {
  API_KEY: "markbox_api_key",
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
