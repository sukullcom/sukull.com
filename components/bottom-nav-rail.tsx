"use client";

import { useId } from "react";

import {
  sidebarRailTabPaths,
  sidebarRailWrapButtonPath,
} from "./sidebar-rail";

/** Buton kutusu alt menü köke göre; `rounded-xl` ≈ 12px */
export type BottomNavRailButtonBox = {
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
 * Sidebar path (x,y) → alt menü (y, H−x).
 * Ray sağda (xRail) iken üstte (yRail) olacak şekilde 90° döndür + yansıt.
 */
function sidebarPathToBottomNavPath(d: string, navHeightPx: number): string {
  const H = navHeightPx;
  const tokens: (string | number)[] = [];
  const re = /([MmLlCcZz])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    if (m[1]) tokens.push(m[1]);
    else tokens.push(parseFloat(m[2]));
  }

  let out = "";
  let i = 0;

  const mapPoint = (x: number, y: number) =>
    `${round2(y)} ${round2(H - x)}`;

  while (i < tokens.length) {
    const t = tokens[i];
    if (typeof t !== "string") {
      i++;
      continue;
    }

    const cmd = t;
    i++;

    if (cmd === "Z" || cmd === "z") {
      out += cmd;
      continue;
    }

    const upper = cmd.toUpperCase();
    const relative = cmd === cmd.toLowerCase();

    const nums: number[] = [];
    while (i < tokens.length && typeof tokens[i] === "number") {
      nums.push(tokens[i] as number);
      i++;
    }

    if (upper === "M" || upper === "L") {
      for (let j = 0; j < nums.length; j += 2) {
        const subCmd =
          j === 0
            ? cmd
            : upper === "M"
              ? relative
                ? "l"
                : "L"
              : cmd;
        out += `${subCmd} ${mapPoint(nums[j], nums[j + 1])} `;
      }
    } else if (upper === "C") {
      for (let j = 0; j < nums.length; j += 6) {
        const subCmd = j === 0 ? cmd : "C";
        out += `${subCmd} ${mapPoint(nums[j], nums[j + 1])} ${mapPoint(nums[j + 2], nums[j + 3])} ${mapPoint(nums[j + 4], nums[j + 5])} `;
      }
    }
  }

  return out.trim();
}

/** Seçili yokken: üst sınır boyunca düz yatay ray */
export function bottomNavRailStraightPath(width: number, yRail: number) {
  const W = Math.max(0, width);
  const y = round2(Math.max(1, yRail));
  return `M 0 ${y} L ${W} ${y}`;
}

/**
 * Sidebar ile birebir aynı sekme-optiği (oval scoop + pill köşeler);
 * koordinat dönüşümüyle üstte yatay ray + aktif öğe sarması.
 */
export function bottomNavRailWrapButtonPath(params: {
  width: number;
  height: number;
  yRail: number;
  btn: BottomNavRailButtonBox;
}): string {
  const W = Math.max(0, params.width);
  const H = Math.max(1, params.height);
  const yRail = round2(Math.min(Math.max(params.yRail, 1), H));
  const { left: L, top: T, right: R, bottom: B, rx: rr } = params.btn;

  /** Transpose + sağ-ray yansıması: sidebar `xRail > R` koşulu sağlanır */
  const xRailSidebar = round2(H - yRail);

  const sidebarPath = sidebarRailWrapButtonPath({
    height: W,
    width: H,
    xRail: xRailSidebar,
    btn: {
      left: T,
      top: L,
      right: B,
      bottom: R,
      rx: rr,
    },
  });

  return sidebarPathToBottomNavPath(sidebarPath, H);
}

type BottomNavRailSvgProps = {
  widthPx: number;
  heightPx: number;
  /** Alt menü üst sınırına yakın yatay eksen — genelde 2 px */
  yRailPx: number;
  activeButton: BottomNavRailButtonBox | null;
  className?: string;
};

/** Tam genişlik SVG; seçili sekme Chrome-sekması-optiği (yatay ayrılış + convex U). */
export function BottomNavRailSvg({
  widthPx,
  heightPx,
  yRailPx,
  activeButton,
  className,
}: BottomNavRailSvgProps) {
  const rawId = useId().replace(/:/g, "");
  const w = Math.max(1, widthPx);
  const h = Math.max(1, heightPx);
  const yRail = round2(Math.min(Math.max(yRailPx, 1), h));
  const xRailSidebar = round2(h - yRail);
  const tab =
    activeButton !== null
      ? sidebarRailTabPaths({
          height: w,
          width: h,
          xRail: xRailSidebar,
          btn: {
            left: activeButton.top,
            top: activeButton.left,
            right: activeButton.bottom,
            bottom: activeButton.right,
            rx: activeButton.rx,
          },
        })
      : null;
  const d = tab
    ? sidebarPathToBottomNavPath(tab.stroke, h)
    : bottomNavRailStraightPath(w, yRail);
  const fill = tab?.fill
    ? sidebarPathToBottomNavPath(tab.fill, h)
    : "";

  return (
    <svg
      aria-hidden
      className={className}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      overflow="hidden"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={`${rawId}-inset`} x="-40%" y="-40%" width="180%" height="180%">
          <feComponentTransfer in="SourceAlpha" result="inverted">
            <feFuncA type="table" tableValues="1 0" />
          </feComponentTransfer>
          <feGaussianBlur in="inverted" stdDeviation="3.4" result="blurred" />
          <feOffset in="blurred" dx="3" dy="4" result="darkOffset" />
          <feFlood floodColor="#8ea0b5" floodOpacity="0.55" result="darkColor" />
          <feComposite in="darkColor" in2="darkOffset" operator="in" result="darkShadow" />
          <feComposite in="darkShadow" in2="SourceAlpha" operator="in" result="darkInner" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="darkInner" />
          </feMerge>
        </filter>
      </defs>
      {fill ? (
        <path
          d={fill}
          fill="hsl(var(--background))"
          filter={`url(#${rawId}-inset)`}
        />
      ) : null}
      <path
        d={d}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth={2}
        strokeLinecap="butt"
        strokeLinejoin="round"
      />
    </svg>
  );
}
