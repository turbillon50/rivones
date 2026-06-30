"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = ["Datos básicos", "Historial médico", "Contacto de emergencia", "Confirmación"];
const SANGRE = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const [basic, setBasic] = useState({ full_name:"", curp:"", fecha_nacimiento:"", tipo_sangre:"" });
  const [medico, setMedico] = useState({ alergias:"", padecimientos:"", medicamento_actual:"", medico_cabecera:"", medico_telefono:"" });
  const [emergencia, setEmergencia] = useState({ nombre:"", relacion:"", telefono:"" });
  const [loading, setLoading] = useState(false);

  const next = async () => {
    if (step < STEPS.length - 1) { setStep(s => s + 1); return; }
    setLoading(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ basic, medico, emergencia }),
    });
    setLoading(false);
    if (res.ok) router.push("/");
    else alert("Error al guardar. Intenta de nuevo.");
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent";

  return (
    <main className="min-h-screen bg-bg flex flex-col pb-8">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <svg viewBox="0 0 512 460" className="w-10 h-10" fill="none">
          <defs><linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#4FF0D8"/><stop offset="100%" stopColor="#129488"/></linearGradient></defs>
          <path d="M256 38 L378 76 V206 C378 298 322 358 256 392 C190 358 134 298 134 206 V76 Z" fill="#0b0b10" stroke="url(#g)" strokeWidth="12" strokeLinejoin="round"/>
          <path d="M150 260 h40 l14-32 l20 52 l16-78 l16 58 h106" fill="none" stroke="#F3FFFC" strokeWidth="9" strokeLinecap="round"/>
        </svg>
        <div>
          <p className="font-bold text-accent">IDENTY-KIT</p>
          <p className="text-xs text-gray-400">Configura tu carnet</p>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>{STEPS[step]}</span>
          <span>Paso {step + 1} de {STEPS.length}</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full">
          <div className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 px-4 space-y-4">
        {step === 0 && <>
          <input className={inputCls} placeholder="Nombre completo" value={basic.full_name} onChange={e=>setBasic({...basic,full_name:e.target.value})}/>
          <input className={inputCls} placeholder="CURP" value={basic.curp} onChange={e=>setBasic({...basic,curp:e.target.value.toUpperCase()})}/>
          <input type="date" className={inputCls} value={basic.fecha_nacimiento} onChange={e=>setBasic({...basic,fecha_nacimiento:e.target.value})}/>
          <select className={inputCls} value={basic.tipo_sangre} onChange={e=>setBasic({...basic,tipo_sangre:e.target.value})}>
            <option value="">Tipo de sangre</option>
            {SANGRE.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </>}

        {step === 1 && <>
          <label className="text-sm text-gray-400">Alergias (una por línea)</label>
          <textarea className={inputCls + " h-24 resize-none"} placeholder="Penicilina&#10;Polen" value={medico.alergias} onChange={e=>setMedico({...medico,alergias:e.target.value})}/>
          <label className="text-sm text-gray-400">Padecimientos (uno por línea)</label>
          <textarea className={inputCls + " h-24 resize-none"} placeholder="Asma leve" value={medico.padecimientos} onChange={e=>setMedico({...medico,padecimientos:e.target.value})}/>
          <input className={inputCls} placeholder="Medicamento actual" value={medico.medicamento_actual} onChange={e=>setMedico({...medico,medicamento_actual:e.target.value})}/>
          <input className={inputCls} placeholder="Médico de cabecera" value={medico.medico_cabecera} onChange={e=>setMedico({...medico,medico_cabecera:e.target.value})}/>
          <input type="tel" className={inputCls} placeholder="Teléfono del médico" value={medico.medico_telefono} onChange={e=>setMedico({...medico,medico_telefono:e.target.value})}/>
        </>}

        {step === 2 && <>
          <p className="text-sm text-gray-400">Esta persona será contactada en emergencias</p>
          <input className={inputCls} placeholder="Nombre completo" value={emergencia.nombre} onChange={e=>setEmergencia({...emergencia,nombre:e.target.value})}/>
          <input className={inputCls} placeholder="Relación (padre, madre, esposo...)" value={emergencia.relacion} onChange={e=>setEmergencia({...emergencia,relacion:e.target.value})}/>
          <input type="tel" className={inputCls} placeholder="+52 998 000 0000" value={emergencia.telefono} onChange={e=>setEmergencia({...emergencia,telefono:e.target.value})}/>
        </>}

        {step === 3 && <div className="glass p-4 space-y-3 text-sm">
          <p className="text-accent font-semibold">Resumen de tu carnet</p>
          <div><span className="text-gray-400">Nombre: </span>{basic.full_name}</div>
          <div><span className="text-gray-400">Sangre: </span>{basic.tipo_sangre}</div>
          <div><span className="text-gray-400">CURP: </span>{basic.curp}</div>
          <div><span className="text-gray-400">Alergias: </span>{medico.alergias || "–"}</div>
          <div><span className="text-gray-400">Contacto emergencia: </span>{emergencia.nombre} ({emergencia.relacion}) {emergencia.telefono}</div>
        </div>}
      </div>

      {/* Nav buttons */}
      <div className="flex gap-3 px-4 mt-6">
        {step > 0 && (
          <button onClick={()=>setStep(s=>s-1)} className="flex-1 glass py-3 rounded-xl text-white font-medium">
            Anterior
          </button>
        )}
        <button onClick={next} disabled={loading}
          className="flex-1 py-3 rounded-xl font-semibold text-bg transition-all"
          style={{ background: "var(--accent)" }}>
          {loading ? "Guardando..." : step === STEPS.length - 1 ? "Crear mi carnet" : "Siguiente"}
        </button>
      </div>
    </main>
  );
}
