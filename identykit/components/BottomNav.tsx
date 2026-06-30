"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Inicio", icon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M3 12L12 3l9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  )},
  { href: "/medico", label: "Médico", icon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2"/></svg>
  )},
  { href: "/documentos", label: "Docs", icon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  )},
  { href: "/emergencia", label: "QR", icon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><path d="M14 14h2v2h-2zM18 14h3M14 18h1M17 17h4v4h-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  )},
  { href: "/perfil", label: "Perfil", icon: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  )},
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav data-vulcano-bottomnav="true" style={{
      position:"fixed", bottom:0, left:0, right:0,
      background:"#ffffff", borderTop:"1px solid #e5e7eb",
      display:"flex", justifyContent:"space-around", alignItems:"center",
      height:"64px", zIndex:50,
      boxShadow:"0 -2px 12px rgba(0,0,0,0.06)"
    }}>
      {tabs.map(tab => {
        const active = path === tab.href;
        return (
          <Link key={tab.href} href={tab.href} style={{
            display:"flex", flexDirection:"column", alignItems:"center", gap:"2px",
            color: active ? "#0D47A1" : "#9ca3af",
            textDecoration:"none", minWidth:"44px", padding:"8px 4px",
            fontWeight: active ? "600" : "400",
          }}>
            {tab.icon}
            <span style={{ fontSize:"10px", letterSpacing:"0.3px" }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
