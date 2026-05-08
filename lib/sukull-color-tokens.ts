/**
 * Sukull renk semantiği — değerler `app/globals.css` içindeki `:root` ile
 * `tailwind.config.ts` içindeki `theme.extend.colors.suk` üzerinden bağlanır.
 * shadcn token’ları (`--background`, `--primary`, …) aynı dosyada `--suk-*`
 * ile eşlenir; `bg-background`, `text-primary` vb. paletle birlikte güncellenir.
 *
 * Bu dosya yalnızca isimleri ve amacı dokümante eder; import zorunlu değildir.
 *
 * Yüzey / tipografi için önce shadcn semantiği (`bg-background`, `text-muted-foreground`,
 * `border-border`, `text-destructive`) tercih edilir; marka / ödeme / uyarı gibi anlam
 * renkleri `suk-*` ile seçilir. Ham `slate-*` / `green-*` yeni kodda kaçınılmalıdır.
 *
 * Özel ders akışı: keşif / eğitmen / birincil CTA ve “yayında” rozetleri `suk-brand`;
 * hizmet paketi ve kullanım hakkı, mesaj kilidi, ödeme bağlamındaki kutular `suk-payment`; ilan incelemesi ve
 * dikkat çağrıları `suk-warning`; ret / kritik uyarı `suk-danger` veya `destructive`.
 *
 * `components/ui/button`: yıkıcı eylem `danger` veya aynı renkte `destructive` / `destructiveOutline`;
 * nötr iptal / ikincil `default`, daha belirgin gri dolgu `muted`, çerçeveli nötr `outline`.
 * shadcn `Badge` `destructive` → `--destructive` (= `--suk-danger`).
 */
export const sukullColorSemantics = {
  surface: ["page", "muted", "card"],
  border: ["DEFAULT", "strong"],
  fg: ["primary", "secondary", "muted"],
  brand: ["DEFAULT", "fg", "hover", "border", "soft", "soft.fg"],
  payment: ["DEFAULT", "fg", "hover", "border", "soft", "soft.fg", "ring"],
  play: ["DEFAULT", "fg", "hover", "border", "soft", "soft.fg", "line"],
  danger: ["DEFAULT", "fg", "hover", "border", "soft", "line"],
  warning: ["DEFAULT", "soft", "soft-fg", "border"],
  neutral: ["locked", "locked-border", "locked-fg"],
  info: ["DEFAULT", "soft"],
} as const;
