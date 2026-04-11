import { useState, useRef, useEffect, useCallback } from "react";
import { useGetCars } from "@workspace/api-client-react";
import { Car } from "@workspace/api-client-react/src/generated/api.schemas";
import { BottomNav } from "@/components/layout/BottomNav";
import { CarCard } from "@/components/cars/CarCard";
import { IconNavigation, IconSearch, IconX, IconMinus, IconPlus } from "@/components/ui/icons";
import { formatCurrency } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

const MEXICO_CENTER = { lat: 23.6345, lng: -102.5528 };
const MEXICO_BOUNDS = {
  north: 33.0,
  south: 14.0,
  west: -118.5,
  east: -86.0,
};

const AUTOSPOT_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ visibility: "on" }, { color: "#e0e0e0" }, { weight: 1 }] },
  { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ visibility: "on" }, { color: "#e8e8e8" }, { weight: 0.5 }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "administrative.province", elementType: "labels.text.fill", stylers: [{ color: "#c0c0c0" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#888888" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", stylers: [{ visibility: "simplified" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e8f5e9" }] },
  { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f8d7da" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#f1aeb5" }, { weight: 0.5 }] },
  { featureType: "road.highway", elementType: "labels", stylers: [{ visibility: "simplified" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#c0392b" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#fafafa" }] },
  { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c5d8e8" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#92b0c7" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#f0f0f0" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
];

function useGoogleMaps(apiKey: string | undefined) {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (!apiKey) return;
    if ((window as any).google?.maps) { setIsLoaded(true); return; }
    (window as any).initGoogleMap = () => setIsLoaded(true);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    return () => {
      try { document.head.removeChild(script); } catch {}
    };
  }, [apiKey]);
  return isLoaded;
}

function createPriceMarkerElement(price: string, isSelected: boolean) {
  const el = document.createElement("div");
  el.style.cssText = `
    position: relative;
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.15));
    z-index: ${isSelected ? 50 : 10};
    transform: scale(${isSelected ? 1.15 : 1});
  `;

  const bubble = document.createElement("div");
  bubble.style.cssText = `
    background: ${isSelected ? "linear-gradient(135deg, #f43f5e, #e11d48)" : "white"};
    color: ${isSelected ? "white" : "#1a1a2e"};
    border: ${isSelected ? "none" : "1.5px solid rgba(0,0,0,0.08)"};
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 700;
    font-family: system-ui, -apple-system, sans-serif;
    white-space: nowrap;
    letter-spacing: -0.2px;
  `;
  bubble.textContent = price;

  const arrow = document.createElement("div");
  arrow.style.cssText = `
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 7px solid ${isSelected ? "#e11d48" : "white"};
    margin: -1px auto 0;
  `;

  el.appendChild(bubble);
  el.appendChild(arrow);
  return el;
}

function RealMap({ cars, selectedCar, onCarSelect }: { cars: Car[]; selectedCar: Car | null; onCarSelect: (car: Car | null) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlaysRef = useRef<Map<string, { overlay: any; element: HTMLDivElement }>>(new Map());

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const g = (window as any).google;

    const center = cars.length > 0
      ? { lat: Number(cars[0].location.lat), lng: Number(cars[0].location.lng) }
      : MEXICO_CENTER;

    mapInstanceRef.current = new g.maps.Map(mapRef.current, {
      center,
      zoom: 5,
      minZoom: 5,
      maxZoom: 18,
      restriction: {
        latLngBounds: MEXICO_BOUNDS,
        strictBounds: true,
      },
      styles: AUTOSPOT_MAP_STYLE,
      disableDefaultUI: true,
      gestureHandling: "greedy",
      clickableIcons: false,
    });

    mapInstanceRef.current.addListener("click", () => onCarSelect(null));

    cars.forEach(car => {
      const lat = Number(car.location.lat);
      const lng = Number(car.location.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const priceText = formatCurrency(car.pricePerDay);
      const markerEl = createPriceMarkerElement(priceText, false);

      markerEl.addEventListener("click", (e) => {
        e.stopPropagation();
        onCarSelect(car);
        mapInstanceRef.current.panTo({ lat, lng });
        mapInstanceRef.current.setZoom(Math.max(mapInstanceRef.current.getZoom(), 10));
      });

      markerEl.addEventListener("mouseenter", () => {
        if (selectedCar?.id !== car.id) {
          markerEl.style.transform = "scale(1.1)";
          markerEl.style.zIndex = "40";
        }
      });
      markerEl.addEventListener("mouseleave", () => {
        if (selectedCar?.id !== car.id) {
          markerEl.style.transform = "scale(1)";
          markerEl.style.zIndex = "10";
        }
      });

      const overlay = new g.maps.OverlayView();
      overlay.onAdd = function () {
        this.getPanes().overlayMouseTarget.appendChild(markerEl);
      };
      overlay.onRemove = function () { markerEl.remove(); };
      overlay.draw = function () {
        const proj = this.getProjection();
        if (!proj) return;
        const pos = proj.fromLatLngToDivPixel(new g.maps.LatLng(lat, lng));
        if (!pos) return;
        markerEl.style.position = "absolute";
        markerEl.style.left = `${pos.x - markerEl.offsetWidth / 2}px`;
        markerEl.style.top = `${pos.y - markerEl.offsetHeight - 4}px`;
      };
      overlay.setMap(mapInstanceRef.current);
      overlaysRef.current.set(car.id, { overlay, element: markerEl });
    });
  }, [cars]);

  useEffect(() => {
    overlaysRef.current.forEach(({ element }, carId) => {
      const isSelected = selectedCar?.id === carId;
      const car = cars.find(c => c.id === carId);
      if (!car) return;
      const priceText = formatCurrency(car.pricePerDay);
      const newEl = createPriceMarkerElement(priceText, isSelected);
      element.querySelector("div")?.replaceWith(...newEl.childNodes);
      element.style.transform = isSelected ? "scale(1.15)" : "scale(1)";
      element.style.zIndex = isSelected ? "50" : "10";
      element.style.filter = isSelected
        ? "drop-shadow(0 4px 12px rgba(244,63,94,0.4))"
        : "drop-shadow(0 2px 6px rgba(0,0,0,0.15))";
    });
  }, [selectedCar]);

  const handleZoom = useCallback((delta: number) => {
    if (!mapInstanceRef.current) return;
    const current = mapInstanceRef.current.getZoom();
    mapInstanceRef.current.setZoom(current + delta);
  }, []);

  return (
    <>
      <div ref={mapRef} className="absolute inset-0" />
      <div className="absolute right-4 top-20 z-20 flex flex-col gap-1">
        <button
          onClick={() => handleZoom(1)}
          className="w-10 h-10 bg-white/95 backdrop-blur-sm border border-black/5 rounded-xl shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        >
          <IconPlus size={18} className="text-foreground" />
        </button>
        <button
          onClick={() => handleZoom(-1)}
          className="w-10 h-10 bg-white/95 backdrop-blur-sm border border-black/5 rounded-xl shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        >
          <IconMinus size={18} className="text-foreground" />
        </button>
      </div>
    </>
  );
}

function SimulatedMap({ cars, selectedCar, onCarSelect }: {
  cars: Car[];
  selectedCar: Car | null;
  onCarSelect: (car: Car | null) => void;
}) {
  const getNormalized = () => {
    if (!cars.length) return [];
    const padLat = (MEXICO_BOUNDS.north - MEXICO_BOUNDS.south) * 0.1;
    const padLng = (MEXICO_BOUNDS.east - MEXICO_BOUNDS.west) * 0.1;
    return cars.map(car => ({
      ...car,
      normLat: 100 - ((Number(car.location.lat) - MEXICO_BOUNDS.south + padLat) / (MEXICO_BOUNDS.north - MEXICO_BOUNDS.south + 2 * padLat) * 100),
      normLng: ((Number(car.location.lng) - MEXICO_BOUNDS.west + padLng) / (MEXICO_BOUNDS.east - MEXICO_BOUNDS.west + 2 * padLng) * 100),
    }));
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#e8eef5] to-[#dde5ee]" onClick={() => onCarSelect(null)}>
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle, #000 0.5px, transparent 0.5px)",
        backgroundSize: "24px 24px",
      }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[70%] rounded-[40px] opacity-10"
        style={{ background: "radial-gradient(ellipse, #f43f5e 0%, transparent 70%)" }} />

      {getNormalized().map(car => {
        const isSelected = selectedCar?.id === car.id;
        return (
          <motion.div
            key={car.id}
            className="absolute -translate-x-1/2 -translate-y-full cursor-pointer"
            style={{ left: `${car.normLng}%`, top: `${car.normLat}%`, zIndex: isSelected ? 50 : 10 }}
            onClick={e => { e.stopPropagation(); onCarSelect(isSelected ? null : (cars.find(c => c.id === car.id) ?? null)); }}
            whileTap={{ scale: 0.95 }}
            animate={{ scale: isSelected ? 1.15 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div
              className="px-3.5 py-1.5 rounded-full font-bold text-[13px] whitespace-nowrap transition-colors duration-200"
              style={{
                background: isSelected ? "linear-gradient(135deg, #f43f5e, #e11d48)" : "white",
                color: isSelected ? "white" : "#1a1a2e",
                border: isSelected ? "none" : "1.5px solid rgba(0,0,0,0.08)",
                boxShadow: isSelected
                  ? "0 4px 16px rgba(244,63,94,0.4)"
                  : "0 2px 8px rgba(0,0,0,0.12)",
                letterSpacing: "-0.2px",
              }}
            >
              {formatCurrency(car.pricePerDay)}
            </div>
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[7px] border-l-transparent border-r-transparent mx-auto -mt-px"
              style={{ borderTopColor: isSelected ? "#e11d48" : "white" }} />
          </motion.div>
        );
      })}
    </div>
  );
}

export default function MapView() {
  const { data: cars, isLoading } = useGetCars();
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [search, setSearch] = useState("");
  const mapsLoaded = useGoogleMaps(GOOGLE_MAPS_API_KEY);

  const filtered = (cars ?? []).filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.city.toLowerCase().includes(search.toLowerCase())
  );

  const cities = [...new Set((cars ?? []).map(c => c.city))];

  return (
    <div className="h-[100dvh] flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 space-y-2">
        <div className="bg-white/95 backdrop-blur-xl border border-black/5 rounded-2xl h-12 flex items-center px-4 shadow-lg shadow-black/5">
          <IconSearch size={18} className="text-muted-foreground mr-3 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar ciudad, marca..."
            className="bg-transparent border-none outline-none text-sm flex-1 text-foreground placeholder:text-muted-foreground/60"
          />
          {search && (
            <button onClick={() => setSearch("")} className="p-1">
              <IconX size={16} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {!search && cities.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {cities.slice(0, 6).map(city => (
              <button
                key={city}
                onClick={() => setSearch(city)}
                className="px-3.5 py-1.5 bg-white/90 backdrop-blur-sm border border-black/5 rounded-full text-xs font-medium text-foreground/80 whitespace-nowrap shadow-sm active:scale-95 transition-transform"
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#f0f0f0]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground font-medium">Cargando mapa...</span>
          </div>
        </div>
      )}

      {mapsLoaded && GOOGLE_MAPS_API_KEY ? (
        <RealMap cars={filtered} selectedCar={selectedCar} onCarSelect={setSelectedCar} />
      ) : (
        <SimulatedMap cars={filtered} selectedCar={selectedCar} onCarSelect={setSelectedCar} />
      )}

      <div className="absolute left-4 bottom-24 z-20">
        <div className="bg-white/95 backdrop-blur-sm border border-black/5 rounded-2xl px-3.5 py-2 shadow-lg shadow-black/5">
          <span className="text-xs font-semibold text-foreground">{filtered.length}</span>
          <span className="text-xs text-muted-foreground ml-1">autos disponibles</span>
        </div>
      </div>

      <button
        className="absolute right-4 bottom-24 z-20 w-12 h-12 bg-white/95 backdrop-blur-sm border border-black/5 rounded-2xl shadow-lg shadow-black/5 flex items-center justify-center active:scale-95 transition-transform"
        onClick={() => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(() => {});
          }
        }}
      >
        <IconNavigation size={20} className="text-primary" />
      </button>

      <div className="absolute bottom-0 left-0 right-0 z-30 pb-20 pointer-events-none">
        <AnimatePresence>
          {selectedCar && (
            <motion.div
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 120, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="px-4 pointer-events-auto"
            >
              <CarCard car={selectedCar} horizontal className="shadow-2xl shadow-black/15 border border-black/5" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
}
