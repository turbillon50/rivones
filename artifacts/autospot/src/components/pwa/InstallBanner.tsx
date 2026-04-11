import { useState, useEffect, useCallback } from "react";
import { IconX } from "@/components/ui/icons";
import { motion, AnimatePresence } from "framer-motion";

type Platform = "ios" | "android" | "none";

function detectPlatform(): Platform {
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "ios";
  if (/android/i.test(ua)) return "android";
  return "none";
}

function isStandalone(): boolean {
  return (
    (window.matchMedia?.("(display-mode: standalone)").matches) ||
    (window.navigator as any).standalone === true
  );
}

export function InstallBanner() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>("none");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [step, setStep] = useState<"banner" | "instructions">("banner");

  useEffect(() => {
    if (isStandalone()) return;

    const dismissed = localStorage.getItem("autospot-pwa-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    const p = detectPlatform();
    setPlatform(p);

    const timer = setTimeout(() => {
      if (p !== "none") setShow(true);
    }, 5000);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const dismiss = useCallback(() => {
    setShow(false);
    localStorage.setItem("autospot-pwa-dismissed", Date.now().toString());
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        setShow(false);
      }
      setDeferredPrompt(null);
    } else if (platform === "ios") {
      setStep("instructions");
    }
  }, [deferredPrompt, platform]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-24 left-4 right-4 z-[60]"
      >
        {step === "banner" && (
          <div className="bg-white/95 backdrop-blur-xl border border-black/5 rounded-2xl shadow-2xl shadow-black/15 overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00b8d9] to-[#006680] flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3C13.3 7.3 12.7 7 12 7H5c-.6 0-1.1.4-1.4.9L2.2 10.8A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="7" cy="17" r="2" stroke="white" strokeWidth="1.6"/>
                    <path d="M9 17h6" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                    <circle cx="17" cy="17" r="2" stroke="white" strokeWidth="1.6"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground">Instala Rivones</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Acceso rápido desde tu pantalla de inicio. Sin descargar de la tienda.
                  </p>
                </div>
                <button onClick={dismiss} className="p-1 -mr-1 -mt-1">
                  <IconX size={18} className="text-muted-foreground/50" />
                </button>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={dismiss}
                  className="flex-1 h-10 rounded-xl border border-border text-xs font-semibold text-muted-foreground active:scale-95 transition-transform"
                >
                  Ahora no
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 h-10 rounded-xl bg-gradient-to-r from-[#00b8d9] to-[#006680] text-white text-xs font-semibold shadow-lg shadow-primary/30 active:scale-95 transition-transform"
                >
                  {platform === "ios" ? "Cómo instalar" : "Instalar app"}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "instructions" && (
          <div className="bg-white/95 backdrop-blur-xl border border-black/5 rounded-2xl shadow-2xl shadow-black/15 overflow-hidden">
            <div className="px-4 pt-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">
                  {platform === "ios" ? "Instalar en iPhone/iPad" : "Instalar en Android"}
                </h3>
                <button onClick={dismiss} className="p-1 -mr-1">
                  <IconX size={18} className="text-muted-foreground/50" />
                </button>
              </div>

              {platform === "ios" && (
                <div className="space-y-3">
                  <Step number={1} text={'Toca el botón "Compartir"'} icon={<ShareIcon />} />
                  <Step number={2} text={'Desliza y toca "Agregar a pantalla de inicio"'} icon={<PlusSquareIcon />} />
                  <Step number={3} text={'Toca "Agregar" en la esquina superior'} icon={null} />
                </div>
              )}

              {platform === "android" && (
                <div className="space-y-3">
                  <Step number={1} text={'Toca los 3 puntos ⋮ arriba a la derecha'} icon={null} />
                  <Step number={2} text={'Toca "Instalar app" o "Agregar a pantalla de inicio"'} icon={null} />
                  <Step number={3} text={'Confirma tocando "Instalar"'} icon={null} />
                </div>
              )}

              <button
                onClick={dismiss}
                className="w-full h-10 mt-4 rounded-xl bg-gradient-to-r from-[#00b8d9] to-[#006680] text-white text-xs font-semibold shadow-lg shadow-primary/30 active:scale-95 transition-transform"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function Step({ number, text, icon }: { number: number; text: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-primary">{number}</span>
      </div>
      <p className="text-xs text-foreground flex-1">{text}</p>
      {icon && <div className="shrink-0">{icon}</div>}
    </div>
  );
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function PlusSquareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
