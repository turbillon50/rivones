"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

const TIPOS = ["INE","Pasaporte","Acta de nacimiento","Cartilla de vacunación","Póliza de seguro"] as const;
type Tipo = typeof TIPOS[number];

export default function DocumentosPage() {
  const [docs, setDocs] = useState<Record<Tipo, boolean>>({} as any);
  const [uploading, setUploading] = useState<Tipo | null>(null);

  const load = async () => {
    const r = await fetch("/api/documentos", { credentials:"include" });
    if (r.ok) {
      const list: any[] = await r.json();
      const m: any = {};
      list.forEach(d => { m[d.tipo] = true; });
      setDocs(m);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFile = async (tipo: Tipo, files: FileList | null) => {
    if (!files?.[0]) return;
    setUploading(tipo);
    const fd = new FormData();
    fd.append("tipo", tipo);
    fd.append("archivo", files[0]);
    await fetch("/api/documentos", { method:"POST", body:fd, credentials:"include" });
    await load();
    setUploading(null);
  };

  return (
    <main style={{ minHeight:"100vh", background:"#f0f4ff", paddingBottom:"80px" }}>
      <div style={{ background:"#0D47A1", padding:"16px 20px", borderBottomLeftRadius:"24px", borderBottomRightRadius:"24px", display:"flex", alignItems:"center", gap:"12px" }}>
        <Link href="/" style={{ color:"white", fontSize:"20px", textDecoration:"none" }}>←</Link>
        <h1 style={{ color:"white", fontSize:"18px", fontWeight:"700", margin:0 }}>Documentos</h1>
      </div>

      <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:"12px" }}>
        {TIPOS.map(t => {
          const done = docs[t];
          const up = uploading === t;
          return (
            <div key={t} style={{
              background:"white", border:`1px solid ${done?"#bbf7d0":"#e5e7eb"}`,
              borderRadius:"14px", padding:"16px",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              boxShadow:"0 1px 4px rgba(0,0,0,0.05)"
            }}>
              <div>
                <div style={{ color:"#1a1a2e", fontWeight:"500", fontSize:"15px" }}>{t}</div>
                <div style={{ fontSize:"12px", color: done?"#15803d":"#9ca3af", marginTop:"2px", fontWeight:"600" }}>
                  {done ? "✓ Cargado" : "Sin cargar"}
                </div>
              </div>
              <label style={{
                background: done ? "#f0fdf4" : "#0D47A1",
                color: done ? "#15803d" : "white",
                border: done ? "1px solid #86efac" : "none",
                padding:"10px 16px", borderRadius:"10px",
                fontSize:"13px", fontWeight:"600", cursor:"pointer",
                position:"relative", overflow:"hidden", whiteSpace:"nowrap"
              }}>
                {up ? "..." : done ? "📷 Re-subir" : "📷 Subir"}
                <input type="file" accept="image/*" capture="environment"
                  onChange={e => handleFile(t, e.target.files)}
                  style={{ position:"absolute", inset:0, opacity:0, cursor:"pointer" }} />
              </label>
            </div>
          );
        })}
      </div>
      <BottomNav />
    </main>
  );
}
