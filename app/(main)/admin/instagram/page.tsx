import { Radio } from "lucide-react";

import { InstagramLiveFeed } from "./live-feed";

export const dynamic = "force-dynamic";

export default function AdminInstagramPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Radio className="h-7 w-7" />
        <div>
          <h1 className="text-2xl font-bold">Instagram canlı yorumlar</h1>
          <p className="text-sm text-muted-foreground">
            Yönetici girişi gerekir. Yeni yorumlar kendiliğinden eklenir.
          </p>
        </div>
      </div>
      <InstagramLiveFeed />
    </div>
  );
}
