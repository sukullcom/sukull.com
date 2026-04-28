// Re-use the Open Graph image for Twitter (the card spec allows 1200×630).
// `runtime` must be a string literal in this file — Next.js does not follow
// re-exports for static route segment config (see build warning).
export const runtime = "edge";

export {
  default,
  alt,
  size,
  contentType,
} from "./opengraph-image";
