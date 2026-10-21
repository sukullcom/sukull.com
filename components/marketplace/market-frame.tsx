"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ClipboardList, Home, Settings, Tag } from "lucide-react";

import { setMarketMode } from "@/actions/marketplace-account";
import { Button } from "@/components/ui/button";
import { BRAND_MASCOT_DISPLAY_PATH } from "@/lib/brand-mascot";

const customerTabs = [
  { href: "/", label: "Hizmet al", icon: Home },
  { href: "/islerim", label: "İlanlarım", icon: ClipboardList },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
];

const providerTabs = [
  { href: "/hizmet-veren/ilanlar", label: "İlanlar", icon: Tag },
  { href: "/hizmet-veren/teklifler", label: "Tekliflerim", icon: ClipboardList },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
];

export function MarketFrame({
  mode,
  guest,
  children,
}: {
  mode: "customer" | "provider";
  guest: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const tabs = mode === "provider" ? providerTabs : customerTabs;
  const [pending, setPending] = useState(false);
  const wide = guest && pathname === "/";

  return (
    <div className="mk-theme mk-press min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b-2 border-border bg-background/95 backdrop-blur">
        <div className={`mx-auto flex h-16 items-center justify-between px-4 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
          <Link href="/" className="flex items-center gap-2.5" aria-label="Sukull ana sayfa">
            <Image src={BRAND_MASCOT_DISPLAY_PATH} alt="" width={40} height={40} priority className="h-9 w-9 object-contain sm:h-10 sm:w-10" />
            <span className="text-2xl font-extrabold tracking-wide text-primary sm:text-[1.75rem]">Sukull</span>
          </Link>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              await setMarketMode(mode === "provider" ? "customer" : "provider");
            }}
          >
            {mode === "provider" ? "Hizmet al" : "Hizmet ver"}
          </Button>
        </div>
      </header>
      <main className={`mx-auto w-full px-4 py-6 pb-32 md:pb-10 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
        <nav
          className={`mb-6 hidden gap-0.5 rounded-2xl border-2 border-border p-1 md:flex ${pathname === "/" ? "" : "mx-auto max-w-lg"}`}
          aria-label="Sayfalar"
        >
          {tabs.map((tab) => (
            <NavLink key={tab.href} tab={tab} active={isActive(pathname, tab.href)} />
          ))}
        </nav>
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-border bg-background/95 backdrop-blur md:hidden">
        <ul
          className="mx-auto grid max-w-3xl grid-cols-3 px-2 pt-1"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(pathname, tab.href);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={`mx-1 flex flex-col items-center gap-1 rounded-xl border-2 py-1.5 text-xs font-bold ${
                    active ? "border-suk-brand/30 bg-suk-brand-soft text-suk-brand" : "border-transparent text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function NavLink({ tab, active }: { tab: (typeof customerTabs)[number]; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm transition-all ${
        active ? "bg-muted font-bold text-foreground" : "font-medium text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {tab.label}
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
