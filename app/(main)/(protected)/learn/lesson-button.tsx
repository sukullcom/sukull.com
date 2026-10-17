"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";

import type { SubjectColorConfig } from "@/lib/subject-colors";

type Props = {
  id: number;
  index: number;
  totalCount: number;
  locked?: boolean;
  current?: boolean;
  percentage: number;
  subjectColor: SubjectColorConfig;
};

const GRAY = {
  canvas: "#e6ebf2",
  face: "#e6ebf2",
  faceBottom: "#d5dde8",
  sideTop: "#b7c2d3",
  side: "#aeb9cb",
  rim: "#aeb9cb",
  shadowDark: "#a9b6c8",
  shadowDarkOpacity: 0.55,
  insetDark: "#8ea0b5",
  insetDarkOpacity: 0.72,
};

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function mix(a: string, b: string, t: number) {
  const from = hexToRgb(a);
  const to = hexToRgb(b);
  return rgbToHex(from.r + (to.r - from.r) * t, from.g + (to.g - from.g) * t, from.b + (to.b - from.b) * t);
}

function buttonPalette(colored: boolean, hex: string, hexDark: string) {
  if (!colored) return GRAY;
  return {
    canvas: hex,
    face: hex,
    faceBottom: mix(hex, hexDark, 0.28),
    sideTop: mix(hex, hexDark, 0.55),
    side: hexDark,
    rim: hexDark,
    shadowDark: hexDark,
    shadowDarkOpacity: 0.5,
    insetDark: hexDark,
    insetDarkOpacity: 0.78,
  };
}

function unitVec(x: number, y: number): [number, number] {
  const len = Math.hypot(x, y) || 1;
  return [x / len, y / len];
}

function roundedPolygon(points: Array<[number, number]>, radius: number) {
  const commands: string[] = [];
  const count = points.length;
  for (let i = 0; i < count; i++) {
    const curr = points[i];
    const prev = points[(i + count - 1) % count];
    const next = points[(i + 1) % count];
    const prevLen = Math.hypot(prev[0] - curr[0], prev[1] - curr[1]);
    const nextLen = Math.hypot(next[0] - curr[0], next[1] - curr[1]);
    const r = Math.min(radius, prevLen / 2.4, nextLen / 2.4);
    const toPrev = unitVec(prev[0] - curr[0], prev[1] - curr[1]);
    const toNext = unitVec(next[0] - curr[0], next[1] - curr[1]);
    const start: [number, number] = [curr[0] + toPrev[0] * r, curr[1] + toPrev[1] * r];
    const end: [number, number] = [curr[0] + toNext[0] * r, curr[1] + toNext[1] * r];
    commands.push(
      `${i === 0 ? "M" : "L"} ${start[0].toFixed(2)} ${start[1].toFixed(2)} Q ${curr[0].toFixed(2)} ${curr[1].toFixed(2)} ${end[0].toFixed(2)} ${end[1].toFixed(2)}`,
    );
  }
  return `${commands.join(" ")} Z`;
}

function roundedRhombus(cx: number, cy: number, rx: number, ry: number, radius: number) {
  return roundedPolygon(
    [
      [cx, cy - ry],
      [cx + rx, cy],
      [cx, cy + ry],
      [cx - rx, cy],
    ],
    radius,
  );
}

export const LessonButton = ({
  id,
  index,
  totalCount,
  locked,
  current,
  percentage,
  subjectColor,
}: Props) => {
  const [pressed, setPressed] = useState(false);
  const rawId = useId().replace(/:/g, "");
  const cycleLength = 8;
  const cycleIndex = index % cycleLength;

  let indentationLevel;
  if (cycleIndex <= 2) indentationLevel = cycleIndex;
  else if (cycleIndex <= 4) indentationLevel = 4 - cycleIndex;
  else if (cycleIndex <= 6) indentationLevel = 4 - cycleIndex;
  else indentationLevel = cycleIndex - 8;

  const rightPosition = indentationLevel * 40;
  const isFirst = index === 0;
  const isLast = index === totalCount;
  const isCompleted = !current && !locked;
  const colored = Boolean(current || isCompleted);
  const palette = buttonPalette(colored, subjectColor.hex, subjectColor.hexDark);
  const href = locked ? "#" : `/lesson/${id}`;
  const lip = 12;

  const lessonIconSrc = (() => {
    if (isCompleted) return "/belt_icon.svg";
    if (isLast) return current ? "/gate_active.svg" : "/gate_inactive.svg";
    return current ? "/active_lesson_icon.svg" : "/inactive_lesson_icon.svg";
  })();

  const cx = 70;
  const cy = 62;
  const rx = 44;
  const ry = 38;
  const face = roundedRhombus(cx, cy, rx, ry, 12);
  const progress = roundedPolygon(
    [
      [cx, cy - ry - 10],
      [cx + rx + 10, cy],
      [cx + rx + 10, cy + lip],
      [cx, cy + ry + lip + 10],
      [cx - rx - 10, cy + lip],
      [cx - rx - 10, cy],
    ],
    11,
  );
  const safePercentage = Number.isNaN(percentage) ? 0 : Math.max(0, Math.min(100, percentage));

  return (
    <Link
      prefetch={false}
      href={href}
      aria-disabled={locked}
      style={{ pointerEvents: locked ? "none" : "auto" }}
      onPointerDown={() => {
        if (!locked) setPressed(true);
      }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
    >
      <div
        className="relative"
        style={{
          right: `${rightPosition}px`,
          marginTop: isFirst && !isCompleted ? 52 : 8,
        }}
      >
        {current ? (
          <div
            className="absolute -top-8 left-1/2 z-20 -translate-x-1/2 rounded-xl border-2 px-3 py-2 font-bold uppercase tracking-wide animate-bounce"
            style={{
              color: "#ffffff",
              background: `linear-gradient(180deg, ${subjectColor.hex} 0%, ${subjectColor.hexDark} 100%)`,
              borderColor: subjectColor.hexDark,
              boxShadow: `0 4px 0 ${mix(subjectColor.hexDark, "#000000", 0.35)}`,
            }}
          >
            Başla
            <div
              className="absolute left-1/2 -bottom-[7px] h-0 w-0 -translate-x-1/2 border-x-[7px] border-x-transparent border-t-[7px]"
              style={{ borderTopColor: subjectColor.hexDark }}
            />
          </div>
        ) : null}

        <div className="relative h-[104px] w-[100px]">
          <svg viewBox="8 16 124 120" className="absolute left-1/2 top-0 h-[120px] w-[124px] -translate-x-1/2 overflow-visible" aria-hidden>
            <defs>
              <filter id={`${rawId}-raised`} x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
                <feOffset in="blur" dx="7" dy="8" result="offDark" />
                <feFlood floodColor={palette.shadowDark} floodOpacity={palette.shadowDarkOpacity} result="darkColor" />
                <feComposite in="darkColor" in2="offDark" operator="in" result="dark" />
                <feMerge>
                  <feMergeNode in="dark" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id={`${rawId}-inset`} x="-40%" y="-40%" width="180%" height="180%">
                <feComponentTransfer in="SourceAlpha" result="inverted">
                  <feFuncA type="table" tableValues="1 0" />
                </feComponentTransfer>
                <feGaussianBlur in="inverted" stdDeviation="3.2" result="blurred" />
                <feOffset in="blurred" dx="4" dy="4" result="darkOffset" />
                <feFlood floodColor={palette.insetDark} floodOpacity={palette.insetDarkOpacity} result="darkColor" />
                <feComposite in="darkColor" in2="darkOffset" operator="in" result="darkShadow" />
                <feComposite in="darkShadow" in2="SourceAlpha" operator="in" result="darkInner" />
                <feMerge>
                  <feMergeNode in="SourceGraphic" />
                  <feMergeNode in="darkInner" />
                </feMerge>
              </filter>
              <linearGradient id={`${rawId}-face`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={palette.face} />
                <stop offset="1" stopColor={palette.faceBottom} />
              </linearGradient>
              <linearGradient id={`${rawId}-side`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={palette.sideTop} />
                <stop offset="1" stopColor={palette.side} />
              </linearGradient>
            </defs>

            {current ? (
              <>
                <path
                  d={progress}
                  fill="none"
                  stroke="#9aabc0"
                  strokeWidth="9"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={0.55}
                />
                <path
                  d={progress}
                  fill="none"
                  stroke="#d5dde8"
                  strokeWidth="6.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <path
                  d={progress}
                  fill="none"
                  stroke={subjectColor.hexDark}
                  strokeWidth="7"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={`${safePercentage} ${100 - safePercentage}`}
                  transform="translate(0 2)"
                />
                <path
                  d={progress}
                  fill="none"
                  stroke={subjectColor.hex}
                  strokeWidth="5.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={`${safePercentage} ${100 - safePercentage}`}
                />
              </>
            ) : null}

            <g filter={pressed ? undefined : `url(#${rawId}-raised)`}>
              <path d={face} fill={palette.rim} transform={`translate(0 ${lip + 2})`} />
              <path d={face} fill={`url(#${rawId}-side)`} transform={`translate(0 ${lip})`} />
              <g
                style={{
                  transform: pressed ? "translateY(12px)" : "translateY(0px)",
                  transition: "transform 90ms ease-out",
                }}
              >
                <path
                  d={face}
                  fill={pressed ? palette.canvas : `url(#${rawId}-face)`}
                  filter={pressed ? `url(#${rawId}-inset)` : undefined}
                />
              </g>
            </g>

          </svg>

          <div
            className="pointer-events-none absolute left-1/2"
            style={{
              top: 46,
              transform: pressed ? "translate(-50%, calc(-50% + 12px))" : "translate(-50%, -50%)",
              transition: "transform 90ms ease-out",
            }}
          >
            <Image
              src={lessonIconSrc}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10"
              style={{
                filter: colored ? undefined : "brightness(0)",
                opacity: locked ? 0.4 : colored ? 1 : 0.62,
              }}
              aria-hidden
            />
          </div>
        </div>
      </div>
    </Link>
  );
};
