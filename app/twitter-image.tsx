// Re-use the Open Graph image for Twitter (the card spec allows 1200×630).
// Exporting from a twitter-image file makes Next.js emit the proper
// `twitter:image` meta tag automatically.
export {
  default,
  runtime,
  alt,
  size,
  contentType,
} from "./opengraph-image";
