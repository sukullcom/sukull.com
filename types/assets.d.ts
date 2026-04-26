/**
 * Ambient declarations for static-asset imports.
 *
 * Next.js ships equivalents via `next/image-types/global`, but under
 * `moduleResolution: "bundler"` the `@/*` path alias resolves the
 * literal file path (`./public/foo.svg`) *before* tsc consults the
 * ambient module pattern — which means on a clean build
 * (e.g. Vercel, fresh clone) `tsc --noEmit` reports TS2307 for any
 * `import foo from "@/public/foo.svg"`.
 *
 * Declaring the patterns explicitly in this project-owned file makes
 * the typing deterministic across local, CI, and Vercel, and matches
 * the shape `next/image` expects (`StaticImageData`).
 */

declare module "*.svg" {
  import type { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.png" {
  import type { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.jpg" {
  import type { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.jpeg" {
  import type { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.gif" {
  import type { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.webp" {
  import type { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.avif" {
  import type { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}
