"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import BottomNav from "@/components/BottomNav";

type Perfil = {
  full_name?: string; tipo_sangre?: string; alergias?: string[];
  emerg_nombre?: string; emerg_relacion?: string; emerg_telefono?: string;
};

export default function Emergencia() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    fetch("/api/perfil").then(r => r.json()).then(setPerfil);
  }, []);

  const qrData = perfil ? JSON.stringify({
    n: perfil.full_name,
    s: perfil.tipo_sangre,
    a: perfil.alergias,
    e: { nm: perfil.emerg_nombre, r: perfil.emerg_relacion, t: perfil.emerg_telefono }
  }) : "";

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Mi QR de Emergencia - Identy-Kit", url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const callSOS = () => {
    if (perfil?.emerg_telefono) window.location.href = `tel:${perfil.emerg_telefono}`;
  };

  return (
    <main className="flex flex-col items-center min-h-screen pb-24 pt-4">
      <div className="w-full px-4 mb-6">
        <h1 className="text-2xl font-bold" style={{ color:"var(--accent)" }}>QR de Emergencia</h1>
        <p className="text-sm text-gray-400 mt-1">Muéstralo a paramédicos o servicios de emergencia</p>
      </div>

      {/* QR */}
      <div className="glass p-5 rounded-2xl mb-6">
        {qrData ? (
          <QRCodeSVG value={qrData} size={240} fgColor="#1FD1B8" bgColor="transparent" level="H"/>
        ) : (
          <div className="w-60 h-60 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"/>
          </div>
        )}
      </div>

      {/* Info */}
      {perfil && (
        <div className="glass mx-4 p-4 w-[calc(100%-2rem)] mb-4 space-y-2 text-sm">
          <p className="font-semibold" style={{ color:"var(--accent)" }}>Información incluida</p>
          <div className="flex justify-between"><span className="text-gray-400">Nombre</span><span>{perfil.full_name}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Tipo de sangre</span>
            <span className="font-bold text-red-400">{perfil.tipo_sangre}</span>
          </div>
          {perfil.alergias?.length ? (
            <div><span className="text-gray-400">Alergias: </span><span className="text-yellow-400">{perfil.alergias.join(", ")}</span></div>
          ) : null}
          <div><span className="text-gray-400">Contacto: </span>{perfil.emerg_nombre} · {perfil.emerg_telefono}</div>
          <p className="text-xs text-gray-500 mt-2">Solo se comparte lo que autorizaste. Para datos completos se requiere desbloqueo.</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 px-4 w-full">
        <button onClick={share} className="flex-1 glass py-3 rounded-xl font-medium" style={{ color:"var(--accent)" }}>
          {shared ? "¡Copiado!" : "Compartir"}
        </button>
        <button onClick={callSOS} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 active:bg-red-700">
          🆘 SOS
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
