import type { Metadata } from "next";

import { saveDigestPreference } from "@/actions/marketplace-notifications";
import { Subpage } from "@/components/marketplace/subpage";
import { Button } from "@/components/ui/button";
import { digestEnabledFor } from "@/lib/marketplace/notify";
import { requireMarketAccount } from "@/lib/marketplace/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bildirimler" };

export default async function NotificationSettingsPage() {
  const account = await requireMarketAccount("/ayarlar/bildirimler");
  const enabled = await digestEnabledFor(account.id);
  const email = account.email?.trim();

  return (
    <Subpage title="Bildirimler" backHref="/ayarlar">
      <div className="space-y-4">
        <section className="mk-card space-y-3 p-4 text-sm leading-relaxed">
          <p className="font-bold text-foreground">Hesabına gelen mailler</p>
          <p className="text-muted-foreground">
            {email ? (
              <>
                Mailler <b className="text-foreground">{email}</b> adresine gider.
              </>
            ) : (
              "Mailler hesabındaki e-posta adresine gider."
            )}
          </p>
          <ul className="list-disc space-y-2 pl-4 text-muted-foreground">
            <li>İlanına teklif gelince haber veririz.</li>
            <li>Verdiğin bir teklif kabul edilince haber veririz.</li>
          </ul>
          <p className="text-xs text-muted-foreground">Bu iki mail kapatılmaz.</p>
        </section>

        <form action={saveDigestPreference} className="mk-card space-y-4 p-4">
          <label className="flex items-start gap-3 text-sm leading-relaxed">
            <input type="hidden" name="enabled" value="0" />
            <input
              type="checkbox"
              name="enabled"
              value="1"
              defaultChecked={enabled}
              className="mt-1 h-4 w-4 shrink-0 rounded border-input text-suk-brand focus:ring-2 focus:ring-ring"
            />
            <span>
              <span className="font-bold text-foreground">Yeni ilanlar</span>
              <span className="mt-1 block text-muted-foreground">
                Hizmet veriyorsan, Hizmetlerim’de seçtiğin işlere uyan yeni ilan olursa 3 günde bir kısa bir e-posta
                gelir. İlanlar mailde yazılmaz; siteye girince görürsün. İlan yoksa mail gitmez.
              </span>
            </span>
          </label>
          <Button type="submit" variant="primary" className="w-full">
            Kaydet
          </Button>
        </form>
      </div>
    </Subpage>
  );
}
