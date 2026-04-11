import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const ADMIN_KEY = "autos";
const API = "/api/admin";

type Tab = "resumen" | "autos" | "reservas" | "avisos" | "resenas" | "socios" | "exportar";
type Modal = null | "crear-auto" | "editar-auto" | "crear-aviso";

function af<T = any>(path: string, options?: RequestInit): Promise<T> {
  return fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY, ...options?.headers },
  }).then(async r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });
}

function downloadExport(type: string) {
  fetch(`${API}/export/${type}`, { headers: { "x-admin-key": ADMIN_KEY } })
    .then(r => r.blob()).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `autospot_${type}.csv`; a.click();
      URL.revokeObjectURL(url);
    });
}

const SC: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  active: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500", label: "Activo" },
  confirmed: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500", label: "Confirmada" },
  pending: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-500", label: "Pendiente" },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500", label: "Completada" },
  cancelled: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500", label: "Cancelada" },
  approved: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500", label: "Aprobado" },
  rejected: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500", label: "Rechazado" },
  paused: { bg: "bg-gray-500/10", text: "text-gray-400", dot: "bg-gray-400", label: "Pausado" },
  rented: { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-500", label: "Rentado" },
};

function Badge({ status }: { status: string }) {
  const c = SC[status] ?? SC.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{c.label}
    </span>
  );
}

function Metric({ value, label, icon, accent = "from-gray-500/10 to-gray-500/5" }: { value: string | number; label: string; icon: string; accent?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br ${accent} p-4`}>
      <div className="flex items-start justify-between">
        <div><p className="text-2xl font-black tracking-tight">{value}</p><p className="text-[11px] font-medium text-gray-500 mt-0.5">{label}</p></div>
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-lg">{icon}</div>
      </div>
    </div>
  );
}

function Empty({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center text-3xl mb-4">{icon}</div>
      <p className="font-bold text-[15px]">{title}</p>
      <p className="text-[12px] text-gray-500 mt-1 max-w-[240px]">{desc}</p>
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">{label}</label>
      <input {...props} className={`w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-primary/50 transition-colors placeholder:text-gray-600 ${props.className ?? ""}`} />
    </div>
  );
}

function Select({ label, children, ...props }: { label: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">{label}</label>
      <select {...props} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-primary/50 transition-colors">{children}</select>
    </div>
  );
}

function Textarea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">{label}</label>
      <textarea {...props} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-primary/50 transition-colors resize-none placeholder:text-gray-600" />
    </div>
  );
}

function Btn({ children, variant = "primary", ...props }: { children: React.ReactNode; variant?: "primary" | "danger" | "ghost" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = variant === "primary"
    ? "bg-gradient-to-r from-primary to-cyan-400 text-white shadow-lg shadow-primary/20 hover:shadow-primary/20"
    : variant === "danger"
    ? "bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25"
    : "bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:bg-white/[0.08]";
  return (
    <button {...props} className={`px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all active:scale-[0.97] disabled:opacity-30 ${cls} ${props.className ?? ""}`}>
      {children}
    </button>
  );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-[#13132a] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl shadow-2xl" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

const defaultCar = {
  title: "", pricePerDay: "", depositAmount: "", city: "", address: "", lat: "19.4326", lng: "-99.1332",
  category: "economico", description: "", images: [""], features: "",
  brand: "", model: "", year: "2024", km: "0", transmission: "automatic", fuel: "gasoline", color: "", seats: "5", doors: "4",
  featured: false, instantBook: true, deliveryAvailable: false, deliveryFee: "",
  minDays: "1", maxDays: "30", mileageLimit: "300", cleaningFee: "0",
  hostName: "", hostPhone: "", hostWhatsapp: "",
};

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);
  const [tab, setTab] = useState<Tab>("resumen");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [editCar, setEditCar] = useState<any>(null);
  const [, nav] = useLocation();
  const { user } = useAuth();

  const login = () => {
    if (pw === ADMIN_KEY) { setAuth(true); setErr(""); sessionStorage.setItem("autospot-admin", "1"); }
    else { setErr("Clave incorrecta"); setShake(true); setTimeout(() => setShake(false), 600); }
  };

  useEffect(() => { if (sessionStorage.getItem("autospot-admin") === "1") setAuth(true); }, []);
  useEffect(() => { if (auth) load(); }, [auth]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await af("/dashboard")); } catch {}
    setLoading(false);
  }, []);

  const logout = () => { sessionStorage.removeItem("autospot-admin"); setAuth(false); setPw(""); nav("/explore"); };

  const deleteCar = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"?`)) return;
    await af(`/cars/${id}`, { method: "DELETE" }); load();
  };

  const carStatus = async (id: string, status: string) => { await af(`/cars/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); load(); };
  const carFeatured = async (id: string, featured: boolean) => { await af(`/cars/${id}/featured`, { method: "PATCH", body: JSON.stringify({ featured }) }); load(); };
  const bookingStatus = async (id: string, status: string) => { await af(`/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); load(); };
  const partnerStatus = async (id: string, status: string) => { await af(`/partners/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); load(); };

  if (!auth) {
    return (
      <div className="min-h-[100dvh] bg-[#0c0c1d] flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <img src="/rivones-logo-nobg.png" alt="Rivones" className="h-20 w-auto mx-auto mb-5 drop-shadow-[0_0_30px_rgba(0,212,255,0.12)]" />
            <p className="text-sm text-gray-400 mt-2">Centro de operaciones</p>
          </div>
          <div className={`space-y-4 ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
            <input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && login()}
              placeholder="Ingresa tu clave" className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-center text-lg tracking-[0.3em] font-mono text-white focus:outline-none focus:border-primary/60 transition-all placeholder:text-gray-600 placeholder:tracking-normal placeholder:font-sans" autoFocus />
            {err && <p className="text-center text-sm text-red-400 font-semibold">{err}</p>}
            <button onClick={login} className="w-full py-3.5 bg-gradient-to-r from-primary to-cyan-400 text-white font-bold rounded-2xl text-[15px] active:scale-[0.98] shadow-lg shadow-primary/20">Acceder</button>
          </div>
          <button onClick={() => nav("/explore")} className="w-full text-center text-sm text-gray-500 mt-8 hover:text-gray-300 transition-colors">← Volver</button>
        </div>
        <style>{`@keyframes shake{0%,100%{transform:translateX(0)}10%,30%,50%,70%,90%{transform:translateX(-4px)}20%,40%,60%,80%{transform:translateX(4px)}}`}</style>
      </div>
    );
  }

  const s = data?.stats;
  const TABS: { id: Tab; label: string; icon: string; count?: number }[] = [
    { id: "resumen", label: "Resumen", icon: "📊" },
    { id: "autos", label: "Autos", icon: "🚗", count: s?.totalCars },
    { id: "reservas", label: "Reservas", icon: "📅", count: s?.totalBookings },
    { id: "avisos", label: "Avisos", icon: "🔔", count: s?.unreadNotifications },
    { id: "resenas", label: "Reseñas", icon: "⭐", count: s?.totalReviews },
    { id: "socios", label: "Socios", icon: "🤝", count: s?.pendingPartners },
    { id: "exportar", label: "Exportar", icon: "📥" },
  ];

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#0c0c1d] via-[#111128] to-[#0c0c1d] text-white">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0c0c1d]/80 border-b border-white/5">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/rivones-logo-nobg.png" alt="Rivones" className="h-8 w-auto" />
            <div>
              <p className="text-[10px] text-gray-500 font-medium">Centro de operaciones</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/></svg>
            </button>
            <button onClick={logout} className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </button>
          </div>
        </div>
        <div className="flex gap-1 px-3 pb-3 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all ${tab === t.id ? "bg-gradient-to-r from-primary/20 to-cyan-400/20 text-primary border border-primary/30" : "bg-white/5 text-gray-400 border border-transparent hover:bg-white/8"}`}>
              <span className="text-[13px]">{t.icon}</span>{t.label}
              {(t.count ?? 0) > 0 && <span className={`text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-md ${tab === t.id ? "bg-primary/30 text-primary" : "bg-white/10 text-gray-500"}`}>{t.count}</span>}
            </button>
          ))}
        </div>
      </header>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      ) : (
        <div className="px-4 pt-5 pb-10">
          {tab === "resumen" && s && <ResumenTab s={s} setTab={setTab} setModal={setModal} />}
          {tab === "autos" && data && <AutosTab cars={data.cars} onDelete={deleteCar} onStatus={carStatus} onFeatured={carFeatured} setModal={setModal} setEditCar={setEditCar} />}
          {tab === "reservas" && data && <ReservasTab bookings={data.bookings} onStatus={bookingStatus} />}
          {tab === "avisos" && data && <AvisosTab notifications={data.notifications} setModal={setModal} />}
          {tab === "resenas" && data && <ResenasTab reviews={data.reviews} />}
          {tab === "socios" && data && <SociosTab partners={data.partners} onStatus={partnerStatus} />}
          {tab === "exportar" && <ExportarTab />}
        </div>
      )}

      {modal === "crear-auto" && <CrearAutoModal onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
      {modal === "editar-auto" && editCar && <EditarAutoModal car={editCar} onClose={() => { setModal(null); setEditCar(null); }} onDone={() => { setModal(null); setEditCar(null); load(); }} />}
      {modal === "crear-aviso" && <CrearAvisoModal onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
    </div>
  );
}

function ResumenTab({ s, setTab, setModal }: { s: any; setTab: (t: Tab) => void; setModal: (m: Modal) => void }) {
  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button onClick={() => setModal("crear-auto")} className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-white text-[12px] font-bold shadow-lg shadow-primary/20 active:scale-[0.97]">
          <span className="text-base">+</span> Agregar auto
        </button>
        <button onClick={() => setModal("crear-aviso")} className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-[12px] font-bold active:scale-[0.97]">
          <span className="text-base">🔔</span> Enviar aviso
        </button>
        <button onClick={() => downloadExport("all")} className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-[12px] font-bold active:scale-[0.97]">
          <span className="text-base">📥</span> Exportar todo
        </button>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3">Flota</p>
        <div className="grid grid-cols-3 gap-2.5">
          <Metric value={s.totalCars} label="Total" icon="🚗" accent="from-blue-500/10 to-blue-500/5" />
          <Metric value={s.activeCars} label="Activos" icon="✅" accent="from-emerald-500/10 to-emerald-500/5" />
          <Metric value={s.featuredCars} label="Destacados" icon="⭐" accent="from-amber-500/10 to-amber-500/5" />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3">Reservas</p>
        <div className="grid grid-cols-3 gap-2.5">
          <Metric value={s.totalBookings} label="Totales" icon="📅" accent="from-violet-500/10 to-violet-500/5" />
          <Metric value={s.pendingBookings} label="Pendientes" icon="⏳" accent="from-amber-500/10 to-amber-500/5" />
          <Metric value={s.completedBookings} label="Completadas" icon="✔️" accent="from-emerald-500/10 to-emerald-500/5" />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3">Finanzas</p>
        <div className="grid grid-cols-2 gap-2.5">
          <Metric value={`$${(s.totalRevenue ?? 0).toLocaleString("es-MX")}`} label="Ingresos MXN" icon="💰" accent="from-emerald-500/15 to-emerald-500/5" />
          <Metric value={s.avgRating > 0 ? Number(s.avgRating).toFixed(1) : "—"} label="Rating promedio" icon="⭐" accent="from-amber-500/15 to-amber-500/5" />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3">Actividad</p>
        <div className="grid grid-cols-2 gap-2.5">
          <Metric value={s.unreadNotifications} label="Avisos sin leer" icon="🔔" accent="from-primary/10 to-primary/5" />
          <Metric value={s.pendingPartners} label="Socios pendientes" icon="🤝" accent="from-violet-500/10 to-violet-500/5" />
        </div>
      </div>

      {s.byCity && Object.keys(s.byCity).length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3">Distribución</p>
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden">
            {Object.entries(s.byCity).map(([city, count]: any, i: number) => {
              const max = Math.max(...Object.values(s.byCity) as number[]);
              return (
                <div key={city} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-white/5" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate">{city}</p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400" style={{ width: `${max > 0 ? (count as number / max) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <span className="text-[15px] font-black text-primary">{count as number}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AutosTab({ cars, onDelete, onStatus, onFeatured, setModal, setEditCar }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-bold">Autos</h3>
          <span className="text-[11px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">{cars.length}</span>
        </div>
        <button onClick={() => setModal("crear-auto")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-white text-[12px] font-bold shadow-lg shadow-primary/20 active:scale-[0.97]">
          <span className="text-sm">+</span> Agregar
        </button>
      </div>

      {cars.length === 0 ? (
        <Empty icon="🚗" title="Sin autos" desc="Agrega tu primer auto para empezar a recibir reservas" />
      ) : (
        cars.map((car: any) => (
          <div key={car.id} className="rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden">
            <div className="flex">
              <div className="w-[100px] h-[90px] bg-white/5 shrink-0 overflow-hidden">
                {car.images?.[0] ? <img src={car.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🚗</div>}
              </div>
              <div className="flex-1 p-3 min-w-0">
                <h3 className="font-bold text-[13px] leading-tight line-clamp-1">{car.title}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">{car.city} · <span className="capitalize">{car.category}</span></p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-primary font-black text-[14px]">${Number(car.pricePerDay).toLocaleString("es-MX")}<span className="text-[10px] font-medium text-gray-500">/día</span></span>
                  <Badge status={car.status} />
                </div>
              </div>
            </div>
            <div className="flex items-center border-t border-white/5 text-[11px]">
              <button onClick={() => { setEditCar(car); setModal("editar-auto"); }} className="flex-1 py-2.5 text-center text-blue-400 font-semibold border-r border-white/5 hover:bg-white/[0.03]">Editar</button>
              <button onClick={() => onFeatured(car.id, !car.featured)} className={`flex-1 py-2.5 text-center font-semibold border-r border-white/5 hover:bg-white/[0.03] ${car.featured ? "text-amber-400" : "text-gray-500"}`}>
                {car.featured ? "★ Destacado" : "☆ Destacar"}
              </button>
              <select value={car.status} onChange={e => onStatus(car.id, e.target.value)} className="flex-1 bg-transparent text-center py-2.5 px-2 outline-none cursor-pointer text-gray-400 font-semibold border-r border-white/5">
                <option value="active">Activo</option><option value="paused">Pausado</option><option value="rented">Rentado</option>
              </select>
              <button onClick={() => onDelete(car.id, car.title)} className="px-3 py-2.5 text-red-400 font-semibold hover:bg-red-500/10">Eliminar</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ReservasTab({ bookings, onStatus }: { bookings: any[]; onStatus: (id: string, status: string) => void }) {
  const sorted = useMemo(() => [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [bookings]);
  return (
    <div className="space-y-4">
      <h3 className="text-[15px] font-bold flex items-center gap-2">Reservas <span className="text-[11px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">{bookings.length}</span></h3>
      {sorted.length === 0 ? <Empty icon="📅" title="Sin reservas" desc="Las reservas aparecerán aquí" /> : sorted.map((b: any) => (
        <div key={b.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div><p className="font-bold text-[14px]">{b.renterName || "Sin nombre"}</p><p className="text-[11px] text-gray-500 mt-0.5">{b.renterPhone} · {b.renterEmail}</p></div>
            <Badge status={b.status} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            {[["Auto", `#${b.carId}`], ["Días", b.days], ["Inicio", b.startDate], ["Fin", b.endDate]].map(([l, v]) => (
              <div key={l as string} className="flex justify-between bg-white/[0.02] rounded-lg px-3 py-1.5"><span className="text-gray-500">{l}</span><span className="font-semibold">{v}</span></div>
            ))}
            <div className="flex justify-between bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-1.5"><span className="text-gray-500">Total</span><span className="font-black text-emerald-400">${Number(b.totalAmount).toLocaleString("es-MX")}</span></div>
            <div className="flex justify-between bg-white/[0.02] rounded-lg px-3 py-1.5"><span className="text-gray-500">Seguro</span><span className="font-semibold">{b.insuranceAdded ? "✓ Sí" : "No"}</span></div>
          </div>
          {b.notes && <p className="text-[11px] text-gray-400 italic bg-white/[0.02] rounded-lg px-3 py-2">"{b.notes}"</p>}
          <div className="flex gap-2 pt-1">
            {b.status === "pending" && (<><Btn onClick={() => onStatus(b.id, "confirmed")} className="flex-1">Confirmar</Btn><Btn variant="danger" onClick={() => onStatus(b.id, "cancelled")} className="flex-1">Cancelar</Btn></>)}
            {b.status === "confirmed" && (<><Btn onClick={() => onStatus(b.id, "active")} className="flex-1">Activar</Btn><Btn variant="danger" onClick={() => onStatus(b.id, "cancelled")} className="flex-1">Cancelar</Btn></>)}
            {b.status === "active" && <Btn onClick={() => onStatus(b.id, "completed")} className="flex-1">Completar</Btn>}
          </div>
        </div>
      ))}
    </div>
  );
}

function AvisosTab({ notifications, setModal }: { notifications: any[]; setModal: (m: Modal) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[15px] font-bold flex items-center gap-2">Avisos <span className="text-[11px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">{notifications.length}</span></h3>
        <button onClick={() => setModal("crear-aviso")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-white text-[12px] font-bold shadow-lg shadow-primary/20 active:scale-[0.97]">
          <span className="text-sm">+</span> Nuevo aviso
        </button>
      </div>
      {notifications.length === 0 ? <Empty icon="🔔" title="Sin avisos" desc="Envía tu primer aviso" /> : notifications.map((n: any) => (
        <div key={n.id} className={`rounded-2xl border p-4 ${n.read ? "border-white/5 bg-white/[0.02]" : "border-primary/20 bg-primary/[0.03]"}`}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-gray-500 bg-white/5 px-2 py-0.5 rounded">{n.type}</span>
            {!n.read && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
          </div>
          <p className="font-bold text-[13px] mt-1.5">{n.title}</p>
          <p className="text-[12px] text-gray-400 mt-1">{n.message}</p>
          <p className="text-[10px] text-gray-600 mt-3">{new Date(n.createdAt).toLocaleString("es-MX")}</p>
        </div>
      ))}
    </div>
  );
}

function ResenasTab({ reviews }: { reviews: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-[15px] font-bold flex items-center gap-2">Reseñas <span className="text-[11px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">{reviews.length}</span></h3>
      {reviews.length === 0 ? <Empty icon="⭐" title="Sin reseñas" desc="Aparecerán después de cada viaje" /> : reviews.map((r: any) => (
        <div key={r.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
          <div className="flex items-start justify-between">
            <div><p className="font-bold text-[13px]">{r.reviewerName || "Anónimo"}</p><p className="text-[11px] text-gray-500">Auto #{r.carId} · {r.tripCity} · {r.tripDays}d</p></div>
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg"><span className="text-amber-400 text-[12px]">★</span><span className="text-[13px] font-black text-amber-400">{r.rating}</span></div>
          </div>
          {r.comment && <p className="text-[12px] text-gray-300 mt-3 leading-relaxed">{r.comment}</p>}
          <p className="text-[10px] text-gray-600 mt-3">{new Date(r.createdAt).toLocaleString("es-MX")}</p>
        </div>
      ))}
    </div>
  );
}

function SociosTab({ partners, onStatus }: { partners: any[]; onStatus: (id: string, s: string) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-[15px] font-bold flex items-center gap-2">Socios <span className="text-[11px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">{partners.length}</span></h3>
      {partners.length === 0 ? <Empty icon="🤝" title="Sin socios" desc="Los negocios afiliados aparecerán aquí" /> : partners.map((p: any) => (
        <div key={p.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-start justify-between"><div><p className="font-bold text-[14px]">{p.businessName}</p><p className="text-[11px] text-gray-500">{p.category} · {p.city}, {p.state}</p></div><Badge status={p.status} /></div>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            {[["Dueño", p.ownerName], ["Tel", p.phone], ["Descuento", `${p.discountPercent}%`], ["Fee", p.adFeePaid ? "✓ Pagado" : "Pendiente"]].map(([l, v]) => (
              <div key={l as string} className="flex justify-between bg-white/[0.02] rounded-lg px-3 py-1.5"><span className="text-gray-500">{l}</span><span className="font-semibold">{v}</span></div>
            ))}
          </div>
          {p.status === "pending" && <div className="flex gap-2"><Btn onClick={() => onStatus(p.id, "approved")} className="flex-1">Aprobar</Btn><Btn variant="danger" onClick={() => onStatus(p.id, "rejected")} className="flex-1">Rechazar</Btn></div>}
        </div>
      ))}
    </div>
  );
}

function ExportarTab() {
  const items = [
    { type: "all", label: "Expediente completo", desc: "Todo en un CSV", icon: "📋", accent: "from-primary/15 to-cyan-400/10 border-primary/20" },
    { type: "cars", label: "Inventario de autos", desc: "Vehículos con detalles", icon: "🚗", accent: "from-blue-500/10 to-blue-500/5 border-blue-500/15" },
    { type: "bookings", label: "Reservas", desc: "Historial completo", icon: "📅", accent: "from-violet-500/10 to-violet-500/5 border-violet-500/15" },
    { type: "reviews", label: "Reseñas", desc: "Opiniones y ratings", icon: "⭐", accent: "from-amber-500/10 to-amber-500/5 border-amber-500/15" },
    { type: "partners", label: "Socios", desc: "Guía Rivones", icon: "🤝", accent: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/15" },
    { type: "notifications", label: "Avisos", desc: "Notificaciones", icon: "🔔", accent: "from-orange-500/10 to-orange-500/5 border-orange-500/15" },
  ];
  return (
    <div className="space-y-3">
      <h3 className="text-[15px] font-bold mb-2">Exportar datos</h3>
      {items.map(e => (
        <button key={e.type} onClick={() => downloadExport(e.type)} className={`w-full rounded-2xl border bg-gradient-to-br p-4 flex items-center gap-4 text-left active:scale-[0.98] hover:brightness-125 ${e.accent}`}>
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl shrink-0">{e.icon}</div>
          <div className="flex-1"><p className="font-bold text-[13px]">{e.label}</p><p className="text-[11px] text-gray-500">{e.desc}</p></div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        </button>
      ))}
    </div>
  );
}

function CrearAutoModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ ...defaultCar });
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.title || !f.pricePerDay || !f.city) return alert("Completa título, precio y ciudad");
    setSaving(true);
    try {
      await af("/cars", {
        method: "POST",
        body: JSON.stringify({
          title: f.title, pricePerDay: Number(f.pricePerDay), depositAmount: Number(f.depositAmount || 0),
          city: f.city, address: f.address, lat: f.lat, lng: f.lng, category: f.category,
          description: f.description, images: f.images.filter(Boolean),
          features: f.features.split(",").map((s: string) => s.trim()).filter(Boolean),
          specs: { brand: f.brand, model: f.model, year: Number(f.year), km: Number(f.km), transmission: f.transmission, fuel: f.fuel, color: f.color, seats: Number(f.seats), doors: Number(f.doors) },
          featured: f.featured, instantBook: f.instantBook, deliveryAvailable: f.deliveryAvailable,
          deliveryFee: f.deliveryFee ? Number(f.deliveryFee) : null,
          minDays: Number(f.minDays), maxDays: Number(f.maxDays), mileageLimit: Number(f.mileageLimit), cleaningFee: Number(f.cleaningFee),
          host: { id: "admin", name: f.hostName || "Rivones", phone: f.hostPhone || "", whatsapp: f.hostWhatsapp || "" },
        }),
      });
      onDone();
    } catch { alert("Error al crear"); }
    setSaving(false);
  };

  const steps = ["Básico", "Detalles", "Anfitrión", "Fotos"];

  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black">Agregar auto</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="flex gap-1 mb-5">
          {steps.map((s, i) => (
            <button key={s} onClick={() => setStep(i)} className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${step === i ? "bg-primary/20 text-primary" : "bg-white/5 text-gray-500"}`}>{s}</button>
          ))}
        </div>

        <div className="space-y-3">
          {step === 0 && (<>
            <Input label="Título del auto" placeholder="Ej: Toyota Corolla 2024" value={f.title} onChange={e => set("title", e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Precio/día (MXN)" type="number" placeholder="850" value={f.pricePerDay} onChange={e => set("pricePerDay", e.target.value)} />
              <Input label="Depósito (MXN)" type="number" placeholder="3000" value={f.depositAmount} onChange={e => set("depositAmount", e.target.value)} />
            </div>
            <Input label="Ciudad" placeholder="Ciudad de México" value={f.city} onChange={e => set("city", e.target.value)} />
            <Input label="Dirección" placeholder="Condesa, CDMX" value={f.address} onChange={e => set("address", e.target.value)} />
            <Select label="Categoría" value={f.category} onChange={e => set("category", e.target.value)}>
              <option value="economico">Económico</option><option value="suv">SUV</option><option value="lujo">Lujo</option>
              <option value="deportivo">Deportivo</option><option value="electrico">Eléctrico</option><option value="van">Van</option><option value="trabajo">Trabajo</option>
            </Select>
            <Textarea label="Descripción" rows={3} placeholder="Describe el auto..." value={f.description} onChange={e => set("description", e.target.value)} />
          </>)}

          {step === 1 && (<>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Marca" placeholder="Toyota" value={f.brand} onChange={e => set("brand", e.target.value)} />
              <Input label="Modelo" placeholder="Corolla" value={f.model} onChange={e => set("model", e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Año" type="number" value={f.year} onChange={e => set("year", e.target.value)} />
              <Input label="Km" type="number" value={f.km} onChange={e => set("km", e.target.value)} />
              <Input label="Color" value={f.color} onChange={e => set("color", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Transmisión" value={f.transmission} onChange={e => set("transmission", e.target.value)}>
                <option value="automatic">Automática</option><option value="manual">Manual</option><option value="cvt">CVT</option>
              </Select>
              <Select label="Combustible" value={f.fuel} onChange={e => set("fuel", e.target.value)}>
                <option value="gasoline">Gasolina</option><option value="diesel">Diésel</option><option value="hybrid">Híbrido</option><option value="electric">Eléctrico</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Asientos" type="number" value={f.seats} onChange={e => set("seats", e.target.value)} />
              <Input label="Puertas" type="number" value={f.doors} onChange={e => set("doors", e.target.value)} />
            </div>
            <Input label="Características (separadas por coma)" placeholder="GPS, Bluetooth, CarPlay, Cámara" value={f.features} onChange={e => set("features", e.target.value)} />
            <div className="grid grid-cols-3 gap-3">
              <Input label="Días mín" type="number" value={f.minDays} onChange={e => set("minDays", e.target.value)} />
              <Input label="Días máx" type="number" value={f.maxDays} onChange={e => set("maxDays", e.target.value)} />
              <Input label="Km límite" type="number" value={f.mileageLimit} onChange={e => set("mileageLimit", e.target.value)} />
            </div>
            <Input label="Limpieza (MXN)" type="number" value={f.cleaningFee} onChange={e => set("cleaningFee", e.target.value)} />
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 text-[12px] font-semibold text-gray-300 cursor-pointer">
                <input type="checkbox" checked={f.featured} onChange={e => set("featured", e.target.checked)} className="accent-primary w-4 h-4" /> Destacado
              </label>
              <label className="flex items-center gap-2 text-[12px] font-semibold text-gray-300 cursor-pointer">
                <input type="checkbox" checked={f.instantBook} onChange={e => set("instantBook", e.target.checked)} className="accent-primary w-4 h-4" /> Reserva instantánea
              </label>
            </div>
          </>)}

          {step === 2 && (<>
            <Input label="Nombre del anfitrión" placeholder="Carlos Mendoza" value={f.hostName} onChange={e => set("hostName", e.target.value)} />
            <Input label="Teléfono" placeholder="+52 55 1234 5678" value={f.hostPhone} onChange={e => set("hostPhone", e.target.value)} />
            <Input label="WhatsApp" placeholder="+52 55 1234 5678" value={f.hostWhatsapp} onChange={e => set("hostWhatsapp", e.target.value)} />
            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-2 text-[12px] font-semibold text-gray-300 cursor-pointer">
                <input type="checkbox" checked={f.deliveryAvailable} onChange={e => set("deliveryAvailable", e.target.checked)} className="accent-primary w-4 h-4" /> Entrega disponible
              </label>
            </div>
            {f.deliveryAvailable && <Input label="Costo de entrega (MXN)" type="number" value={f.deliveryFee} onChange={e => set("deliveryFee", e.target.value)} />}
          </>)}

          {step === 3 && (<>
            <p className="text-[11px] text-gray-500 mb-2">Agrega URLs de imágenes del auto (Unsplash, Google Drive público, etc.)</p>
            {f.images.map((img: string, i: number) => (
              <div key={i} className="flex gap-2">
                <input value={img} onChange={e => { const imgs = [...f.images]; imgs[i] = e.target.value; set("images", imgs); }}
                  placeholder={`URL de imagen ${i + 1}`} className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none placeholder:text-gray-600" />
                {f.images.length > 1 && <button onClick={() => set("images", f.images.filter((_: any, j: number) => j !== i))} className="px-2 text-red-400 text-sm">✕</button>}
              </div>
            ))}
            <button onClick={() => set("images", [...f.images, ""])} className="text-[12px] text-primary font-semibold">+ Agregar otra imagen</button>
            {f.images[0] && (
              <div className="mt-2 rounded-xl overflow-hidden h-40 bg-white/5">
                <img src={f.images[0]} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
              </div>
            )}
          </>)}
        </div>

        <div className="flex gap-2 mt-6">
          {step > 0 && <Btn variant="ghost" onClick={() => setStep(step - 1)} className="flex-1">Anterior</Btn>}
          {step < 3 ? (
            <Btn onClick={() => setStep(step + 1)} className="flex-1">Siguiente</Btn>
          ) : (
            <Btn onClick={save} disabled={saving} className="flex-1">{saving ? "Guardando..." : "Publicar auto"}</Btn>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}

function EditarAutoModal({ car, onClose, onDone }: { car: any; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({
    title: car.title ?? "", pricePerDay: String(car.pricePerDay ?? ""), depositAmount: String(car.depositAmount ?? ""),
    city: car.city ?? "", address: car.address ?? "", category: car.category ?? "economico",
    description: car.description ?? "", images: car.images?.length ? car.images : [""],
    features: (car.features ?? []).join(", "), featured: car.featured ?? false, instantBook: car.instantBook ?? true,
    brand: car.specs?.brand ?? "", model: car.specs?.model ?? "", year: String(car.specs?.year ?? 2024), km: String(car.specs?.km ?? 0),
    color: car.specs?.color ?? "", transmission: car.specs?.transmission ?? "automatic", fuel: car.specs?.fuel ?? "gasoline",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await af(`/cars/${car.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: f.title, pricePerDay: Number(f.pricePerDay), depositAmount: Number(f.depositAmount || 0),
          city: f.city, address: f.address, category: f.category, description: f.description,
          images: f.images.filter(Boolean),
          features: f.features.split(",").map((s: string) => s.trim()).filter(Boolean),
          specs: { brand: f.brand, model: f.model, year: Number(f.year), km: Number(f.km), transmission: f.transmission, fuel: f.fuel, color: f.color },
          featured: f.featured, instantBook: f.instantBook,
        }),
      });
      onDone();
    } catch { alert("Error al guardar"); }
    setSaving(false);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black">Editar auto</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">✕</button>
        </div>
        <Input label="Título" value={f.title} onChange={e => set("title", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Precio/día" type="number" value={f.pricePerDay} onChange={e => set("pricePerDay", e.target.value)} />
          <Input label="Depósito" type="number" value={f.depositAmount} onChange={e => set("depositAmount", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Ciudad" value={f.city} onChange={e => set("city", e.target.value)} />
          <Select label="Categoría" value={f.category} onChange={e => set("category", e.target.value)}>
            <option value="economico">Económico</option><option value="suv">SUV</option><option value="lujo">Lujo</option>
            <option value="deportivo">Deportivo</option><option value="electrico">Eléctrico</option><option value="van">Van</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Marca" value={f.brand} onChange={e => set("brand", e.target.value)} />
          <Input label="Modelo" value={f.model} onChange={e => set("model", e.target.value)} />
        </div>
        <Textarea label="Descripción" rows={3} value={f.description} onChange={e => set("description", e.target.value)} />
        <Input label="Características" value={f.features} onChange={e => set("features", e.target.value)} />
        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Imágenes</label>
          {f.images.map((img: string, i: number) => (
            <div key={i} className="flex gap-2 mb-2">
              <input value={img} onChange={e => { const imgs = [...f.images]; imgs[i] = e.target.value; set("images", imgs); }}
                placeholder={`URL ${i + 1}`} className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none placeholder:text-gray-600" />
              {f.images.length > 1 && <button onClick={() => set("images", f.images.filter((_: any, j: number) => j !== i))} className="px-2 text-red-400">✕</button>}
            </div>
          ))}
          <button onClick={() => set("images", [...f.images, ""])} className="text-[12px] text-primary font-semibold">+ Otra imagen</button>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-[12px] font-semibold text-gray-300 cursor-pointer">
            <input type="checkbox" checked={f.featured} onChange={e => set("featured", e.target.checked)} className="accent-primary w-4 h-4" /> Destacado
          </label>
          <label className="flex items-center gap-2 text-[12px] font-semibold text-gray-300 cursor-pointer">
            <input type="checkbox" checked={f.instantBook} onChange={e => set("instantBook", e.target.checked)} className="accent-primary w-4 h-4" /> Reserva instantánea
          </label>
        </div>
        <div className="flex gap-2 pt-2">
          <Btn variant="ghost" onClick={onClose} className="flex-1">Cancelar</Btn>
          <Btn onClick={save} disabled={saving} className="flex-1">{saving ? "Guardando..." : "Guardar cambios"}</Btn>
        </div>
      </div>
    </ModalOverlay>
  );
}

function CrearAvisoModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [type, setType] = useState("system");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title || !message) return;
    setSaving(true);
    try { await af("/notifications", { method: "POST", body: JSON.stringify({ type, title, message }) }); onDone(); }
    catch { alert("Error"); }
    setSaving(false);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-black">Nuevo aviso</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">✕</button>
        </div>
        <Select label="Tipo" value={type} onChange={e => setType(e.target.value)}>
          <option value="system">Sistema</option><option value="promo">Promoción</option><option value="booking">Reserva</option><option value="alert">Alerta</option>
        </Select>
        <Input label="Título" placeholder="Título del aviso" value={title} onChange={e => setTitle(e.target.value)} />
        <Textarea label="Mensaje" rows={4} placeholder="Escribe el mensaje..." value={message} onChange={e => setMessage(e.target.value)} />
        <div className="flex gap-2 pt-1">
          <Btn variant="ghost" onClick={onClose} className="flex-1">Cancelar</Btn>
          <Btn onClick={save} disabled={saving || !title || !message} className="flex-1">{saving ? "Enviando..." : "Enviar aviso"}</Btn>
        </div>
      </div>
    </ModalOverlay>
  );
}
