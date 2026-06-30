"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

type Perfil = {
  nombre?: string;
  tipo_sangre?: string;
  completado?: { personal:boolean; medico:boolean; academico:boolean; documentos:boolean; contactos:boolean; };
};

const CARDS = [
  { key:"personal",    label:"Datos Personales", emoji:"👤", href:"/onboarding" },
  { key:"medico",      label:"Médico",            emoji:"🏥", href:"/medico" },
  { key:"academico",   label:"Académico",         emoji:"🎓", href:"/academico" },
  { key:"documentos",  label:"Documentos",        emoji:"📄", href:"/documentos" },
  { key:"contactos",   label:"Contactos",         emoji:"📞", href:"/contactos" },
];

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.replace("/sign-in"); return; }
    fetch("/api/perfil", { credentials:"include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setPerfil(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || loading) return (
    <main style={{ minHeight:"100vh", background:"#f0f4ff", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <img src="/logo.png" alt="" style={{ width:"80px", opacity:0.4 }} />
      </div>
    </main>
  );

  const completado = perfil?.completado;
  const total = completado ? Object.values(completado).filter(Boolean).length : 0;
  const pct = Math.round((total / 5) * 100);
  const nombre = user?.firstName || "Usuario";
  const foto = user?.imageUrl;

  return (
    <main style={{ minHeight:"100vh", background:"#f0f4ff", paddingBottom:"80px" }}>
      {/* Header */}
      <div style={{ background:"#0D47A1", padding:"16px 20px 20px", borderBottomLeftRadius:"24px", borderBottomRightRadius:"24px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
          <img src="/logo.png" alt="Identy-Kit" style={{ width:"40px", height:"40px", objectFit:"contain" }} />
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <span style={{ color:"white", fontSize:"14px", fontWeight:"500" }}>Hola, {nombre}</span>
            {foto && <img src={foto} alt="" style={{ width:"36px", height:"36px", borderRadius:"50%", border:"2px solid rgba(255,255,255,0.4)" }} />}
          </div>
        </div>
        {/* Progreso */}
        <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:"12px", padding:"14px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
            <span style={{ color:"rgba(255,255,255,0.85)", fontSize:"13px" }}>Perfil completado</span>
            <span style={{ color:"white", fontWeight:"700", fontSize:"14px" }}>{pct}%</span>
          </div>
          <div style={{ background:"rgba(255,255,255,0.25)", borderRadius:"999px", height:"8px", overflow:"hidden" }}>
            <div style={{ background:"#1FD1B8", height:"100%", width:`${pct}%`, borderRadius:"999px", transition:"width 0.4s ease" }} />
          </div>
        </div>
      </div>

      <div style={{ padding:"20px" }}>
        <h2 style={{ color:"#0D47A1", fontSize:"16px", fontWeight:"600", marginBottom:"14px" }}>Tu identidad digital</h2>
        
        {/* Tarjetas */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"20px" }}>
          {CARDS.map(c => {
            const done = completado ? (completado as any)[c.key] : false;
            return (
              <Link key={c.key} href={c.href} style={{
                background:"#ffffff", border:`1px solid ${done ? "#bbf7d0" : "#e5e7eb"}`,
                borderRadius:"16px", padding:"16px", textDecoration:"none",
                display:"flex", flexDirection:"column", gap:"8px",
                boxShadow:"0 1px 4px rgba(0,0,0,0.06)"
              }}>
                <span style={{ fontSize:"24px" }}>{c.emoji}</span>
                <span style={{ color:"#1a1a2e", fontWeight:"500", fontSize:"13px" }}>{c.label}</span>
                <span style={{
                  alignSelf:"flex-start", fontSize:"11px", fontWeight:"600",
                  padding:"3px 10px", borderRadius:"999px",
                  background: done ? "#dcfce7" : "#f1f5f9",
                  color: done ? "#15803d" : "#64748b",
                }}>
                  {done ? "✓ Completo" : "Pendiente"}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Botón QR */}
        <Link href="/emergencia" style={{
          display:"block", background:"#0D47A1", color:"white",
          textAlign:"center", padding:"16px", borderRadius:"14px",
          fontWeight:"700", fontSize:"16px", textDecoration:"none",
          boxShadow:"0 4px 16px rgba(13,71,161,0.35)"
        }}>
          🆘 Mi QR de Emergencia
        </Link>
      </div>

      <BottomNav />
    </main>
  );
}
