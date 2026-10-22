import type { ReactElement } from "react";

export function marketplaceOgMarkup(title: string, subtitle: string): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1f4d8e 0%, #163a6b 50%, #0f2748 100%)",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        padding: "72px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 28, opacity: 0.9 }}>
        Sukull
      </div>
      <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.15, marginBottom: 24, maxWidth: 1000 }}>
        {title}
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, opacity: 0.92, lineHeight: 1.4, maxWidth: 920 }}>
        {subtitle}
      </div>
    </div>
  );
}
