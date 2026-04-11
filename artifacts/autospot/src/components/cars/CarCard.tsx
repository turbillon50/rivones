import { Link } from "wouter";
import { Car } from "@workspace/api-client-react/src/generated/api.schemas";
import { formatCurrency, formatKm } from "@/lib/format";
import { useToggleFavorite } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCarsQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

function HeartIcon({ filled, size = 14 }: { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function StarIcon({ size = 8 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FBBF24" stroke="#FBBF24" strokeWidth="1.5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

const BADGE_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  oferta: "Oferta",
  destacado: "Destacado",
  exclusivo: "Exclusivo",
  "top anfitrión": "Top Anfitrión",
  "más rentado": "Más rentado",
};

const BADGE_BG: Record<string, string> = {
  exclusivo: "bg-violet-600/90",
  "top anfitrión": "bg-amber-500/90",
  "más rentado": "bg-emerald-600/90",
  nuevo: "bg-sky-500/90",
  oferta: "bg-primary/90",
};

export function CarCard({ car, className, horizontal = false }: { car: Car; className?: string; horizontal?: boolean }) {
  const queryClient = useQueryClient();
  const toggleFavorite = useToggleFavorite({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueriesData({ queryKey: getGetCarsQueryKey() }, (oldData: Car[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(c => c.id === car.id ? { ...c, isFavorited: data.isFavorited } : c);
        });
      }
    }
  });

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite.mutate({ id: car.id });
  };

  if (horizontal) {
    return (
      <Link href={`/car/${car.id}`} className={cn("block group bg-card rounded-2xl border border-border overflow-hidden", className)}>
        <div className="flex h-24">
          <div className="w-28 flex-shrink-0 relative bg-muted">
            <img
              src={car.images[0] || "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400&q=80"}
              alt={car.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 px-3 py-2.5 flex flex-col justify-between min-w-0">
            <p className="font-semibold text-[13px] line-clamp-1 leading-snug text-foreground">{car.title}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-0.5">
                <span className="text-primary font-bold text-sm">{formatCurrency(car.pricePerDay)}</span>
                <span className="text-muted-foreground text-[11px]">/día</span>
              </div>
              {car.rating >= 4 && (
                <div className="flex items-center gap-0.5 text-[11px] text-muted-foreground font-medium">
                  <StarIcon size={9} />
                  <span>{car.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">{car.city} · {car.specs.year}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/car/${car.id}`} className={cn("block group relative overflow-hidden rounded-2xl bg-card border border-border active:scale-[0.98] transition-transform duration-150", className)}>
      <div className="aspect-[3/2] relative bg-muted overflow-hidden">
        <img
          src={car.images[0] || "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400&q=80"}
          alt={car.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {car.badge && (
          <div className={cn("absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white backdrop-blur-sm", BADGE_BG[car.badge] ?? "bg-foreground/70")}>
            {BADGE_LABELS[car.badge] ?? car.badge}
          </div>
        )}

        <button
          onClick={handleFavorite}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/25 backdrop-blur-sm text-white transition-colors z-10"
        >
          <HeartIcon size={14} filled={car.isFavorited} />
        </button>

        {car.rating >= 4 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-white text-[10px] font-semibold">
            <StarIcon size={8} />
            <span>{car.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="px-3 pt-2 pb-3">
        <p className="font-semibold text-[13px] line-clamp-1 text-foreground leading-snug">{car.title}</p>
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-baseline gap-0.5">
            <span className="text-primary font-bold text-[15px]">{formatCurrency(car.pricePerDay)}</span>
            <span className="text-muted-foreground text-[11px]">/día</span>
          </div>
          <p className="text-[11px] text-muted-foreground">{car.city}</p>
        </div>
        {car.instantBook && (
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Reserva instantánea</p>
        )}
      </div>
    </Link>
  );
}

export function CarCardSkeleton({ horizontal = false, className }: { horizontal?: boolean; className?: string }) {
  if (horizontal) {
    return (
      <div className={cn("flex h-24 bg-card rounded-2xl border border-border overflow-hidden", className)}>
        <div className="w-28 bg-muted animate-pulse" />
        <div className="flex-1 px-3 py-2.5 flex flex-col justify-between">
          <div className="h-3.5 bg-muted rounded-full animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded-full animate-pulse w-1/2" />
          <div className="h-3 bg-muted rounded-full animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-card rounded-2xl border border-border overflow-hidden", className)}>
      <div className="aspect-[3/2] bg-muted animate-pulse" />
      <div className="px-3 pt-2 pb-3 space-y-1.5">
        <div className="h-3.5 bg-muted rounded-full animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded-full animate-pulse w-1/2" />
      </div>
    </div>
  );
}
