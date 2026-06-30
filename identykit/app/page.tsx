"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

type Perfil = {
  full_name?: string; curp?: string; tipo_sangre?: string;
  alergias?: string[]; padecimientos?: string[]; medicamentos?: string[];
  emerg_nombre?: string; emerg_relacion?: string; emerg_telefono?: string;
  medico_cabecera?: string;
};

function Card({ href, icon, title, subtitle, complete }: { href:string; icon:React.ReactNode; title:string; subtitle:string; complete:boolean }) {
  return (
    <Link href={href} className="glass flex items-center p-4 gap-4 active:scale-[0.98] transition-transform">
      <div className="w-11 h-11 flex items-center justify-center rounded-xl shrink-0" style={{ background:"rgba(31,209,184,0.12)", color:"var(--accent)" }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-base">{title}</h3>
        <p className="text-sm text-gray-400 truncate">{subtitle}</p>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${complete ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-gray-400"}`}>
        {complete ? "✓" : "–"}
      </span>
    </Link>
  );
}

export default function Home() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.replace("/sign-in"); return; }
    fetch("/api/perfil").then(r => r.json()).then(d => {
      setPerfil(d);
      setLoading(false);
      if (!d || !d.curp) router.replace("/onboarding");
    });
  }, [isSignedIn, isLoaded, router]);

  if (!isLoaded || loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const progress = (() => {
    if (!perfil) return 0;
    const f = [perfil.full_name, perfil.curp, perfil.tipo_sangre, perfil.alergias?.length, perfil.emerg_nombre];
    return Math.round((f.filter(Boolean).length / f.length) * 100);
  })();

  const avatar = user?.imageUrl;
  const initials = (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "");

  return (
    <main className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <header className="glass flex items-center gap-4 p-4 mx-4 mt-4">
        {avatar ? (
          <img src={avatar} className="w-14 h-14 rounded-full object-cover" alt="foto"/>
        ) : (
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold" style={{ background:"rgba(31,209,184,0.15)", color:"var(--accent)" }}>
            {initials || "?"}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-semibold" style={{ color:"var(--accent)" }}>{perfil?.full_name ?? user?.firstName}</h1>
          <p className="text-sm text-gray-400">Carnet de Identidad Digital</p>
        </div>
      </header>

      {/* Progress */}
      <div className="mx-4 mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-gray-400">Perfil completo</p>
          <p className="text-xs font-medium" style={{ color:"var(--accent)" }}>{progress}%</p>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.1)" }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width:`${progress}%`, background:"linear-gradient(90deg,#149D90,#1FD1B8,#6FF6E2)" }}/>
        </div>
      </div>

      {/* Cards */}
      <section className="flex flex-col gap-3 p-4 mt-2">
        <Card href="/personales" title="Datos Personales" subtitle={perfil?.curp ? `CURP: ${perfil.curp.substring(0,8)}...` : "CURP, nacimiento, tipo de sangre"} complete={!!perfil?.curp}
          icon={<svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
        />
        <Card href="/medico" title="Historial Médico" subtitle={perfil?.alergias?.length ? `${perfil.alergias.length} alergias registradas` : "Alergias, vacunas, padecimientos"} complete={!!perfil?.alergias?.length}
          icon={<svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
        />
        <Card href="/academico" title="Historial Académico" subtitle="Escuela, grado, certificados" complete={false}
          icon={<svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><path d="M2 9l10-5 10 5-10 5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" stroke="currentColor" strokeWidth="2"/></svg>}
        />
        <Card href="/documentos" title="Documentos" subtitle="INE, pasaporte, acta de nacimiento" complete={false}
          icon={<svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><path d="M6 2h9l5 5v15H6V2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M15 2v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>}
        />
        <Card href="/contactos" title="Contactos de Emergencia" subtitle={perfil?.emerg_nombre ? `${perfil.emerg_nombre} (${perfil.emerg_relacion})` : "Familia y médico de cabecera"} complete={!!perfil?.emerg_nombre}
          icon={<svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><path d="M12 2L2 7v6c0 5.5 4 9.7 10 11 6-1.3 10-5.5 10-11V7l-10-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
        />

        <Link href="/emergencia" className="glass v-pulse flex items-center justify-center gap-2 py-4 mt-2 text-base font-semibold" style={{ color:"var(--accent)" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
            <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
            <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
            <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Generar QR de Emergencia
        </Link>
      </section>
      <BottomNav />
    </main>
  );
}
