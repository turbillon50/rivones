"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiPerfil = Record<string, any>;
type MedicoData = {
  tipo_sangre?: string;
  alergias?: string;
  padecimientos?: string;
  medicamentos?: string;
  medico_cabecera?: string;
  tel_medico?: string;
};

export default function MedicoPage() {
  const [data, setData] = useState<MedicoData>({});
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<MedicoData>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/perfil", { credentials:"include" })
      .then(r => r.ok ? r.json() : {} as ApiPerfil)
      .then((d: ApiPerfil) => {
        const m: MedicoData = (d && d.medico) ? d.medico as MedicoData : {};
        setData(m); setForm(m); setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/perfil", {
      method:"POST", credentials:"include",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ seccion:"medico", ...form })
    });
    setData(form); setEditing(false); setSaving(false);
  };

  const f = (k: keyof MedicoData, v: string) => setForm(p => ({ ...p, [k]: v }));

  const field = (label: string, key: keyof MedicoData, type="text") => (
    <div key={key} style={{ marginBottom:"14px" }}>
      <label style={{ display:"block", color:"#6b7280", fontSize:"12px", fontWeight:"600", letterSpacing:"0.5px", marginBottom:"6px" }}>{label.toUpperCase()}</label>
      <input type={type} value={form[key] || ""} onChange={e => f(key, e.target.value)}
        style={{ width:"100%", padding:"12px 14px", border:"1.5px solid #e5e7eb", borderRadius:"10px", fontSize:"15px", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }} />
    </div>
  );

  return (
    <main style={{ minHeight:"100vh", background:"#f0f4ff", paddingBottom:"80px" }}>
      <div style={{ background:"#0D47A1", padding:"16px 20px", borderBottomLeftRadius:"24px", borderBottomRightRadius:"24px", display:"flex", alignItems:"center", gap:"12px" }}>
        <Link href="/" style={{ color:"white", fontSize:"20px", textDecoration:"none" }}>←</Link>
        <h1 style={{ color:"white", fontSize:"18px", fontWeight:"700", margin:0 }}>Datos Médicos</h1>
      </div>

      <div style={{ padding:"20px" }}>
        {!loaded ? <p style={{ color:"#6b7280" }}>Cargando...</p> : !editing ? (
          <div>
            {data.tipo_sangre && (
              <div style={{ background:"#fef2f2", border:"2px solid #fca5a5", borderRadius:"14px", padding:"16px", textAlign:"center", marginBottom:"16px" }}>
                <div style={{ fontSize:"11px", color:"#dc2626", fontWeight:"700", letterSpacing:"1px" }}>TIPO DE SANGRE</div>
                <div style={{ fontSize:"42px", fontWeight:"800", color:"#dc2626" }}>{data.tipo_sangre}</div>
              </div>
            )}
            {([["Alergias","alergias","#fef3c7","#92400e"],["Padecimientos","padecimientos","#eff6ff","#1e40af"],["Medicamentos","medicamentos","#f0fdf4","#166534"]] as const).map(([label, key, bg, tc]) => (
              data[key as keyof MedicoData] ? (
                <div key={key} style={{ background:bg, border:`1px solid ${tc}33`, borderRadius:"12px", padding:"14px", marginBottom:"12px" }}>
                  <div style={{ fontSize:"11px", color:tc, fontWeight:"700", letterSpacing:"0.5px", marginBottom:"6px" }}>{label.toUpperCase()}</div>
                  <div style={{ color:"#1a1a2e", fontSize:"14px" }}>{data[key as keyof MedicoData]}</div>
                </div>
              ) : null
            ))}
            {data.medico_cabecera && (
              <div style={{ background:"white", border:"1px solid #e5e7eb", borderRadius:"12px", padding:"14px", marginBottom:"12px" }}>
                <div style={{ fontSize:"11px", color:"#6b7280", fontWeight:"700", letterSpacing:"0.5px" }}>MÉDICO DE CABECERA</div>
                <div style={{ color:"#1a1a2e", fontSize:"15px", fontWeight:"500", marginTop:"4px" }}>{data.medico_cabecera}</div>
                {data.tel_medico && <a href={`tel:${data.tel_medico}`} style={{ color:"#0D47A1", fontSize:"14px", display:"block", marginTop:"4px" }}>{data.tel_medico}</a>}
              </div>
            )}
            {!data.tipo_sangre && !data.alergias && !data.medico_cabecera && (
              <div style={{ textAlign:"center", padding:"40px 20px", color:"#9ca3af" }}>
                <div style={{ fontSize:"48px", marginBottom:"12px" }}>🏥</div>
                <p>Sin datos médicos aún</p>
              </div>
            )}
            <button onClick={() => setEditing(true)} style={{
              width:"100%", background:"#0D47A1", color:"white", border:"none",
              padding:"14px", borderRadius:"12px", fontSize:"15px", fontWeight:"600",
              cursor:"pointer", marginTop:"8px"
            }}>
              {data.tipo_sangre ? "Editar datos" : "Agregar datos médicos"}
            </button>
          </div>
        ) : (
          <div style={{ background:"white", borderRadius:"16px", padding:"20px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
            {field("Tipo de sangre", "tipo_sangre")}
            {field("Alergias (separadas por coma)", "alergias")}
            {field("Padecimientos crónicos", "padecimientos")}
            {field("Medicamentos actuales", "medicamentos")}
            {field("Médico de cabecera", "medico_cabecera")}
            {field("Teléfono del médico", "tel_medico", "tel")}
            <div style={{ display:"flex", gap:"10px", marginTop:"8px" }}>
              <button onClick={() => setEditing(false)} style={{ flex:1, background:"#f1f5f9", color:"#374151", border:"none", padding:"12px", borderRadius:"10px", fontWeight:"600", cursor:"pointer" }}>Cancelar</button>
              <button onClick={save} disabled={saving} style={{ flex:2, background:"#0D47A1", color:"white", border:"none", padding:"12px", borderRadius:"10px", fontWeight:"600", cursor:"pointer" }}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
