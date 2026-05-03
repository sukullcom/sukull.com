import type { SupabaseClient } from "@supabase/supabase-js";
import { clientLogger } from "@/lib/client-logger";

export type PeerProfileRow = {
  id: string;
  name: string | null;
  avatar: string | null;
  description: string | null;
};

/**
 * Güvenli kullanıcı özeti (id, name, avatar, description). RLS sonrası
 * `users` tablosuna doğrudan SELECT yerine `fetch_peer_profiles_for_study_buddy` RPC.
 */
export async function fetchPeerProfilesForStudyBuddy(
  supabase: SupabaseClient,
  requestedIds: string[],
): Promise<Map<string, PeerProfileRow>> {
  const map = new Map<string, PeerProfileRow>();
  const unique = Array.from(new Set(requestedIds.filter(Boolean)));
  if (unique.length === 0) return map;

  const { data, error } = await supabase.rpc("fetch_peer_profiles_for_study_buddy", {
    requested_ids: unique,
  });

  if (error) {
    clientLogger.error({
      message: "fetch_peer_profiles_for_study_buddy RPC failed",
      error,
      location: "utils/supabase/fetch-peer-profiles",
    });
    return map;
  }

  for (const row of (data ?? []) as PeerProfileRow[]) {
    if (row?.id) map.set(row.id, row);
  }
  return map;
}
