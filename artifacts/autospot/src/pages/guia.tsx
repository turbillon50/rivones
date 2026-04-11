import { useState, useEffect } from "react";
import { Link } from "wouter";
import { BottomNav } from "@/components/layout/BottomNav";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { apiFetch } from "@/lib/api";

const CATEGORIES = [
  { id: "todos", label: "Todos", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
  { id: "restaurante", label: "Restaurantes", icon: "M3 2v7c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V2M7 2v20M21 15V2l-4 4-4-4v13a4 4 0 004 4h0a4 4 0 004-4z" },
  { id: "hotel", label: "Hoteles", icon: "M3 21V7h18v14M3 7l9-5 9 5M9 21v-4h6v4" },
  { id: "gasolinera", label: "Gasolineras", icon: "M3 22V5a2 2 0 012-2h8a2 2 0 012 2v17M14 10l2.5-1.5a2 2 0 012.5.3V18a2 2 0 01-2 2h-1M5 8h6M5 12h6" },
  { id: "atraccion", label: "Atracciones", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  { id: "taller", label: "Talleres", icon: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" },
];

interface Partner {
  id: string;
  businessName: string;
  category: string;
  discountPercent: number;
  discountDescription: string | null;
  discountCode: string | null;
  description: string;
  city: string;
  address: string;
  images: string[];
  logo: string | null;
  rating: number;
  reviewCount: number;
  featured: boolean;
  location: { lat: number; lng: number } | null;
  phone: string;
  whatsapp: string | null;
  complementarios: string | null;
}

const FALLBACK_PARTNERS: Partner[] = [
  {
    id: "f1", businessName: "La Capital Steakhouse", category: "restaurante", discountPercent: 15,
    discountDescription: "15% en consumo total", discountCode: "AUTOSPOT-CAP15",
    description: "Cortes premium de res angus en parrilla de leña. Reconocido por críticos como uno de los mejores en CDMX.",
    city: "Ciudad de México", address: "Av. Presidente Masaryk 407, Polanco",
    images: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80"],
    logo: null, rating: 4.9, reviewCount: 127, featured: true, location: { lat: 19.4326, lng: -99.1944 },
    phone: "+52 55 1234 5678", whatsapp: null, complementarios: null,
  },
  {
    id: "f2", businessName: "Hotel Xcaret Arte", category: "hotel", discountPercent: 20,
    discountDescription: "20% en tarifa de habitación", discountCode: "AUTOSPOT-XCA20",
    description: "Resort todo incluido con 900 obras de arte, 5 restaurantes de autor y acceso exclusivo a parques Xcaret.",
    city: "Cancún", address: "Carretera Chetumal-Puerto Juárez Km 282",
    images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80"],
    logo: null, rating: 4.8, reviewCount: 89, featured: true, location: { lat: 20.5882, lng: -87.1178 },
    phone: "+52 998 765 4321", whatsapp: null, complementarios: null,
  },
  {
    id: "f3", businessName: "Pemex Select Polanco", category: "gasolinera", discountPercent: 5,
    discountDescription: "5% en gasolina premium", discountCode: "AUTOSPOT-PMX5",
    description: "Estación con gasolina premium y punto de carga eléctrica. Tienda de conveniencia 24/7.",
    city: "Ciudad de México", address: "Av. Ejército Nacional 843-B",
    images: ["https://images.unsplash.com/photo-1545262810-a6be8c849de0?w=600&q=80"],
    logo: null, rating: 4.3, reviewCount: 45, featured: false, location: { lat: 19.4361, lng: -99.2000 },
    phone: "+52 55 9876 5432", whatsapp: null, complementarios: null,
  },
  {
    id: "f4", businessName: "Xel-Há Park", category: "atraccion", discountPercent: 25,
    discountDescription: "25% en entrada general", discountCode: "AUTOSPOT-XEL25",
    description: "El acuario natural más grande del mundo. Snorkel ilimitado, tirolesas, cenotes y buffet todo incluido.",
    city: "Cancún", address: "Carretera Chetumal-Puerto Juárez Km 240",
    images: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80"],
    logo: null, rating: 4.7, reviewCount: 203, featured: true, location: { lat: 20.3193, lng: -87.3558 },
    phone: "+52 998 234 5678", whatsapp: null, complementarios: null,
  },
  {
    id: "f5", businessName: "Taller Automotriz Alemán", category: "taller", discountPercent: 10,
    discountDescription: "10% en servicio completo", discountCode: "AUTOSPOT-TAA10",
    description: "Servicio especializado en BMW, Mercedes y Audi. Diagnóstico computarizado gratuito para miembros Rivones.",
    city: "Guadalajara", address: "Av. López Mateos Sur 2128",
    images: ["https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80"],
    logo: null, rating: 4.6, reviewCount: 67, featured: false, location: { lat: 20.6597, lng: -103.3496 },
    phone: "+52 33 8765 4321", whatsapp: null, complementarios: null,
  },
  {
    id: "f6", businessName: "Pujol", category: "restaurante", discountPercent: 10,
    discountDescription: "10% en menú degustación", discountCode: "AUTOSPOT-PUJ10",
    description: "Cocina mexicana contemporánea del Chef Enrique Olvera. Top 50 restaurantes del mundo.",
    city: "Ciudad de México", address: "Tennyson 133, Polanco",
    images: ["https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&q=80"],
    logo: null, rating: 5.0, reviewCount: 312, featured: true, location: { lat: 19.4329, lng: -99.1949 },
    phone: "+52 55 5545 4111", whatsapp: null, complementarios: null,
  },
  {
    id: "f7", businessName: "Grand Hyatt Monterrey", category: "hotel", discountPercent: 18,
    discountDescription: "18% en tarifa rack", discountCode: "AUTOSPOT-GHM18",
    description: "Hotel de lujo en San Pedro Garza García. Spa de clase mundial, alberca infinity con vista a la Sierra Madre.",
    city: "Monterrey", address: "Blvd. Antonio L. Rodríguez 1884",
    images: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80"],
    logo: null, rating: 4.8, reviewCount: 156, featured: false, location: { lat: 25.6516, lng: -100.3386 },
    phone: "+52 81 1234 5678", whatsapp: null, complementarios: null,
  },
  {
    id: "f8", businessName: "Grutas de Tolantongo", category: "atraccion", discountPercent: 15,
    discountDescription: "15% en paquete completo", discountCode: "AUTOSPOT-GDT15",
    description: "Aguas termales naturales en la sierra de Hidalgo. Grutas, pozas escalonadas, río y túnel con cascada.",
    city: "Hidalgo", address: "San Cristóbal, Cardonal",
    images: ["https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80"],
    logo: null, rating: 4.9, reviewCount: 287, featured: true, location: { lat: 20.6497, lng: -99.0019 },
    phone: "+52 759 723 6162", whatsapp: null, complementarios: null,
  },
];

function CategoryIcon({ path, size = 16, className }: { path: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d={path} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i < Math.round(rating) ? "#FBBF24" : "none"}
            stroke={i < Math.round(rating) ? "#FBBF24" : "currentColor"}
            strokeWidth="1.5"
            className={i >= Math.round(rating) ? "text-muted-foreground/20" : ""}
          />
        </svg>
      ))}
      <span className="text-xs font-semibold ml-0.5">{rating.toFixed(1)}</span>
    </div>
  );
}

function PartnerCard({ partner, onShowQR }: { partner: Partner; onShowQR: (p: Partner) => void }) {
  const cat = CATEGORIES.find(c => c.id === partner.category);
  const img = partner.images[0] || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80";
  return (
    <div className="group relative bg-card border border-border rounded-2xl overflow-hidden">
      <div className="relative h-40 overflow-hidden">
        <img src={img} alt={partner.businessName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
            {cat && <CategoryIcon path={cat.icon} size={12} className="text-primary" />}
            <span className="text-[10px] font-semibold text-foreground">{cat?.label}</span>
          </div>
        </div>
        <div className="absolute top-3 right-3">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full px-2.5 py-1 shadow-lg">
            <span className="text-xs font-black">-{partner.discountPercent}%</span>
          </div>
        </div>
        {partner.featured && (
          <div className="absolute bottom-3 left-3">
            <div className="flex items-center gap-1 bg-amber-400/90 backdrop-blur-sm rounded-full px-2 py-0.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              <span className="text-[10px] font-bold text-white">Recomendado</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-[15px] text-foreground leading-tight">{partner.businessName}</h3>
        <div className="flex items-center gap-2 mt-1">
          <StarRating rating={partner.rating} />
          <span className="text-[11px] text-muted-foreground">{partner.city}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mt-2 line-clamp-2">{partner.description}</p>
        {partner.complementarios && (
          <p className="text-[11px] text-blue-500 font-medium mt-1.5">+ {partner.complementarios}</p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => onShowQR(partner)}
            className="flex-1 h-10 rounded-xl bg-gradient-to-r from-primary to-rose-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.97] transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="3" height="3" />
              <rect x="18" y="14" width="3" height="3" />
              <rect x="14" y="18" width="3" height="3" />
              <rect x="18" y="18" width="3" height="3" />
            </svg>
            Ver mi descuento
          </button>
          {partner.whatsapp && (
            <a
              href={`https://wa.me/${partner.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener"
              className="h-10 w-10 rounded-xl border border-border bg-card flex items-center justify-center text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function QRModal({ partner, onClose }: { partner: Partner; onClose: () => void }) {
  const code = partner.discountCode || `AUTOSPOT-${partner.id}`;
  const qrValue = `https://rentamerapido.autos/descuento/${code}?partner=${partner.id}`;
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    const text = `Tengo un ${partner.discountPercent}% de descuento en ${partner.businessName} con Rivones. Usa el código: ${code}`;
    if (navigator.share) {
      try { await navigator.share({ title: `Descuento Rivones - ${partner.businessName}`, text, url: qrValue }); } catch {}
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + qrValue)}`, "_blank");
    }
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const img = partner.images[0] || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80";

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[60] max-w-sm mx-auto">
        <div className="bg-background rounded-3xl shadow-2xl overflow-hidden border border-white/10">
          <div className="relative h-28 overflow-hidden">
            <img src={img} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/70" />
            <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <div className="absolute bottom-3 left-4 right-4">
              <h3 className="text-white font-bold text-lg drop-shadow">{partner.businessName}</h3>
              <p className="text-white/80 text-xs">{partner.city}</p>
            </div>
          </div>
          <div className="px-6 pt-5 pb-6 flex flex-col items-center">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl px-5 py-2 mb-4 shadow-lg shadow-emerald-500/25">
              <span className="text-2xl font-black">{partner.discountPercent}% OFF</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-inner border border-border">
              <QRCodeSVG value={qrValue} size={180} bgColor="#FFFFFF" fgColor="#1a1a1a" level="H" includeMargin={false} />
            </div>
            <div className="mt-4 bg-secondary/50 rounded-xl px-4 py-2.5 border border-border w-full text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Código de descuento</p>
              <p className="text-lg font-black text-foreground tracking-wider">{code}</p>
            </div>
            {partner.discountDescription && (
              <p className="text-[11px] text-muted-foreground text-center mt-2">{partner.discountDescription}</p>
            )}
            <p className="text-[11px] text-muted-foreground text-center mt-2 leading-relaxed">
              Presenta este QR al momento de pagar. Exclusivo para miembros Rivones.
            </p>
            <button
              onClick={handleShare}
              className={cn(
                "w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all mt-4",
                shared
                  ? "bg-emerald-500 text-white"
                  : "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/20 hover:shadow-lg active:scale-[0.97]"
              )}
            >
              {shared ? (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg> Compartido</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg> Compartir por WhatsApp</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Guia() {
  const [activeCategory, setActiveCategory] = useState("todos");
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Partner[]>("/partners")
      .then((data) => {
        setPartners(data.length > 0 ? data : FALLBACK_PARTNERS);
        setLoading(false);
      })
      .catch(() => {
        setPartners(FALLBACK_PARTNERS);
        setLoading(false);
      });
  }, []);

  const filtered = activeCategory === "todos"
    ? partners
    : partners.filter(p => p.category === activeCategory);

  const featured = partners.filter(p => p.featured);

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, rgba(244,63,94,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(251,191,36,0.3) 0%, transparent 50%)" }} />
        <div className="relative z-10 flex flex-col justify-end h-full px-5 pb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            </div>
            <span className="text-amber-300 text-[11px] font-bold uppercase tracking-[0.2em]">Guía Rivones</span>
          </div>
          <h1 className="text-white font-black text-[22px] leading-tight">Descubre, viaja<br />y ahorra en cada parada</h1>
          <p className="text-white/60 text-xs mt-1.5 font-medium">{partners.length} negocios afiliados con descuentos exclusivos</p>
        </div>
      </div>

      <div className="px-4 -mt-5 relative z-20">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-rose-400 to-amber-400 flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 15l-3 3h6l-3-3zM9 3l3 3 3-3M5 9l3 3-3 3M19 9l-3 3 3 3M12 21a9 9 0 100-18 9 9 0 000 18z" stroke="white" strokeWidth="1.5" fill="none" /><circle cx="12" cy="12" r="3" fill="white" /></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground">Miembro Rivones</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Todos los descuentos activados</p>
          </div>
          <div className="bg-emerald-500/10 text-emerald-600 rounded-full px-3 py-1 border border-emerald-200 dark:border-emerald-800">
            <span className="text-[11px] font-bold">Activo</span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap shrink-0",
                  activeCategory === cat.id
                    ? "bg-foreground text-background shadow-md"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                )}
              >
                <CategoryIcon path={cat.icon} size={13} className={activeCategory === cat.id ? "text-background" : "text-muted-foreground"} />
                {cat.label}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      <main className="px-4 pt-5 space-y-6">
        {activeCategory === "todos" && (
          <Link href="/guia/registro">
            <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/5 to-rose-400/5 p-4 cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-rose-400 flex items-center justify-center shrink-0 shadow-md">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 21V7h18v14M3 7l9-5 9 5M9 21v-4h6v4" />
                    <path d="M12 11v4M10 13h4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-foreground">¿Tienes un negocio?</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Regístralo y llega a miles de viajeros</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        )}

        {activeCategory === "todos" && featured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold tracking-tight flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FBBF24" stroke="#FBBF24" strokeWidth="1.5" /></svg>
                Recomendados
              </h2>
              <span className="text-[12px] text-muted-foreground">{featured.length} lugares</span>
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-1">
                {featured.map((partner) => (
                  <div key={partner.id} className="w-64 shrink-0">
                    <PartnerCard partner={partner} onShowQR={setSelectedPartner} />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          </section>
        )}

        {activeCategory === "todos" && (
          <section>
            <Link href="/map">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-[#0f3460] to-[#1a1a2e] p-5 cursor-pointer group">
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                  <svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="45" stroke="white" strokeWidth="2" strokeDasharray="8 4" /><circle cx="50" cy="50" r="25" stroke="white" strokeWidth="2" /><circle cx="50" cy="50" r="5" fill="white" /></svg>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="white" opacity="0.3" /></svg>
                    </div>
                    <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Planificador</span>
                  </div>
                  <h3 className="text-white font-bold text-base leading-tight">Diseña tu ruta perfecta</h3>
                  <p className="text-white/50 text-xs mt-1">Conecta tu renta con restaurantes, hoteles y atracciones cercanas</p>
                  <div className="flex items-center gap-1 mt-3 text-primary text-xs font-semibold group-hover:gap-2 transition-all">
                    <span>Abrir mapa</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold tracking-tight">
              {activeCategory === "todos" ? "Todos los afiliados" : CATEGORIES.find(c => c.id === activeCategory)?.label}
            </h2>
            <span className="text-[12px] text-muted-foreground">{filtered.length} disponibles</span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-40 bg-secondary" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-secondary rounded w-2/3" />
                    <div className="h-3 bg-secondary rounded w-1/2" />
                    <div className="h-3 bg-secondary rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((partner) => (
                <PartnerCard key={partner.id} partner={partner} onShowQR={setSelectedPartner} />
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">No hay establecimientos en esta categoría aún.</p>
                  <Link href="/guia/registro" className="text-primary text-sm font-semibold mt-2 inline-block">Sé el primero en registrarte</Link>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="pb-4">
          <h2 className="text-[15px] font-bold tracking-tight mb-4">Cómo funciona</h2>
          <div className="space-y-3">
            {[
              { step: "1", title: "Regístrate en Rivones", desc: "Crea tu cuenta gratuita y activa tu membresía", gradient: "from-blue-500 to-indigo-600" },
              { step: "2", title: "Explora los afiliados", desc: "Encuentra restaurantes, hoteles y más cerca de tu ruta", gradient: "from-primary to-rose-500" },
              { step: "3", title: "Presenta tu QR", desc: "Muestra el código al pagar y obtén tu descuento al instante", gradient: "from-emerald-500 to-green-600" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shrink-0 shadow-md`}>
                  <span className="text-white font-black text-sm">{item.step}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {selectedPartner && <QRModal partner={selectedPartner} onClose={() => setSelectedPartner(null)} />}
      <BottomNav />
    </div>
  );
}
