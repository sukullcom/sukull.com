export const CONTACT_CHANNELS = ["phone", "email"] as const;

export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

export function parseContactChannel(value: unknown): ContactChannel | null {
  return value === "phone" || value === "email" ? value : null;
}
