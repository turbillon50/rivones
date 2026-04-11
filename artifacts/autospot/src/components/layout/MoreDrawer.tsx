import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface MoreDrawerProps {
  open: boolean;
  onClose: () => void;
}

const GRID_ITEMS = [
  { id: "explore", label: "Explorar", desc: "Autos disponibles", href: "/explore" },
  { id: "map", label: "Mapa", desc: "Autos cerca de ti", href: "/map" },
  { id: "notifications", label: "Avisos", desc: "Notificaciones y alertas", href: "/notifications" },
  { id: "profile", label: "Perfil", desc: "Tu cuenta y viajes", href: "/profile" },
  { id: "guia", label: "Guía Rivones", desc: "Descuentos y rutas", href: "/guia" },
  { id: "upload", label: "Publicar auto", desc: "Gana como anfitrión", href: "/upload" },
  { id: "route", label: "Planear ruta", desc: "Diseña tu viaje", href: "/planear-ruta" },
  { id: "settings", label: "Configurar", desc: "Ajustes de cuenta", href: "/profile" },
];

const ICON_PATHS: Record<string, string> = {
  explore: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 2.5l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z",
  map: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  notifications: "M12 2a6 6 0 0 0-6 6v5l-2 2v1h16v-1l-2-2V8a6 6 0 0 0-6-6zm-1.5 17a1.5 1.5 0 0 0 3 0z",
  profile: "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 20c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6z",
  guia: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z",
  upload: "M7 17a2 2 0 1 0 0 .01M17 17a2 2 0 1 0 0 .01M5 12.8l-1.4 1.7c-.4.4-.6 1-.6 1.5v2c0 .6.4 1 1 1h1M19 12.8l1.4 1.7c.4.4.6 1 .6 1.5v2c0 .6-.4 1-1 1h-1M16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.1",
  route: "M6 19a3 3 0 1 0 0-.01M18 5a3 3 0 1 0 0-.01M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15",
  settings: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12",
};

export function MoreDrawer({ open, onClose }: MoreDrawerProps) {
  const [, navigate] = useLocation();
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShow(true));
      });
    } else {
      setShow(false);
      timerRef.current = setTimeout(() => setVisible(false), 450);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [open]);

  const handleNav = (item: typeof GRID_ITEMS[0]) => {
    if (item.href) navigate(item.href);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={cn(
          "absolute inset-0 transition-all duration-[600ms]",
          show ? "backdrop-blur-2xl" : "backdrop-blur-none"
        )}
        style={{
          backgroundColor: show ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0)",
        }}
        onClick={onClose}
      />

      <div className="relative h-full flex flex-col">
        <div
          className={cn(
            "pt-14 px-6 pb-2 transition-all duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
          )}
          style={{ transitionDelay: show ? "60ms" : "0ms" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[28px] font-extrabold text-white tracking-tight leading-tight" style={{
                textShadow: "0 2px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)",
              }}>¿A dónde vamos?</h2>
              <p className="text-[13px] text-white/50 mt-1 font-medium tracking-wide" style={{
                textShadow: "0 1px 6px rgba(0,0,0,0.4)",
              }}>Elige tu destino</p>
            </div>
            <button
              onClick={onClose}
              className="mt-1 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(40px) saturate(180%) contrast(120%)",
                WebkitBackdropFilter: "blur(40px) saturate(180%) contrast(120%)",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25), 0 4px 12px rgba(0,0,0,0.2)",
                border: "0.5px solid rgba(255,255,255,0.2)",
              }}
              aria-label="Cerrar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 px-4 pb-32 overflow-y-auto overscroll-contain mt-3">
          <div className="grid grid-cols-3 gap-3 max-w-[380px] mx-auto">
            {GRID_ITEMS.map((item, i) => (
              <button
                key={item.id}
                onClick={() => handleNav(item)}
                className={cn(
                  "group relative flex flex-col items-center text-center overflow-hidden transition-all ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.92]",
                  show ? "opacity-100 translate-y-0 scale-100 duration-[700ms]" : "opacity-0 translate-y-12 scale-90 duration-300"
                )}
                style={{
                  transitionDelay: show ? `${100 + i * 50}ms` : "0ms",
                  aspectRatio: "1",
                  borderRadius: "24px",
                }}
              >
                <div className="absolute inset-0" style={{
                  borderRadius: "24px",
                  background: "linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.03) 60%, rgba(255,255,255,0.1) 100%)",
                  backdropFilter: "blur(60px) saturate(200%) contrast(130%) brightness(105%)",
                  WebkitBackdropFilter: "blur(60px) saturate(200%) contrast(130%) brightness(105%)",
                }} />

                <div className="absolute inset-[0.5px] pointer-events-none" style={{
                  borderRadius: "24px",
                  border: "0.5px solid rgba(255,255,255,0.22)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 30%, transparent 75%, rgba(255,255,255,0.04) 100%)",
                }} />

                <div className="absolute top-0 left-[8%] right-[8%] h-[1px] pointer-events-none" style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
                }} />

                <div className="absolute top-[1px] left-[15%] right-[15%] h-[1px] pointer-events-none" style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                  filter: "blur(0.5px)",
                }} />

                <div className="absolute bottom-0 left-[20%] right-[20%] h-[1px] pointer-events-none" style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                }} />

                <div className="relative flex flex-col items-center justify-center h-full gap-2 p-3 z-10">
                  <div className="relative w-[50px] h-[50px]">
                    <div className="absolute inset-0 rounded-[14px]" style={{
                      background: "linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.1) 100%)",
                      backdropFilter: "blur(30px) saturate(160%) contrast(120%)",
                      WebkitBackdropFilter: "blur(30px) saturate(160%) contrast(120%)",
                      boxShadow: "0 6px 20px -4px rgba(0,0,0,0.25), inset 0 1.5px 2px rgba(255,255,255,0.35), inset 0 -0.5px 1px rgba(0,0,0,0.1)",
                    }} />

                    <div className="absolute inset-0 rounded-[14px] overflow-hidden pointer-events-none">
                      <div className="absolute inset-x-0 top-0 h-[50%]" style={{
                        background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
                        borderRadius: "14px 14px 50% 50%",
                      }} />
                    </div>

                    <div className="absolute inset-0 rounded-[14px] pointer-events-none" style={{
                      background: "radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                    }} />

                    <div className="absolute inset-0 rounded-[14px] overflow-hidden pointer-events-none" style={{
                      background: "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.04) 55%, transparent 70%)",
                    }} />

                    <div className="absolute inset-[0.5px] rounded-[14px] pointer-events-none" style={{
                      border: "0.5px solid rgba(255,255,255,0.28)",
                    }} />

                    <svg
                      width="24" height="24" viewBox="0 0 24 24"
                      className="absolute inset-0 m-auto z-10"
                      fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                      style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
                    >
                      <path d={ICON_PATHS[item.id]} />
                    </svg>
                  </div>

                  <div className="w-full px-0.5">
                    <p className="text-[12px] font-bold text-white leading-tight tracking-tight" style={{
                      textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                    }}>{item.label}</p>
                    <p className="text-[9px] text-white/40 mt-0.5 leading-tight font-medium">{item.desc}</p>
                  </div>
                </div>

                <div className="absolute inset-0 pointer-events-none opacity-0 group-active:opacity-100 transition-opacity duration-150" style={{
                  borderRadius: "24px",
                  background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 70%)",
                }} />
              </button>
            ))}
          </div>

          <div
            className={cn(
              "mt-6 max-w-[380px] mx-auto transition-all ease-[cubic-bezier(0.22,1,0.36,1)]",
              show ? "opacity-100 translate-y-0 duration-[700ms]" : "opacity-0 translate-y-6 duration-300"
            )}
            style={{ transitionDelay: show ? "580ms" : "0ms" }}
          >
            <div className="relative overflow-hidden" style={{ borderRadius: "20px" }}>
              <div className="absolute inset-0" style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)",
                backdropFilter: "blur(60px) saturate(180%) contrast(120%)",
                WebkitBackdropFilter: "blur(60px) saturate(180%) contrast(120%)",
              }} />
              <div className="absolute inset-[0.5px]" style={{
                borderRadius: "20px",
                border: "0.5px solid rgba(255,255,255,0.18)",
              }} />
              <div className="absolute top-0 left-[10%] right-[10%] h-[1px]" style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
              }} />
              <div className="relative flex gap-2.5 p-3.5">
                <button
                  onClick={() => { navigate("/sign-in"); onClose(); }}
                  className="flex-1 h-12 flex items-center justify-center text-[13px] font-semibold text-white transition-all active:scale-[0.96]"
                  style={{
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.08)",
                    border: "0.5px solid rgba(255,255,255,0.15)",
                    backdropFilter: "blur(20px) contrast(110%)",
                    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)",
                  }}
                >
                  Iniciar sesión
                </button>
                <button
                  onClick={() => { navigate("/sign-up"); onClose(); }}
                  className="flex-1 h-12 flex items-center justify-center text-[13px] font-extrabold text-white transition-all active:scale-[0.96]"
                  style={{
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #00b8d9 0%, #00d4ff 50%, #4de8ff 100%)",
                    boxShadow: "0 8px 24px -6px rgba(0,212,255,0.4), inset 0 1.5px 2px rgba(255,255,255,0.35)",
                  }}
                >
                  Crear cuenta
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => { navigate("/admin"); onClose(); }}
            className={cn(
              "mx-auto mt-6 flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-500 active:scale-95",
              show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
            style={{
              transitionDelay: show ? "620ms" : "0ms",
              background: "rgba(255,255,255,0.06)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4"/>
            </svg>
            <span className="text-[11px] text-white/35 font-medium tracking-wide">Panel Admin</span>
          </button>

          <p
            className={cn(
              "text-center text-[10px] text-white/20 mt-4 font-medium tracking-[0.2em] uppercase transition-all duration-500",
              show ? "opacity-100" : "opacity-0"
            )}
            style={{ transitionDelay: show ? "680ms" : "0ms" }}
          >
            Rivones · rentamerapido.autos
          </p>
        </div>
      </div>
    </div>
  );
}
