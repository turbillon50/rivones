"use client";
import { useEffect, useState } from "react";

export default function EmergenciaPublica() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("data");
    if (raw) {
      try { setData(JSON.parse(decodeURIComponent(raw))); }
      catch {}
    }
  }, []);

  if (!data) return (
    <main style={{ minHeight:"100vh", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", textAlign:"center" }}>
      <div>
        <div style={{ fontSize:"64px", marginBottom:"16px" }}>🆘</div>
        <h1 style={{ color:"#dc2626", fontSize:"20px", fontWeight:"700" }}>Escanea el QR de la persona</h1>
        <p style={{ color:"#6b7280", marginTop:"8px" }}>para ver su información de emergencia</p>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight:"100vh", background:"#fff", padding:"24px", maxWidth:"500px", margin:"0 auto" }}>
      <div style={{ background:"#dc2626", color:"white", borderRadius:"16px", padding:"20px", textAlign:"center", marginBottom:"20px" }}>
        <div style={{ fontSize:"12px", letterSpacing:"2px", marginBottom:"4px" }}>INFORMACIÓN DE EMERGENCIA</div>
        <h1 style={{ fontSize:"24px", fontWeight:"700", margin:"0" }}>{data.n || data.nombre}</h1>
      </div>

      {(data.s || data.tipo_sangre) && (
        <div style={{ background:"#fef2f2", border:"2px solid #dc2626", borderRadius:"12px", padding:"16px", textAlign:"center", marginBottom:"16px" }}>
          <div style={{ fontSize:"12px", color:"#dc2626", fontWeight:"600", letterSpacing:"1px" }}>TIPO DE SANGRE</div>
          <div style={{ fontSize:"40px", fontWeight:"700", color:"#dc2626" }}>{data.s || data.tipo_sangre}</div>
        </div>
      )}

      {(data.a || data.alergias)?.length > 0 && (
        <div style={{ background:"#fffbeb", border:"1px solid #f59e0b", borderRadius:"12px", padding:"16px", marginBottom:"16px" }}>
          <div style={{ fontSize:"12px", color:"#92400e", fontWeight:"600", letterSpacing:"1px", marginBottom:"8px" }}>⚠️ ALERGIAS</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
            {(data.a || data.alergias).map((a: string, i: number) => (
              <span key={i} style={{ background:"#dc2626", color:"white", padding:"4px 12px", borderRadius:"999px", fontSize:"14px", fontWeight:"500" }}>{a}</span>
            ))}
          </div>
        </div>
      )}

      {data.e?.t && (
        <div style={{ background:"#eff6ff", border:"1px solid #3b82f6", borderRadius:"12px", padding:"16px" }}>
          <div style={{ fontSize:"12px", color:"#1d4ed8", fontWeight:"600", letterSpacing:"1px", marginBottom:"8px" }}>CONTACTO DE EMERGENCIA</div>
          <div style={{ fontWeight:"600", color:"#1a1a2e", marginBottom:"12px" }}>{data.e.nm} {data.e.r ? `(${data.e.r})` : ""}</div>
          <a href={`tel:${data.e.t}`} style={{ display:"block", background:"#0D47A1", color:"white", textAlign:"center", padding:"14px", borderRadius:"10px", fontWeight:"700", fontSize:"16px", textDecoration:"none" }}>
            📞 Llamar ahora
          </a>
        </div>
      )}
    </main>
  );
}
