import { Router, type IRouter } from "express";

const router: IRouter = Router();

// Set YOUTUBE_CHANNEL_ID in your Render environment variables to point at your channel.
// Default is the KC Class BHW channel. Get your channel ID from:
// YouTube Studio → Customisation → Basic info → Channel URL (the ID after /channel/)
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "UC77kf2jXTQvRl2vV3CI8oRA";
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

// Simple XML field extractor
function extractField(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, "i");
  const match = xml.match(re);
  return match ? match[1].trim() : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]+${attr}="([^"]*)"`, "i");
  const match = xml.match(re);
  return match ? match[1] : "";
}

interface ParsedVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  videoUrl: string;
  viewCount: number;
  likeCount: number;
}

function parseRssFeed(xml: string): ParsedVideo[] {
  const entries = xml.split("<entry>").slice(1);
  return entries.map((entry) => {
    const closingIdx = entry.indexOf("</entry>");
    const block = closingIdx !== -1 ? entry.slice(0, closingIdx) : entry;

    const videoId = extractField(block, "yt:videoId");
    const title = extractField(block, "media:title") || extractField(block, "title");
    const description = extractField(block, "media:description");
    const publishedAt = extractField(block, "published");
    const thumbnailUrl = extractAttr(block, "media:thumbnail", "url");
    const views = parseInt(extractAttr(block, "media:statistics", "views") || "0", 10);
    const likes = parseInt(extractAttr(block, "media:starRating", "count") || "0", 10);

    // Decode XML entities
    const decode = (s: string) =>
      s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

    return {
      id: videoId,
      title: decode(title),
      description: decode(description),
      publishedAt,
      thumbnailUrl,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      viewCount: isNaN(views) ? 0 : views,
      likeCount: isNaN(likes) ? 0 : likes,
    };
  }).filter((v) => v.id);
}

// Cache
let cachedVideos: ParsedVideo[] | null = null;
let cacheTs = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// GET /videos
router.get("/videos", async (req, res): Promise<void> => {
  try {
    const now = Date.now();
    if (!cachedVideos || now - cacheTs > CACHE_TTL_MS) {
      const response = await fetch(RSS_URL, {
        headers: { "User-Agent": "Mozilla/5.0 LearnHub/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) {
        res.status(502).json({ error: "Failed to fetch YouTube feed" });
        return;
      }
      const xml = await response.text();
      cachedVideos = parseRssFeed(xml);
      cacheTs = now;
    }
    res.json(cachedVideos);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch YouTube videos");
    res.status(502).json({ error: "Failed to fetch YouTube videos" });
  }
});

export default router;
