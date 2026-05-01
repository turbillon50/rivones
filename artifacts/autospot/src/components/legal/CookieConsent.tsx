import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "rivones-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (!accepted) setVisible(true);
    } catch {}
  }, []);

  if (!visible) return null;

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, new Date().toISOString()); } catch {}
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed bottom-3 left-3 right-3 z-50 mx-auto max-w-md rounded-2xl border border-border/60 bg-background/95 p-4 shadow-2xl backdrop-blur-md sm:bottom-6"
    >
      <p className="text-xs leading-relaxed text-foreground">
        Usamos cookies necesarias para que la plataforma funcione y, con tu consentimiento, analíticas anónimas
        para mejorar la experiencia. Tu información se trata conforme a la
        {" "}
        <a href="/privacidad" className="font-semibold text-primary underline-offset-2 hover:underline">
          Política de Privacidad
        </a>
        {" "}(LFPDPPP).
      </p>
      <div className="mt-3 flex gap-2">
        <Button onClick={accept} size="sm" className="flex-1">Aceptar y continuar</Button>
        <Button
          onClick={() => { window.location.href = "/privacidad"; }}
          variant="outline"
          size="sm"
        >
          Más info
        </Button>
      </div>
    </div>
  );
}
