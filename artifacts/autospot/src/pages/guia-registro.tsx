import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { BottomNav } from "@/components/layout/BottomNav";
import { apiFetch } from "@/lib/api";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

const CATEGORIES = [
  { id: "restaurante", label: "Restaurante" },
  { id: "hotel", label: "Hotel" },
  { id: "gasolinera", label: "Gasolinera" },
  { id: "atraccion", label: "Atracción turística" },
  { id: "taller", label: "Taller mecánico" },
  { id: "tienda", label: "Tienda / Comercio" },
  { id: "otro", label: "Otro" },
];

const STATES_MX = [
  "Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas","Chihuahua",
  "Ciudad de México","Coahuila","Colima","Durango","Estado de México","Guanajuato","Guerrero",
  "Hidalgo","Jalisco","Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla",
  "Querétaro","Quintana Roo","San Luis Potosí","Sinaloa","Sonora","Tabasco","Tamaulipas",
  "Tlaxcala","Veracruz","Yucatán","Zacatecas",
];

function useGoogleMaps(apiKey: string | undefined) {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (!apiKey) return;
    if ((window as any).google?.maps) { setIsLoaded(true); return; }
    (window as any).initGoogleMap = () => setIsLoaded(true);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, [apiKey]);
  return isLoaded;
}

function LocationPicker({ lat, lng, onLocationChange }: {
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const isLoaded = useGoogleMaps(GOOGLE_MAPS_API_KEY);

  const updateMarker = useCallback((position: { lat: number; lng: number }) => {
    const g = (window as any).google;
    if (!g || !mapInstanceRef.current) return;

    if (markerRef.current) {
      markerRef.current.setPosition(position);
    } else {
      markerRef.current = new g.maps.Marker({
        position,
        map: mapInstanceRef.current,
        draggable: true,
        animation: g.maps.Animation.DROP,
      });
      markerRef.current.addListener("dragend", () => {
        const pos = markerRef.current.getPosition();
        const newLat = pos.lat();
        const newLng = pos.lng();
        reverseGeocode(newLat, newLng);
      });
    }
    mapInstanceRef.current.panTo(position);
    mapInstanceRef.current.setZoom(16);
  }, []);

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    const g = (window as any).google;
    if (!g) { onLocationChange(lat, lng, ""); return; }
    const geocoder = new g.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
      const addr = status === "OK" && results[0] ? results[0].formatted_address : "";
      onLocationChange(lat, lng, addr);
    });
  }, [onLocationChange]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;
    const g = (window as any).google;
    const center = lat && lng ? { lat, lng } : { lat: 23.6345, lng: -102.5528 };
    mapInstanceRef.current = new g.maps.Map(mapRef.current, {
      center,
      zoom: lat ? 16 : 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      ],
    });
    if (lat && lng) updateMarker({ lat, lng });

    mapInstanceRef.current.addListener("click", (e: any) => {
      const clickLat = e.latLng.lat();
      const clickLng = e.latLng.lng();
      updateMarker({ lat: clickLat, lng: clickLng });
      reverseGeocode(clickLat, clickLng);
    });
  }, [isLoaded, lat, lng, updateMarker, reverseGeocode]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        updateMarker({ lat: newLat, lng: newLng });
        reverseGeocode(newLat, newLng);
        setLocating(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? "Permiso de ubicación denegado. Actívalo en la configuración de tu navegador."
            : "No pudimos obtener tu ubicación. Intenta de nuevo."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={requestLocation}
          disabled={locating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg active:scale-[0.97] transition-all disabled:opacity-50"
        >
          {locating ? (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <circle cx="12" cy="12" r="8" strokeDasharray="4 2" />
            </svg>
          )}
          {locating ? "Obteniendo GPS..." : "Usar mi ubicación"}
        </button>
        <span className="text-xs text-muted-foreground">o toca el mapa</span>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      <div ref={mapRef} className="w-full h-52 rounded-2xl border border-border overflow-hidden bg-secondary" />

      {lat && lng && (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600 shrink-0">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            Ubicación confirmada: {lat.toFixed(4)}, {lng.toFixed(4)}
          </p>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Arrastra el marcador para ajustar la ubicación exacta de tu establecimiento.
      </p>
    </div>
  );
}

interface FormData {
  businessName: string;
  category: string;
  description: string;
  address: string;
  city: string;
  state: string;
  googleMapsUrl: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  discountPercent: number;
  discountDescription: string;
  complementarios: string;
  images: string[];
}

const initialForm: FormData = {
  businessName: "", category: "restaurante", description: "",
  address: "", city: "", state: "", googleMapsUrl: "",
  lat: null, lng: null, phone: "", whatsapp: "", email: "", website: "",
  ownerName: "", ownerPhone: "", ownerEmail: "",
  discountPercent: 10, discountDescription: "", complementarios: "", images: [],
};

function InputField({ label, required, ...props }: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground mb-1.5 block">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <input
        {...props}
        className="w-full h-11 px-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
      />
    </div>
  );
}

function TextAreaField({ label, required, ...props }: { label: string; required?: boolean } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground mb-1.5 block">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <textarea
        {...props}
        className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
      />
    </div>
  );
}

export default function GuiaRegistro() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<FormData>(initialForm);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const update = (field: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (lat: number, lng: number, address: string) => {
    setForm(prev => ({
      ...prev,
      lat, lng,
      address: address || prev.address,
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/partners", {
        method: "POST",
        body: JSON.stringify({
          businessName: form.businessName,
          category: form.category,
          description: form.description,
          address: form.address,
          city: form.city,
          state: form.state,
          googleMapsUrl: form.googleMapsUrl || null,
          lat: form.lat,
          lng: form.lng,
          phone: form.phone,
          whatsapp: form.whatsapp || form.phone,
          email: form.email,
          website: form.website || null,
          ownerName: form.ownerName,
          ownerPhone: form.ownerPhone,
          ownerEmail: form.ownerEmail,
          discountPercent: form.discountPercent,
          discountDescription: form.discountDescription || null,
          complementarios: form.complementarios || null,
          images: form.images,
        }),
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Error al enviar. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedStep0 = form.businessName && form.category && form.description;
  const canProceedStep1 = form.address && form.city && form.state && form.lat && form.lng;
  const canProceedStep2 = form.phone && form.discountPercent > 0;
  const canProceedStep3 = form.ownerName && form.ownerPhone && form.ownerEmail;

  if (submitted) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/25">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-foreground text-center">¡Solicitud enviada!</h1>
        <p className="text-sm text-muted-foreground text-center mt-3 max-w-xs leading-relaxed">
          Tu establecimiento está en revisión. Te notificaremos por correo cuando sea aprobado. El proceso toma de 24 a 48 horas.
        </p>
        <div className="bg-card border border-border rounded-2xl p-4 mt-6 w-full max-w-xs">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Negocio</span>
              <span className="font-semibold text-foreground">{form.businessName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Descuento</span>
              <span className="font-semibold text-emerald-600">{form.discountPercent}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cuota publicidad</span>
              <span className="font-semibold text-foreground">$20 USD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee por conversión</span>
              <span className="font-semibold text-foreground">5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado</span>
              <span className="font-semibold text-amber-500">En revisión</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6 w-full max-w-xs">
          <Link href="/guia" className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-rose-400 text-white text-sm font-bold flex items-center justify-center shadow-md active:scale-[0.97] transition-all">
            Ver Guía
          </Link>
          <Link href="/explore" className="flex-1 h-12 rounded-xl border border-border bg-card text-sm font-bold text-foreground flex items-center justify-center active:scale-[0.97] transition-all">
            Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-28">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 70%, rgba(244,63,94,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(251,191,36,0.3) 0%, transparent 50%)" }} />
        <div className="relative z-10 px-5 pt-14 pb-6">
          <Link href="/guia" className="inline-flex items-center gap-1.5 text-white/60 text-xs font-medium mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver a la Guía
          </Link>
          <h1 className="text-white font-black text-[22px] leading-tight">
            Registra tu<br />establecimiento
          </h1>
          <p className="text-white/50 text-xs mt-2 leading-relaxed max-w-xs">
            Únete a la red de negocios afiliados de Rivones y llega a miles de viajeros que rentan autos en México.
          </p>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-20 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            {[0, 1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s < step ? "bg-emerald-500 text-white" :
                  s === step ? "bg-gradient-to-r from-primary to-rose-400 text-white shadow-md" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {s < step ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : s + 1}
                </div>
                {s < 3 && <div className={`flex-1 h-0.5 rounded-full mx-1 ${s < step ? "bg-emerald-500" : "bg-border"}`} />}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {["Datos del negocio", "Ubicación", "Descuento y contacto", "Datos del propietario"][step]}
          </p>
        </div>
      </div>

      <div className="px-4">
        {step === 0 && (
          <div className="space-y-4">
            <InputField label="Nombre del establecimiento" required value={form.businessName} onChange={e => update("businessName", e.target.value)} placeholder="Ej: La Capital Steakhouse" />
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Categoría <span className="text-primary">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => update("category", c.id)}
                    className={`h-11 rounded-xl text-xs font-semibold transition-all border ${
                      form.category === c.id
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-card border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <TextAreaField label="Descripción del negocio" required value={form.description} onChange={e => update("description", e.target.value)} placeholder="Describe tu negocio, lo que ofreces, tu especialidad..." rows={4} />
            <InputField label="Sitio web (opcional)" value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://www.tunegocio.com" />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Ubicación en el mapa <span className="text-primary">*</span></label>
              <p className="text-[11px] text-muted-foreground mb-3">Toca "Usar mi ubicación" para obtener tu GPS o toca el mapa directamente. Tu negocio debe estar registrado en Google Maps.</p>
              <LocationPicker lat={form.lat} lng={form.lng} onLocationChange={handleLocationChange} />
            </div>
            <InputField label="Dirección completa" required value={form.address} onChange={e => update("address", e.target.value)} placeholder="Calle, número, colonia" />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Ciudad" required value={form.city} onChange={e => update("city", e.target.value)} placeholder="Ej: Cancún" />
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Estado <span className="text-primary">*</span></label>
                <select
                  value={form.state}
                  onChange={e => update("state", e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  <option value="">Selecciona</option>
                  {STATES_MX.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <InputField label="Link de Google Maps (opcional)" value={form.googleMapsUrl} onChange={e => update("googleMapsUrl", e.target.value)} placeholder="https://maps.google.com/..." />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <InputField label="Teléfono del negocio" required value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+52 999 123 4567" type="tel" />
            <InputField label="WhatsApp (si es diferente)" value={form.whatsapp} onChange={e => update("whatsapp", e.target.value)} placeholder="+52 999 123 4567" type="tel" />
            <InputField label="Correo electrónico del negocio" value={form.email} onChange={e => update("email", e.target.value)} placeholder="contacto@tunegocio.com" type="email" />

            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="text-sm font-bold text-foreground mb-3">Descuento para usuarios Rivones</h3>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Porcentaje de descuento <span className="text-primary">*</span></label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={5}
                      max={50}
                      step={5}
                      value={form.discountPercent}
                      onChange={e => update("discountPercent", parseInt(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <div className="bg-emerald-500/10 text-emerald-600 rounded-lg px-3 py-1.5 border border-emerald-200 dark:border-emerald-800 min-w-[60px] text-center">
                      <span className="text-sm font-black">{form.discountPercent}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <TextAreaField label="Describe el descuento" value={form.discountDescription} onChange={e => update("discountDescription", e.target.value)} placeholder="Ej: 15% de descuento en consumo total presentando QR de Rivones" rows={2} />
            </div>

            <TextAreaField label="Servicios complementarios (opcional)" value={form.complementarios} onChange={e => update("complementarios", e.target.value)} placeholder="Ej: Estacionamiento gratuito, Wi-Fi, puntos de carga eléctrica..." rows={2} />

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-foreground mb-2">Costos del programa</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Cuota de publicidad</span>
                  <span className="font-bold text-foreground">$20 USD / mes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Fee por cada conversión</span>
                  <span className="font-bold text-foreground">5% del consumo</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                La cuota de publicidad se cobra mensualmente. El fee de conversión se aplica solo cuando un usuario Rivones consume en tu establecimiento usando su código de descuento.
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-2">
              <div className="flex items-start gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 shrink-0 mt-0.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  Estos datos son confidenciales y solo se usan para la verificación y comunicación con Rivones. No se muestran públicamente.
                </p>
              </div>
            </div>
            <InputField label="Nombre completo del propietario" required value={form.ownerName} onChange={e => update("ownerName", e.target.value)} placeholder="Nombre y apellidos" />
            <InputField label="Teléfono del propietario" required value={form.ownerPhone} onChange={e => update("ownerPhone", e.target.value)} placeholder="+52 999 123 4567" type="tel" />
            <InputField label="Correo del propietario" required value={form.ownerEmail} onChange={e => update("ownerEmail", e.target.value)} placeholder="propietario@email.com" type="email" />

            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="text-sm font-bold text-foreground mb-3">Resumen de tu solicitud</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Negocio</span><span className="font-semibold text-foreground truncate ml-4">{form.businessName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Categoría</span><span className="font-semibold text-foreground">{CATEGORIES.find(c => c.id === form.category)?.label}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ciudad</span><span className="font-semibold text-foreground">{form.city}, {form.state}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Descuento</span><span className="font-semibold text-emerald-600">{form.discountPercent}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Publicidad</span><span className="font-semibold text-foreground">$20 USD/mes</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Fee conversión</span><span className="font-semibold text-foreground">5%</span></div>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" id="terms" className="mt-1 accent-primary" />
              <span className="text-[11px] text-muted-foreground leading-relaxed">
                Acepto los <Link href="/terminos" className="text-primary underline">términos y condiciones</Link> del programa de afiliados, incluyendo la cuota mensual de $20 USD y el fee de conversión del 5%.
              </span>
            </label>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="h-12 px-6 rounded-xl border border-border bg-card text-sm font-bold text-foreground active:scale-[0.97] transition-all"
            >
              Atrás
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={
                (step === 0 && !canProceedStep0) ||
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2)
              }
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-rose-400 text-white text-sm font-bold shadow-md shadow-primary/20 hover:shadow-lg active:scale-[0.97] transition-all disabled:opacity-40 disabled:shadow-none"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canProceedStep3 || submitting}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg active:scale-[0.97] transition-all disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Enviando...
                </>
              ) : "Enviar solicitud"}
            </button>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
