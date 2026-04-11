import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api";

const ROLES = [
  {
    id: "renter",
    symbol: "R",
    gradient: "from-[#3B82F6] to-[#6366F1]",
    title: "Quiero rentar un auto",
    description: "Busca, reserva y renta autos de anfitriones verificados en todo México.",
    badge: "Arrendatario",
    badgeColor: "bg-blue-50 text-blue-600",
    ring: "ring-2 ring-[#3B82F6] border-[#3B82F6]",
  },
  {
    id: "host",
    symbol: "A",
    gradient: "from-[#00b8d9] to-[#00d4ff]",
    title: "Quiero publicar mi auto",
    description: "Genera ingresos extras rentando tu vehículo cuando no lo uses.",
    badge: "Anfitrión",
    badgeColor: "bg-rose-50 text-primary",
    ring: "ring-2 ring-primary border-primary",
  },
  {
    id: "both",
    symbol: "★",
    gradient: "from-[#8B5CF6] to-[#EC4899]",
    title: "Ambas cosas",
    description: "Renta autos de otros y también publica el tuyo para generar ingresos.",
    badge: "Completo",
    badgeColor: "bg-violet-50 text-violet-600",
    ring: "ring-2 ring-[#8B5CF6] border-[#8B5CF6]",
  },
];

export default function Onboarding() {
  const [selected, setSelected] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleContinue = async () => {
    if (!selected) return;
    localStorage.setItem("autospot-role", selected);

    if (user?.email) {
      try {
        await apiFetch("/email/welcome", {
          method: "POST",
          body: JSON.stringify({ email: user.email, name: user.name }),
        });
      } catch {}
    }

    if (selected === "host") setLocation("/upload");
    else if (selected === "both") setLocation("/explore");
    else setLocation("/explore");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5f3] via-white to-[#fff0ee] flex flex-col">
      <div className="flex-1 flex flex-col px-5 pt-16 pb-6">

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-5 shadow-lg shadow-primary/30">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M4 20C4 20 6 16 14 16C22 16 24 20 24 20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="14" cy="10" r="4" stroke="white" strokeWidth="2.5"/>
              <path d="M19 6L22 4M9 6L6 4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Bienvenido a Rivones</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">¿Cómo vas a usar la plataforma?</p>
        </div>

        <div className="flex flex-col gap-4">
          {ROLES.map((role) => {
            const isSelected = selected === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelected(role.id)}
                className={`w-full text-left rounded-2xl border-2 bg-white p-6 transition-all duration-150 ${
                  isSelected ? role.ring : "border-border hover:border-border/80 hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                    <span className="text-white font-bold text-xl">{role.symbol}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground text-base">{role.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{role.description}</p>
                    <span className={`inline-block mt-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${role.badgeColor}`}>
                      {role.badge}
                    </span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground/25"
                  }`}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-10">
          <Button
            onClick={handleContinue}
            disabled={!selected}
            className="w-full h-14 text-[15px] font-semibold rounded-2xl shadow-lg shadow-primary/30 disabled:opacity-35 disabled:shadow-none transition-all"
          >
            Continuar
          </Button>
          <p className="text-center text-xs text-muted-foreground/60 mt-3">
            Puedes cambiar tu rol desde tu perfil en cualquier momento
          </p>
        </div>
      </div>

      <div className="pb-8 text-center border-t border-border/40 pt-4">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground/60">
          <a href="/terminos" className="hover:text-primary transition-colors">Términos</a>
          <a href="/privacidad" className="hover:text-primary transition-colors">Privacidad</a>
          <a href="/cancelaciones" className="hover:text-primary transition-colors">Cancelaciones</a>
          <a href="/soporte" className="hover:text-primary transition-colors">Soporte</a>
        </div>
        <p className="text-[11px] text-muted-foreground/40 mt-2">© 2025 Rivones · rentamerapido.autos</p>
      </div>
    </div>
  );
}
