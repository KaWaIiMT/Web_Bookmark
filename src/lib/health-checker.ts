export type LinkStatus = "healthy" | "redirect" | "broken" | "unknown";

export interface HealthResult {
  status: LinkStatus;
  code: number | null;
  error?: string;
  redirectUrl?: string;
  suspicious?: boolean; // cross-domain redirect
  titleChanged?: boolean;
}

/**
 * Check link health for a single URL.
 * - HEAD request for quick status
 * - Detects cross-domain redirects (suspicious)
 * - Every 10th check also does GET to detect content changes
 */
export async function checkLinkHealth(
  url: string,
  originalTitle?: string,
  deepCheck?: boolean,
): Promise<HealthResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "manual", // Don't auto-follow redirects
      signal: controller.signal,
      headers: {
        "User-Agent": "MarkBox-HealthChecker/1.0",
      },
    });

    clearTimeout(timeout);

    // Healthy
    if (res.status === 200) {
      // Every ~10th check does a deep content check
      if (deepCheck && originalTitle) {
        return deepContentCheck(url, originalTitle);
      }
      return { status: "healthy", code: 200 };
    }

    // Redirect
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get("location") || "";
      let suspicious = false;
      let redirectUrl = location;

      try {
        const newHost = new URL(location, url).hostname;
        const oldHost = new URL(url).hostname;
        suspicious = newHost !== oldHost;
      } catch {
        redirectUrl = location;
      }

      return {
        status: "redirect",
        code: res.status,
        redirectUrl,
        suspicious,
      };
    }

    // Client/server error
    if (res.status >= 400) {
      return { status: "broken", code: res.status };
    }

    // Other status
    return { status: "unknown", code: res.status };
  } catch (err) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : "Unknown error";
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return {
      status: "broken",
      code: null,
      error: isTimeout ? "ETIMEDOUT" : message.slice(0, 200),
    };
  }
}

/**
 * Deep content check — GET the page and compare title.
 */
async function deepContentCheck(
  url: string,
  originalTitle: string,
): Promise<HealthResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "MarkBox-HealthChecker/1.0",
        Accept: "text/html",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { status: "broken", code: res.status };
    }

    const html = await res.text();
    // Simple title extraction
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const currentTitle = titleMatch?.[1]?.trim() || "";

    const titleChanged = currentTitle.length > 0 &&
      originalTitle.length > 0 &&
      !titlesSimilar(currentTitle, originalTitle);

    return {
      status: titleChanged ? "redirect" : "healthy",
      code: 200,
      titleChanged,
    };
  } catch {
    clearTimeout(timeout);
    return { status: "healthy", code: 200 }; // HEAD passed, GET failed → still healthy
  }
}

/**
 * Compare two titles with fuzzy matching.
 */
function titlesSimilar(a: string, b: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[\s\-_|·•]+/g, " ").replace(/[^\w\s一-鿿]/g, "").trim();
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  // One contains the other
  if (na.includes(nb) || nb.includes(na)) return true;
  // Levenshtein ratio
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return true;
  const dist = levenshtein(na, nb);
  return dist / maxLen < 0.3; // 70% similar
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Two-confirm filter: only mark as broken if confirmed twice.
 * Handled at the scheduler level (Phase 2).
 */
export function needsConfirm(current: LinkStatus, previous: LinkStatus | null): boolean {
  if (current !== "broken") return false;
  // First time broken — needs confirmation
  if (!previous || previous !== "broken") return true;
  // Already confirmed once — no further confirmation needed
  return false;
}

/**
 * Determine status from health result + confirmation status.
 */
export function resolveStatus(
  result: HealthResult,
  confirmed: boolean,
): LinkStatus {
  if (result.status === "broken" && !confirmed) {
    return "unknown"; // Pending confirmation
  }
  return result.status;
}
