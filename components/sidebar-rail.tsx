"use client";

import { useId } from "react";

/** Buton kutusu sidebar köke göre; `rounded-2xl` ≈ 16px */
export type SidebarRailButtonBox = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  rx: number;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Bézier kontrol sapması (~0.552) — 90° dış yaylar düzgün görünsün; `sweep-flag` karmaşası yok.
 * @see https://spencermortensen.com/articles/bezier-circle/
 */
const BEZIER_QUARTER_CIRCLE_COEFFICIENT = (4 / 3) * Math.tan(Math.PI / 8);

/** Seçili yokken: içerik sınırındaki düz dikey ray */
export function sidebarRailStraightPath(height: number, xRail: number) {
  const H = Math.max(0, height);
  const x = round2(Math.max(1, xRail));
  return `M ${x} 0 L ${x} ${H}`;
}

/**
 * Sekme-optiği: üst/altta **aynı `tabR`, `hingeX`, `kTab`** — alt yay, üsttekinin **buton eksenine paralel eksende**
 * aynası: `x`'te ortak ikinci kontrol (`topC2x`), `y`'ler `T ↔ B`; `hinge`'den yansıtılmış `x` yanlış cusp çıkarır.
 */
export type SidebarRailTabPaths = {
  stroke: string;
  fill: string;
};

export function sidebarRailWrapButtonPath(params: {
  height: number;
  width: number;
  xRail: number;
  btn: SidebarRailButtonBox;
}): string {
  return sidebarRailTabPaths(params).stroke;
}

/**
 * Stroke: açık U (sayfa kenarı kapalı değil).
 * Fill: aynı U, açık kenardan dışarı taşar — clip ile o kenardaki gölge kesilir,
 * böylece sekme sayfaya birleşir.
 */
export function sidebarRailTabPaths(params: {
  height: number;
  width: number;
  xRail: number;
  btn: SidebarRailButtonBox;
}): SidebarRailTabPaths {
  const H = Math.max(0, params.height);
  const W = Math.max(1, params.width);
  const xRail = round2(Math.min(Math.max(params.xRail, 1), W));
  let { left: L, top: T, right: R, bottom: B, rx: rr } = params.btn;

  L = round2(L);
  T = round2(T);
  R = round2(R);
  B = round2(B);
  rr = Math.min(
    16,
    Math.max(
      4,
      Math.min(rr, (R - L) / 2 - 2, (B - T) / 2 - 2)
    )
  );

  const straight = sidebarRailStraightPath(H, xRail);
  if (
    !Number.isFinite(H) ||
    xRail <= R ||
    R - L < 40 ||
    B - T < 28 ||
    R < 8 ||
    R > W + 1
  ) {
    return { stroke: straight, fill: "" };
  }

  /** Kenar ↔ buton yatayı — giriş eğrisi genişliği */
  const gapXR = xRail - R;

  /** Sekme‑optiği yüksekliği (dikey) */
  const scoop = Math.round(
    Math.min(26, Math.max(9, Math.min(gapXR * 0.92, (B - T) * 0.28)))
  );

  const Tp = round2(T + rr);
  const Bm = round2(B - rr);
  const Ri = round2(R - rr);
  const Lj = round2(L + rr);

  /**
   * Hedef yay yarıçapı (biraz büyük “oval”). `hinge = xRail − tabR` hep buton dışından sola doğru kalır.
   */
  const tabRdesired = round2(Math.max(gapXR + rr * 0.25 + 8, scoop * 0.95 + 12));

  /** Sağ-alt yuvarlağın dışına sıçramayı önlemek için maks hinge sınırı */
  const innerMaxGap = Math.max(tabRdesired, gapXR + rr * 0.05 + 14);
  const tabSpan = Math.min(34, innerMaxGap);
  let hingeX = round2(
    Math.min(
      round2(R - rr * 0.32),
      Math.max(Ri + 14, round2(xRail - tabSpan))
    )
  );
  let tabR = round2(Math.max(14, Math.min(34, xRail - hingeX)));

  hingeX = round2(Math.min(hingeX, R - rr * 0.18));
  tabR = round2(Math.max(14, Math.min(34, xRail - hingeX)));

  const yVertTop = Math.max(0, round2(T - tabR));
  /** Alt dikey çıkış: üst ile aynı yarıçapa karşılık gelen plato kotu */
  const yRailBot = Math.min(H, round2(B + tabR));

  /* Çeyrek-daire Bézier katsayısı; rail/dingil aralığına sıkıştırılarak “gaga” oluşmaz */
  const kIdeal = BEZIER_QUARTER_CIRCLE_COEFFICIENT * tabR;
  const kTab = Math.max(5, Math.min(kIdeal, Math.max(6, xRail - hingeX - 1)));

  const topC2x = Math.min(round2(hingeX + kTab), round2(xRail - 0.9));

  /** Sol/üst–alt pill köşe Bézier’leri (sekme optiğinden bağımsız) */
  const k = rr * BEZIER_QUARTER_CIRCLE_COEFFICIENT;

  const scoopPath = [
    `C ${xRail},${round2(T - tabR + kTab)} ${topC2x},${T} ${hingeX},${T}`,
    `L ${Ri},${T}`,
    `L ${Lj},${T}`,
    `C ${Lj - k},${T} ${L},${Tp - k} ${L},${Tp}`,
    `L ${L},${Bm}`,
    `C ${L},${Bm + k} ${Lj - k},${B} ${Lj},${B}`,
    `L ${Ri},${B}`,
    `L ${hingeX},${B}`,
    `C ${topC2x},${B} ${xRail},${round2(B + tabR - kTab)} ${xRail},${yRailBot}`,
  ].join(" ");

  const stroke = [
    `M ${xRail},0`,
    `L ${xRail},${yVertTop}`,
    scoopPath,
    `L ${xRail},${H}`,
  ].join(" ");

  const openX = round2(W + 96);
  const fill = [
    `M ${xRail},${yVertTop}`,
    scoopPath,
    `L ${openX},${yRailBot}`,
    `L ${openX},${yVertTop}`,
    "Z",
  ].join(" ");

  return { stroke, fill };
}

type SidebarRailSvgProps = {
  widthPx: number;
  heightPx: number;
  /** Sidebar sağ kenarına yakın dikey eksen — genelde genişlik - 3 */
  xRailPx: number;
  activeButton: SidebarRailButtonBox | null;
  className?: string;
};

/** Tam genişlik SVG; seçili satır Chrome-sekması-optiği (dikey sıyrılış + convex U). */
export function SidebarRailSvg({
  widthPx,
  heightPx,
  xRailPx,
  activeButton,
  className,
}: SidebarRailSvgProps) {
  const rawId = useId().replace(/:/g, "");
  const w = Math.max(1, widthPx);
  const h = Math.max(1, heightPx);
  const xRail = round2(Math.min(Math.max(xRailPx, 1), w));
  const tab =
    activeButton !== null
      ? sidebarRailTabPaths({
          height: h,
          width: w,
          xRail,
          btn: activeButton,
        })
      : null;
  const d = tab?.stroke ?? sidebarRailStraightPath(h, xRail);

  return (
    <svg
      aria-hidden
      className={className}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      overflow="visible"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={`${rawId}-edge`} x="-10%" y="-15%" width="160%" height="130%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="blur" />
          <feOffset in="blur" dx="2" dy="0" result="off" />
          <feFlood floodColor="#94a3b8" floodOpacity="0.28" result="color" />
          <feComposite in="color" in2="off" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {tab?.fill ? (
        <path
          d={tab.fill}
          fill="hsl(var(--background))"
        />
      ) : null}
      <path
        d={d}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth={2}
        strokeLinecap="butt"
        strokeLinejoin="round"
        filter={`url(#${rawId}-edge)`}
      />
    </svg>
  );
}
