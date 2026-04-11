import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { MoreDrawer } from "./MoreDrawer";
import { JoystickHub } from "./JoystickHub";

function NavIcon({ type, active }: { type: "explore" | "map" | "bell" | "profile"; active: boolean }) {
  const w = active ? 2.5 : 1.75;
  const paths: Record<string, React.ReactNode> = {
    explore: (
      <g>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={w} fill="none" />
        <polygon points="14.5,9.5 9.5,11 11.5,14.5 14.5,9.5" fill="currentColor" opacity={active ? 1 : 0.7} />
        <line x1="12" y1="3" x2="12" y2="5" stroke="currentColor" strokeWidth={w} strokeLinecap="round" />
        <line x1="12" y1="19" x2="12" y2="21" stroke="currentColor" strokeWidth={w} strokeLinecap="round" />
        <line x1="3" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth={w} strokeLinecap="round" />
        <line x1="19" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth={w} strokeLinecap="round" />
      </g>
    ),
    map: (
      <g>
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" stroke="currentColor" strokeWidth={w} fill="none" />
        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth={w} fill={active ? "currentColor" : "none"} opacity={active ? 0.3 : 1} />
      </g>
    ),
    bell: (
      <g>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" stroke="currentColor" strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
    profile: (
      <g>
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={w} fill="none" />
        <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth={w} fill="none" strokeLinecap="round" />
      </g>
    ),
  };
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none">{paths[type]}</svg>;
}

export function BottomNav() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs = [
    { path: "/explore", label: "Explorar", icon: "explore" as const },
    { path: "/map", label: "Mapa", icon: "map" as const },
    { path: "__center__", label: "", icon: "explore" as const },
    { path: "/notifications", label: "Avisos", icon: "bell" as const, dot: true },
    { path: "/profile", label: "Perfil", icon: "profile" as const },
  ];

  return (
    <>
      <MoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} />

      <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe">
        <div className="relative mx-auto max-w-md">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl border-t border-white/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/70" />

          <div className="relative flex items-center justify-around h-16 px-1">
            {tabs.map((tab) => {
              if (tab.path === "__center__") {
                return (
                  <JoystickHub
                    key="center"
                    onTap={() => setMoreOpen(!moreOpen)}
                    isOpen={moreOpen}
                  />
                );
              }

              const isActive = location === tab.path || (tab.path === "/explore" && location === "/");

              return (
                <Link
                  key={tab.path}
                  href={tab.path}
                  className={cn(
                    "flex flex-col items-center justify-center w-16 h-full gap-0.5 transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground/70"
                  )}
                >
                  <div className="relative">
                    <NavIcon type={tab.icon} active={isActive} />
                    {tab.dot && (
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/50" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] tracking-tight transition-all",
                    isActive ? "font-bold" : "font-medium"
                  )}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-2 w-4 h-0.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
