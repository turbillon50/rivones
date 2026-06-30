"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Inicio", icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg> },
  { href: "/medico", label: "Médico", icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
  { href: "/academico", label: "Académico", icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M2 9l10-5 10 5-10 5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" stroke="currentColor" strokeWidth="2"/></svg> },
  { href: "/documentos", label: "Documentos", icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M6 2h9l5 5v15H6V2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M15 2v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg> },
  { href: "/emergencia", label: "Emergencia", icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M12 2L2 7v6c0 5.5 4 9.7 10 11 6-1.3 10-5.5 10-11V7l-10-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav data-vulcano-bottomnav="true" className="glass fixed bottom-0 left-0 right-0 z-20 flex justify-around items-center h-16"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {tabs.map(t => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className="flex flex-col items-center gap-0.5 text-[11px]"
            style={{ color: active ? "var(--accent)" : "#8a8a93" }}>
            {t.icon}
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
