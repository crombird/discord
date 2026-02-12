import {
  BACKROOMS_EMBED_COLOR,
  DEFAULT_EMBED_COLOR,
  PATREON_MESSAGE_CHANCE,
  WANDERERS_LIBRARY_EMBED_COLOR,
} from "../constants";
import SITES from "../__generated__/sites";

/**
 * Create a proxy URL for the image.
 * @see https://images.weserv.nl
 */
export function createImageCdnUrl(url: string, transformations?: string): string {
  return `https://wsrv.nl?url=${encodeURIComponent(url)}${transformations ? `&${transformations}` : ""}`;
}

/** Returns the matching embed color based on the site. */
export function embedColor(siteUrl: string | null): number {
  const site = SITES.find((s) => s.url === siteUrl);
  if (site?.type === "WANDERERS_LIBRARY") return WANDERERS_LIBRARY_EMBED_COLOR;
  if (site?.type === "BACKROOMS") return BACKROOMS_EMBED_COLOR;
  return DEFAULT_EMBED_COLOR;
}

/** Convert an "http://" URL to "https://". */
export function httpsify(url: string): string {
  return url.replace(/^http:/, "https:");
}

/** Take a user-provided URL and turn it into an API-friendly URL. */
export function normalizeUrl(url: string): string {
  return url
    .replace(/^https?:\/\/(?:www\.)scpwiki\.com/, "http://scp-wiki.wikidot.com")
    .replace(/^https?:\/\/(?:www\.)scp-wiki\.net/, "http://scp-wiki.wikidot.com")
    .replace(/^https:/, "http:");
}

/** Randomly determines whether to include a Patreon banner in the footer. */
export function shouldShowPatreonMessage(): boolean {
  return Math.random() < PATREON_MESSAGE_CHANCE;
}

/** Truncates a string if needed with an ellipsis. */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/** Escapes underscores and asterisks in regular display text. */
export function escapeMarkdown(text: string): string {
  return text.replace(/_(?=\W|$)/g, "\\_").replace(/\*/g, "\\*");
}

/** Format a rating number to include a "+" prefix if positive. */
export function formatRating(rating: number): string {
  return `${rating >= 0 ? "+" : ""}${rating}`;
}

/** Take a nullable page title and a nullable alternate title, and join them together. */
export function formatFullTitle(
  wikidotTitle: string | null | undefined,
  alternateTitle: string | null | undefined,
): string {
  if (
    wikidotTitle &&
    alternateTitle &&
    wikidotTitle !== alternateTitle &&
    // To account for Backrooms's inconsistent alternate title placement.
    wikidotTitle !== `"${alternateTitle}"` &&
    alternateTitle !== `"${wikidotTitle}"` &&
    !wikidotTitle.endsWith(`- ${alternateTitle}`)
  ) {
    return `${wikidotTitle} ⁠— ${alternateTitle}`;
  }
  return wikidotTitle ?? "";
}
