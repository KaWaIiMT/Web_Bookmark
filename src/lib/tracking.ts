/**
 * Bookmark hotness tracking — GitHub metrics, snapshots, trend prediction.
 */
import { prisma } from "@/lib/prisma";

export interface GitHubMetrics {
  stars: number;
  forks: number;
  openIssues: number;
  lastPushAt: string;
  language: string;
  archived: boolean;
}

/**
 * Parse GitHub URL to owner/repo.
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/#?]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

/**
 * Fetch GitHub repository metrics via REST API.
 */
export async function fetchGitHubMetrics(url: string): Promise<GitHubMetrics | null> {
  const parsed = parseGitHubUrl(url);
  if (!parsed) return null;

  const token = process.env.GITHUB_ACCESS_TOKEN;
  const headers: Record<string, string> = {
    "User-Agent": "MarkBox/1.0",
    Accept: "application/vnd.github.v3+json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      { headers, signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) {
      if (res.status === 404) return null;
      if (res.status === 403) {
        console.warn("[tracking] GitHub API rate limited");
        return null;
      }
      return null;
    }

    const data = await res.json();
    return {
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
      openIssues: data.open_issues_count ?? 0,
      lastPushAt: data.pushed_at ?? "",
      language: data.language ?? "Unknown",
      archived: data.archived ?? false,
    };
  } catch {
    return null;
  }
}

/**
 * Check if metrics changed significantly from last snapshot.
 */
export function metricsChanged(
  current: GitHubMetrics,
  last: { stars?: number | null; forks?: number | null; openIssues?: number | null }
): boolean {
  return (
    current.stars !== (last.stars ?? 0) ||
    current.forks !== (last.forks ?? 0) ||
    current.openIssues !== (last.openIssues ?? 0)
  );
}

/**
 * Take a snapshot for a tracked bookmark.
 */
export async function takeSnapshot(bookmarkId: string) {
  const tracker = await prisma.hotnessTracker.findUnique({ where: { bookmarkId } });
  if (!tracker || !tracker.enabled) return null;

  const bookmark = await prisma.bookmark.findUnique({ where: { id: bookmarkId } });
  if (!bookmark) return null;

  const parsed = parseGitHubUrl(bookmark.url);
  if (!parsed) return null;

  const metrics = await fetchGitHubMetrics(bookmark.url);
  if (!metrics) return null;

  // Get last snapshot for comparison
  const lastSnapshot = await prisma.hotnessSnapshot.findFirst({
    where: { trackerId: tracker.id },
    orderBy: { timestamp: "desc" },
  });

  // Only save if metrics changed
  if (lastSnapshot && !metricsChanged(metrics, lastSnapshot)) return null;

  const snapshot = await prisma.hotnessSnapshot.create({
    data: {
      trackerId: tracker.id,
      stars: metrics.stars,
      forks: metrics.forks,
      openIssues: metrics.openIssues,
      snapshot: JSON.stringify(metrics),
    },
  });

  // Update last checked time
  await prisma.hotnessTracker.update({
    where: { id: tracker.id },
    data: { lastCheckedAt: new Date() },
  });

  return snapshot;
}

/**
 * Simple milestone detection based on star count.
 */
export function detectMilestone(
  stars: number,
  prevStars: number
): { title: string; level: number } | null {
  const milestones = [
    { threshold: 100, title: "初露锋芒 🌱", level: 1 },
    { threshold: 500, title: "稳步增长 📈", level: 2 },
    { threshold: 1000, title: "广受关注 🔥", level: 3 },
    { threshold: 5000, title: "社区认可 ⭐", level: 4 },
    { threshold: 10000, title: "明星项目 🏆", level: 5 },
    { threshold: 50000, title: "业界标杆 👑", level: 6 },
  ];

  for (const m of milestones) {
    if (prevStars < m.threshold && stars >= m.threshold) {
      return { title: `${m.title} (${m.threshold.toLocaleString()} star)`, level: m.level };
    }
  }
  return null;
}
