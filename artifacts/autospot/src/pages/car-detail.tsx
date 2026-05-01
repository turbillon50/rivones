import { useParams, Link, useLocation } from "wouter";
import { useGetCarById, useToggleFavorite, getGetCarByIdQueryKey, useGetCarReviews } from "@workspace/api-client-react";
import {
  IconChevronLeft, IconShare, IconHeart, IconMapPin, IconTransmission, IconInfo,
  IconPhone, IconZap, IconShield, IconDroplet, IconAlertCircle, IconStar,
  IconCalendar, IconGauge, IconCheckCircle, IconTruck, IconFuel,
} from "@/components/ui/icons";
import { formatCurrency, formatKm } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useMemo } from "react";
import { AvailabilityCalendar } from "@/components/booking/AvailabilityCalendar";
import { apiFetch } from "@/lib/api";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Hoy";
  if (days < 7) return `Hace ${days} día${days > 1 ? "s" : ""}`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} semana${Math.floor(days / 7) > 1 ? "s" : ""}`;
  if (days < 365) return `Hace ${Math.floor(days / 30)} mes${Math.floor(days / 30) > 1 ? "es" : ""}`;
  return `Hace ${Math.floor(days / 365)} año${Math.floor(days / 365) > 1 ? "s" : ""}`;
}

function RatingBar({ count, total, stars }: { count: number; total: number; stars: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-3 text-right">{stars}</span>
      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-6">{count}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: any }) {
  const initial = review.reviewerName?.charAt(0)?.toUpperCase() ?? "?";
  const starGradients = ["from-amber-400 to-amber-500", "from-green-400 to-emerald-500", "from-blue-400 to-indigo-500", "from-rose-400 to-pink-500", "from-violet-400 to-purple-500"];
  const gradientIdx = initial.charCodeAt(0) % starGradients.length;

  return (
    <div className="border border-border rounded-2xl p-4 bg-card">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${starGradients[gradientIdx]} flex items-center justify-center shrink-0`}>
          <span className="text-white font-bold text-sm">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">{review.reviewerName}</p>
            <p className="text-[11px] text-muted-foreground">{timeAgo(review.createdAt)}</p>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <IconStar key={i} size={12} className={i < Math.round(review.rating) ? "text-amber-400" : "text-muted-foreground/20"} />
            ))}
            {review.tripDays && (
              <span className="text-[11px] text-muted-foreground ml-1">{review.tripDays} días</span>
            )}
            {review.tripCity && (
              <span className="text-[11px] text-muted-foreground">· {review.tripCity}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
          {review.hostReply && (
            <div className="mt-3 bg-secondary/50 rounded-xl p-3 border-l-2 border-primary/30">
              <p className="text-[11px] font-semibold text-primary mb-1">Respuesta del anfitrión</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{review.hostReply}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const FUEL_LABELS: Record<string, string> = {
  gasoline: "Gasolina",
  diesel: "Diesel",
  hybrid: "Híbrido",
  electric: "Eléctrico",
};

const FUEL_POLICY_LABELS: Record<string, string> = {
  full_to_full: "Lleno a lleno",
  same_fuel_level: "Mismo nivel de combustible",
  charged: "Cargado al 100%",
};

const TRANS_LABELS: Record<string, string> = {
  manual: "Manual",
  automatic: "Automático",
  cvt: "CVT",
};

export default function CarDetail() {
  const params = useParams();
  const id = params.id!;
  const [, navigate] = useLocation();
  const [activeImage, setActiveImage] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showBooking, setShowBooking] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const { data: reviewsData } = useGetCarReviews(id, {
    query: { enabled: !!id }
  });

  const { data: car, isLoading } = useGetCarById(id, {
    query: { enabled: !!id, queryKey: getGetCarByIdQueryKey(id) }
  });

  const [bookedRanges, setBookedRanges] = useState<{ startDate: string; endDate: string }[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  useEffect(() => {
    if (!id) return;
    apiFetch<{ bookedRanges: any[]; blockedDates: string[] }>(`/cars/${id}/availability`)
      .then((d) => {
        setBookedRanges(d.bookedRanges ?? []);
        setBlockedDates(d.blockedDates ?? []);
      })
      .catch(() => {});
  }, [id]);

  const queryClient = useQueryClient();
  const toggleFavorite = useToggleFavorite({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetCarByIdQueryKey(id), (old: any) => {
          if (!old) return old;
          return { ...old, isFavorited: data.isFavorited };
        });
      }
    }
  });

  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [startDate, endDate]);

  const pricing = useMemo(() => {
    if (!car || !days) return null;
    const subtotal = car.pricePerDay * days;
    const cleaning = car.cleaningFee;
    const service = Math.round(subtotal * 0.12);
    const total = subtotal + cleaning + service;
    return { subtotal, cleaning, service, total };
  }, [car, days]);

  const today = new Date().toISOString().split("T")[0];

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <Skeleton className="w-full h-72 rounded-none" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-10 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-20 w-1/3 rounded-xl" />
            <Skeleton className="h-20 w-1/3 rounded-xl" />
            <Skeleton className="h-20 w-1/3 rounded-xl" />
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">No se encontró el auto</p>
        <Link href="/explore">
          <Button variant="outline">Volver a explorar</Button>
        </Link>
      </div>
    );
  }

  const handleBookNow = () => {
    if (!startDate || !endDate || days === 0) {
      setShowBooking(true);
      return;
    }
    const params = new URLSearchParams({ startDate, endDate, days: days.toString() });
    navigate(`/booking/${car.id}?${params.toString()}`);
  };

  const handleWhatsApp = () => {
    const host = car.host;
    const wa = host.whatsapp ?? host.phone;
    const text = encodeURIComponent(`Hola, me interesa rentar el ${car.title} en Rivones. ¿Está disponible?`);
    window.open(`https://wa.me/${wa.replace(/\D/g, "")}?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-32">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 pt-safe mt-4 pointer-events-none">
        <Link href="/explore">
          <Button variant="secondary" size="icon" className="rounded-full bg-background/80 backdrop-blur pointer-events-auto border-border shadow-md">
            <IconChevronLeft size={24} />
          </Button>
        </Link>
        <div className="flex gap-2 pointer-events-auto">
          <Button variant="secondary" size="icon" className="rounded-full bg-background/80 backdrop-blur border-border shadow-md">
            <IconShare size={20} />
          </Button>
          <Button
            variant="secondary" size="icon"
            className="rounded-full bg-background/80 backdrop-blur border-border shadow-md"
            onClick={() => toggleFavorite.mutate({ id })}
          >
            <IconHeart size={20} filled={car.isFavorited} className={car.isFavorited ? "text-red-500" : ""} />
          </Button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative h-[45vh] bg-muted w-full overflow-hidden">
        <img
          src={car.images[activeImage] || "https://images.unsplash.com/photo-1550355291-bbee04a92027"}
          alt={car.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-10">
          {car.images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(idx)}
              className={`h-1.5 rounded-full transition-all ${idx === activeImage ? "w-6 bg-primary" : "w-2 bg-white/50"}`}
            />
          ))}
        </div>
        {car.images.length > 1 && (
          <div className="absolute bottom-14 right-4 bg-black/40 backdrop-blur text-white text-xs px-2 py-1 rounded-full">
            {activeImage + 1}/{car.images.length}
          </div>
        )}
      </div>

      {/* Row of thumbnail images */}
      {car.images.length > 1 && (
        <div className="flex gap-2 px-5 mt-3 overflow-x-auto pb-1">
          {car.images.map((img, idx) => (
            <button key={idx} onClick={() => setActiveImage(idx)}
              className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${idx === activeImage ? "border-primary" : "border-transparent opacity-60"}`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="px-5 mt-4">
        {/* Title + Price */}
        <div className="mb-5">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {car.badge && (
              <Badge className="bg-primary/20 text-primary border-none font-bold uppercase tracking-wider text-[10px]">
                {car.badge}
              </Badge>
            )}
            <Badge variant="outline" className="border-border uppercase tracking-wider text-[10px]">
              {car.category}
            </Badge>
            {car.instantBook && (
              <Badge className="bg-amber-500/20 text-amber-600 border-none font-semibold text-[10px] gap-1">
                <IconZap size={10} className="text-amber-600" /> Reserva Inmediata
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">{car.title}</h1>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-3xl font-black text-primary">{formatCurrency(car.pricePerDay)}</span>
            <span className="text-muted-foreground text-base font-medium">/día</span>
          </div>
          <div className="flex items-center flex-wrap gap-3 mt-2">
            <div className="flex items-center text-muted-foreground text-sm gap-1">
              <IconMapPin size={14} />
              <span>{car.address}, {car.city}</span>
            </div>
            {car.rating > 0 && (
              <div className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                <IconStar size={14} className="text-amber-500" />
                <span>{car.rating.toFixed(1)}</span>
                <span className="text-muted-foreground font-normal">({car.reviewCount} reseñas)</span>
              </div>
            )}
            {car.tripsCount > 0 && (
              <span className="text-sm text-muted-foreground">{car.tripsCount} viajes completados</span>
            )}
          </div>
        </div>

        {/* Quick Specs */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { icon: <IconCalendar size={18} className="text-primary" />, label: "Año", value: car.specs.year },
            { icon: <IconGauge size={18} className="text-primary" />, label: "Kilometraje", value: formatKm(car.specs.km) },
            { icon: <IconTransmission size={18} className="text-primary" />, label: "Transmisión", value: TRANS_LABELS[car.specs.transmission] ?? car.specs.transmission },
            { icon: <IconFuel size={18} className="text-primary" />, label: "Combustible", value: FUEL_LABELS[car.specs.fuel] ?? car.specs.fuel },
            ...(car.specs.seats ? [{ icon: <IconShield size={18} className="text-primary" />, label: "Asientos", value: `${car.specs.seats} pasajeros` }] : []),
            ...(car.mileageLimit ? [{ icon: <IconGauge size={18} className="text-primary" />, label: "Km incluidos", value: `${car.mileageLimit} km/día` }] : []),
          ].slice(0, 6).map((spec, i) => (
            <div key={i} className="bg-card border border-card-border rounded-2xl p-3 flex flex-col items-center text-center gap-1.5">
              {spec.icon}
              <p className="text-[11px] text-muted-foreground">{spec.label}</p>
              <p className="font-semibold text-sm">{String(spec.value)}</p>
            </div>
          ))}
        </div>

        {/* Date Picker Widget */}
        <div className="bg-card border border-card-border rounded-3xl p-5 mb-6 shadow-sm">
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <IconCalendar size={18} className="text-primary" />
            Selecciona tus fechas
          </h2>
          <AvailabilityCalendar
            bookedRanges={bookedRanges}
            blockedDates={blockedDates}
            selectedRange={{
              from: startDate ? new Date(startDate) : undefined,
              to: endDate ? new Date(endDate) : undefined,
            }}
            onSelect={(range) => {
              setStartDate(range.from ? range.from.toISOString().slice(0, 10) : "");
              setEndDate(range.to ? range.to.toISOString().slice(0, 10) : "");
            }}
          />

          {days > 0 && pricing && (
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{formatCurrency(car.pricePerDay)} x {days} {days === 1 ? "día" : "días"}</span>
                <span className="font-medium">{formatCurrency(pricing.subtotal)}</span>
              </div>
              {pricing.cleaning > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cuota de limpieza</span>
                  <span className="font-medium">{formatCurrency(pricing.cleaning)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tarifa de servicio (12%)</span>
                <span className="font-medium">{formatCurrency(pricing.service)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-border pt-2 mt-2">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(pricing.total)}</span>
              </div>
              {car.depositAmount > 0 && (
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mt-2">
                  <IconAlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    Depósito reembolsable: <span className="font-bold">{formatCurrency(car.depositAmount)}</span>
                    {" "}(se devuelve al finalizar el viaje)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        {car.features.length > 0 && (
          <div className="mb-6">
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <IconCheckCircle size={18} className="text-primary" />
              Lo que incluye
            </h2>
            <div className="flex flex-wrap gap-2">
              {car.features.map((f, i) => (
                <span key={i} className="bg-secondary text-secondary-foreground text-sm px-3 py-1.5 rounded-full font-medium">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <IconInfo size={18} className="text-primary" />
            Descripción
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{car.description}</p>
        </div>

        {/* Rental Rules */}
        <div className="mb-6 bg-card border border-card-border rounded-2xl p-4">
          <h2 className="text-base font-bold mb-3">Reglas de renta</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <IconDroplet size={16} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Política de combustible</p>
                <p className="text-xs text-muted-foreground">{FUEL_POLICY_LABELS[car.fuelPolicy ?? "full_to_full"]}</p>
              </div>
            </div>
            {car.mileageLimit && (
              <div className="flex items-start gap-3">
                <IconGauge size={16} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Límite de kilometraje</p>
                  <p className="text-xs text-muted-foreground">{car.mileageLimit} km por día incluidos</p>
                </div>
              </div>
            )}
            {car.deliveryAvailable && (
              <div className="flex items-start gap-3">
                <IconTruck size={16} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Entrega disponible</p>
                  <p className="text-xs text-muted-foreground">
                    {car.deliveryFee === 0 ? "Entrega gratuita incluida" : `Costo de entrega: ${formatCurrency(car.deliveryFee ?? 0)}`}
                  </p>
                </div>
              </div>
            )}
            {car.minDays && car.minDays > 1 && (
              <div className="flex items-start gap-3">
                <IconCalendar size={16} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Mínimo de días</p>
                  <p className="text-xs text-muted-foreground">{car.minDays} días mínimo</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full Specs */}
        <div className="mb-6">
          <h2 className="text-base font-bold mb-4">Especificaciones</h2>
          <div className="space-y-3">
            {[
              { label: "Marca", value: car.specs.brand },
              { label: "Modelo", value: car.specs.model },
              { label: "Color", value: car.specs.color },
              { label: "Puertas", value: car.specs.doors },
              { label: "Motor", value: car.specs.engine },
              { label: "Potencia", value: car.specs.horsepower ? `${car.specs.horsepower} HP` : null },
            ].filter(s => s.value).map((spec, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                <span className="text-muted-foreground text-sm">{spec.label}</span>
                <span className="font-medium text-sm capitalize">{String(spec.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Host Info */}
        <div className="mb-6">
          <h2 className="text-base font-bold mb-4">Sobre el anfitrión</h2>
          <div className="bg-card border border-card-border rounded-2xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary overflow-hidden shrink-0 border-2 border-primary/20">
              {car.host.avatar ? (
                <img src={car.host.avatar} alt={car.host.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xl text-primary bg-primary/10">
                  {car.host.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base">{car.host.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Miembro desde {car.host.memberSince ?? "2023"}</p>
              {car.host.responseTime && (
                <p className="text-xs text-muted-foreground">Responde en {car.host.responseTime}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {car.host.tripsCompleted && car.host.tripsCompleted > 0 && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {car.host.tripsCompleted} viajes
                  </Badge>
                )}
                {car.host.rating && (
                  <Badge variant="secondary" className="text-xs font-normal text-amber-600 bg-amber-50 dark:bg-amber-950/30">
                    <IconStar size={10} className="text-amber-500 mr-1" /> {car.host.rating}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {reviewsData && reviewsData.totalReviews > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                Reseñas
                <span className="text-sm font-normal text-muted-foreground">({reviewsData.totalReviews})</span>
              </h2>
              <div className="flex items-center gap-1.5">
                <IconStar size={16} className="text-amber-400" />
                <span className="text-lg font-bold">{reviewsData.averageRating.toFixed(1)}</span>
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="bg-card border border-card-border rounded-2xl p-4 mb-4">
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map(stars => (
                  <RatingBar
                    key={stars}
                    stars={stars}
                    count={(reviewsData.ratingBreakdown as any)?.[String(stars)] ?? 0}
                    total={reviewsData.totalReviews}
                  />
                ))}
              </div>
            </div>

            {/* Review Cards */}
            <div className="space-y-3">
              {(showAllReviews ? reviewsData.reviews : reviewsData.reviews.slice(0, 3)).map((review: any) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>

            {reviewsData.reviews.length > 3 && !showAllReviews && (
              <button
                onClick={() => setShowAllReviews(true)}
                className="w-full mt-3 py-3 rounded-2xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-secondary/50 transition-colors"
              >
                Ver las {reviewsData.totalReviews} reseñas
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border p-4 pb-safe">
        {days > 0 && pricing ? (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{days} {days === 1 ? "día" : "días"} • Total</p>
              <p className="text-lg font-black text-primary">{formatCurrency(pricing.total)}</p>
            </div>
            <Button
              onClick={handleBookNow}
              className="h-12 px-6 rounded-xl font-bold text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
            >
              Reservar ahora
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              onClick={handleWhatsApp}
              className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
            >
              <IconPhone size={18} />
              WhatsApp
            </Button>
            <Button
              onClick={() => document.querySelector<HTMLInputElement>('input[type="date"]')?.focus()}
              className="flex-1 h-12 rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90"
            >
              <IconCalendar size={18} />
              Ver disponibilidad
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
