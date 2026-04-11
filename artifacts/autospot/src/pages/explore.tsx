import { useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { CarCard, CarCardSkeleton } from "@/components/cars/CarCard";
import { useGetCars, useGetFeaturedCars } from "@workspace/api-client-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useCreatorMode } from "@/hooks/use-creator-mode";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

const CATEGORIES = [
  { id: "todos", label: "Todos" },
  { id: "lujo", label: "Lujo" },
  { id: "suv", label: "SUV" },
  { id: "deportivo", label: "Deportivos" },
  { id: "economico", label: "Económicos" },
  { id: "electrico", label: "Eléctricos" },
  { id: "van", label: "Familiar" },
  { id: "trabajo", label: "Trabajo" },
];

const CITIES = ["CDMX", "Guadalajara", "Monterrey", "Cancún", "Mérida", "Tijuana"];

const HERO_IMAGE = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1400&q=90";

export default function Explore() {
  const [activeCategory, setActiveCategory] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | undefined>();
  const { isCreator, toggle } = useCreatorMode();

  const { data: featuredCars, isLoading: isLoadingFeatured } = useGetFeaturedCars();
  const { data: allCars, isLoading: isLoadingCars } = useGetCars({
    category: activeCategory !== "todos" ? activeCategory : undefined,
    search: searchQuery || undefined,
    city: selectedCity,
    status: "active",
  });

  return (
    <div className="min-h-[100dvh] bg-background pb-24">

      {/* ── Cinematic Hero ── */}
      <div className="relative h-[52vw] min-h-52 max-h-72 overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="Rivones hero"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/75" />
        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-5">
          <h1 className="text-white font-black text-2xl leading-tight tracking-tight drop-shadow-lg">
            Renta el auto<br />perfecto para tu viaje
          </h1>
          <p className="text-white/80 text-[13px] mt-1 font-medium drop-shadow">
            {allCars?.length ?? 0} autos disponibles en México
          </p>
          <div className="flex gap-2 mt-3">
            <Link href="/map">
              <button className="bg-white/95 text-foreground font-semibold text-[13px] px-4 py-2 rounded-full backdrop-blur-sm shadow-lg">
                Ver en mapa
              </button>
            </Link>
            <button
              onClick={toggle}
              className={cn(
                "font-semibold text-[13px] px-4 py-2 rounded-full backdrop-blur-sm shadow-lg transition-colors",
                isCreator
                  ? "bg-primary text-white"
                  : "bg-black/40 text-white border border-white/20"
              )}
            >
              {isCreator ? "Anfitrión activo" : "Ser anfitrión"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Sticky filter bar ── */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              placeholder="Busca marca, modelo o ciudad..."
              className="w-full pl-9 pr-4 h-10 bg-secondary/60 rounded-full text-[13px] outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <ScrollArea className="w-full whitespace-nowrap px-4 pb-2">
          <div className="flex w-max gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[12px] font-semibold transition-colors",
                  activeCategory === cat.id
                    ? "bg-foreground text-background"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>

        {/* City pills */}
        <ScrollArea className="w-full whitespace-nowrap px-4 pb-2.5">
          <div className="flex w-max gap-1.5">
            <button
              onClick={() => setSelectedCity(undefined)}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-medium border transition-colors",
                !selectedCity
                  ? "border-foreground text-foreground bg-transparent"
                  : "border-border text-muted-foreground"
              )}
            >
              Todo México
            </button>
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(selectedCity === city ? undefined : city)}
                className={cn(
                  "px-3 py-1 rounded-full text-[11px] font-medium border transition-colors",
                  selectedCity === city
                    ? "border-foreground text-foreground"
                    : "border-border text-muted-foreground"
                )}
              >
                {city}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      <main className="px-4 pt-5 space-y-6">

        {/* Featured horizontal scroll */}
        {(isLoadingFeatured || (featuredCars && featuredCars.length > 0)) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold tracking-tight">Destacados</h2>
              <button className="text-primary text-[13px] font-semibold">Ver todos</button>
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-1">
                {isLoadingFeatured
                  ? Array(3).fill(0).map((_, i) => <CarCardSkeleton key={i} className="w-52 shrink-0" />)
                  : featuredCars!.map((car) => (
                    <CarCard key={car.id} car={car} className="w-52 shrink-0" />
                  ))
                }
              </div>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          </section>
        )}

        {/* All cars */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold tracking-tight">
              {activeCategory === "todos"
                ? "Todos los autos"
                : CATEGORIES.find(c => c.id === activeCategory)?.label}
              {selectedCity && <span className="text-primary"> · {selectedCity}</span>}
            </h2>
            <span className="text-[12px] text-muted-foreground">{allCars?.length ?? 0} disponibles</span>
          </div>

          {isLoadingCars ? (
            <div className="flex flex-wrap gap-3">
              {Array(6).fill(0).map((_, i) => <CarCardSkeleton key={i} className="w-[calc(50%-6px)]" />)}
            </div>
          ) : allCars && allCars.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {allCars.map((car) => <CarCard key={car.id} car={car} className="w-[calc(50%-6px)]" />)}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-[15px] font-semibold mb-1">Sin resultados</p>
              <p className="text-[13px]">Prueba con otra ciudad o categoría</p>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
