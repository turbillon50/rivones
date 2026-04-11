import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { BottomNav } from "@/components/layout/BottomNav";
import { IconArrowLeft, IconNavigation, IconX, IconPlus, IconMinus } from "@/components/ui/icons";
import { motion, AnimatePresence } from "framer-motion";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

const MEXICO_BOUNDS = { north: 33.0, south: 14.0, west: -118.5, east: -86.0 };

const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ visibility: "on" }, { color: "#e0e0e0" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#888888" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", stylers: [{ visibility: "simplified" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e8f5e9" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f8d7da" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#f1aeb5" }, { weight: 0.5 }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#fafafa" }] },
  { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c5d8e8" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#f0f0f0" }] },
];

const POPULAR_ROUTES = [
  { from: "Ciudad de México", to: "Acapulco, Guerrero", emoji: "🏖️", time: "~4h", km: "380 km" },
  { from: "Ciudad de México", to: "Valle de Bravo, Estado de México", emoji: "🌲", time: "~2h", km: "155 km" },
  { from: "Cancún", to: "Tulum, Quintana Roo", emoji: "🏝️", time: "~2h", km: "130 km" },
  { from: "Guadalajara", to: "Puerto Vallarta, Jalisco", emoji: "🌅", time: "~4.5h", km: "330 km" },
  { from: "Monterrey", to: "Santiago, Nuevo León", emoji: "⛰️", time: "~45min", km: "35 km" },
  { from: "Mérida", to: "Chichén Itzá, Yucatán", emoji: "🏛️", time: "~1.5h", km: "120 km" },
];

interface RouteResult {
  distance: string;
  duration: string;
  startAddress: string;
  endAddress: string;
  steps: Array<{ instruction: string; distance: string; duration: string }>;
}

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

function RouteInput({ label, value, onChange, placeholder, color }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full shrink-0 ${color}`} />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
      />
      {value && (
        <button onClick={() => onChange("")} className="p-0.5">
          <IconX size={14} className="text-muted-foreground/50" />
        </button>
      )}
    </div>
  );
}

export default function RoutePlanner() {
  const [, setLocation] = useLocation();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [stops, setStops] = useState<string[]>([]);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [error, setError] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const mapsLoaded = useGoogleMaps(GOOGLE_MAPS_API_KEY);

  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || mapInstanceRef.current) return;
    const g = (window as any).google;
    mapInstanceRef.current = new g.maps.Map(mapRef.current, {
      center: { lat: 23.6345, lng: -102.5528 },
      zoom: 5,
      minZoom: 5,
      maxZoom: 18,
      restriction: { latLngBounds: MEXICO_BOUNDS, strictBounds: true },
      styles: MAP_STYLE,
      disableDefaultUI: true,
      gestureHandling: "greedy",
      clickableIcons: false,
    });

    directionsRendererRef.current = new g.maps.DirectionsRenderer({
      map: mapInstanceRef.current,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: "#f43f5e",
        strokeWeight: 5,
        strokeOpacity: 0.85,
      },
      markerOptions: {
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          fillColor: "#f43f5e",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
          scale: 8,
        },
      },
    });
  }, [mapsLoaded]);

  const calculateRoute = useCallback(async () => {
    if (!origin || !destination) return;
    const g = (window as any).google;
    if (!g?.maps) return;

    setIsCalculating(true);
    setError("");
    setRouteResult(null);

    const directionsService = new g.maps.DirectionsService();

    const waypoints = stops.filter(s => s.trim()).map(s => ({
      location: s,
      stopover: true,
    }));

    try {
      const result = await directionsService.route({
        origin,
        destination,
        waypoints,
        optimizeWaypoints: waypoints.length > 1,
        travelMode: g.maps.TravelMode.DRIVING,
        region: "mx",
      });

      directionsRendererRef.current?.setDirections(result);

      const route = result.routes[0];
      let totalDistance = 0;
      let totalDuration = 0;
      const allSteps: RouteResult["steps"] = [];

      route.legs.forEach((leg: any) => {
        totalDistance += leg.distance.value;
        totalDuration += leg.duration.value;
        leg.steps.forEach((step: any) => {
          allSteps.push({
            instruction: step.instructions.replace(/<[^>]*>/g, ""),
            distance: step.distance.text,
            duration: step.duration.text,
          });
        });
      });

      setRouteResult({
        distance: totalDistance >= 1000 ? `${(totalDistance / 1000).toFixed(0)} km` : `${totalDistance} m`,
        duration: formatDuration(totalDuration),
        startAddress: route.legs[0].start_address,
        endAddress: route.legs[route.legs.length - 1].end_address,
        steps: allSteps,
      });
    } catch (err: any) {
      if (err.code === "NOT_FOUND" || err.message?.includes("NOT_FOUND")) {
        setError("No se encontró una ruta entre esos puntos. Verifica las direcciones.");
      } else if (err.code === "ZERO_RESULTS") {
        setError("No hay ruta disponible entre esos destinos.");
      } else {
        setError("Error al calcular la ruta. Intenta de nuevo.");
      }
    } finally {
      setIsCalculating(false);
    }
  }, [origin, destination, stops]);

  const addStop = () => {
    if (stops.length < 3) setStops([...stops, ""]);
  };

  const updateStop = (idx: number, val: string) => {
    const updated = [...stops];
    updated[idx] = val;
    setStops(updated);
  };

  const removeStop = (idx: number) => {
    setStops(stops.filter((_, i) => i !== idx));
  };

  const selectPopularRoute = (route: typeof POPULAR_ROUTES[0]) => {
    setOrigin(route.from);
    setDestination(route.to);
    setStops([]);
    setTimeout(() => calculateRoute(), 100);
  };

  useEffect(() => {
    if (origin && destination && mapsLoaded) {
      const timer = setTimeout(calculateRoute, 500);
      return () => clearTimeout(timer);
    }
  }, [origin, destination, stops, mapsLoaded]);

  return (
    <div className="h-[100dvh] flex flex-col relative overflow-hidden">
      {mapsLoaded && GOOGLE_MAPS_API_KEY && (
        <div ref={mapRef} className="absolute inset-0" />
      )}

      {(!mapsLoaded || !GOOGLE_MAPS_API_KEY) && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#e8eef5] to-[#dde5ee]">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "radial-gradient(circle, #000 0.5px, transparent 0.5px)",
            backgroundSize: "24px 24px",
          }} />
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4">
        <div className="bg-white/95 backdrop-blur-xl border border-black/5 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
            <button onClick={() => setLocation("/explore")} className="p-1 -ml-1">
              <IconArrowLeft size={20} className="text-foreground" />
            </button>
            <h1 className="text-sm font-bold text-foreground">Planear ruta</h1>
          </div>

          <div className="px-4 pb-3 space-y-2.5">
            <div className="relative pl-1.5">
              <div className="absolute left-[7px] top-[18px] bottom-[18px] w-[1.5px] bg-gradient-to-b from-emerald-400 via-muted-foreground/20 to-primary" />
              <div className="space-y-2">
                <RouteInput
                  label="Origen"
                  value={origin}
                  onChange={setOrigin}
                  placeholder="¿De dónde sales?"
                  color="bg-emerald-500"
                />

                {stops.map((stop, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0 bg-amber-400 border-2 border-amber-500" />
                    <input
                      type="text"
                      value={stop}
                      onChange={e => updateStop(idx, e.target.value)}
                      placeholder={`Parada ${idx + 1}`}
                      className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
                    />
                    <button onClick={() => removeStop(idx)} className="p-0.5">
                      <IconX size={14} className="text-muted-foreground/50" />
                    </button>
                  </div>
                ))}

                <RouteInput
                  label="Destino"
                  value={destination}
                  onChange={setDestination}
                  placeholder="¿A dónde vas?"
                  color="bg-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {stops.length < 3 && (
                <button
                  onClick={addStop}
                  className="flex items-center gap-1.5 text-xs text-primary font-medium px-2.5 py-1.5 bg-primary/5 rounded-lg active:scale-95 transition-transform"
                >
                  <IconPlus size={12} className="text-primary" />
                  Parada
                </button>
              )}

              {isCalculating && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Calculando...
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"
          >
            <p className="text-xs text-red-600">{error}</p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {routeResult && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute bottom-20 left-0 right-0 z-20 px-4"
          >
            <div className="bg-white/95 backdrop-blur-xl border border-black/5 rounded-2xl shadow-xl shadow-black/10 overflow-hidden">
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-foreground">{routeResult.duration}</span>
                      <span className="text-sm text-muted-foreground">· {routeResult.distance}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {routeResult.startAddress.split(",")[0]} → {routeResult.endAddress.split(",")[0]}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSteps(!showSteps)}
                    className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-lg active:scale-95 transition-transform"
                  >
                    {showSteps ? "Ocultar" : "Detalle"}
                  </button>
                </div>

                <div className="flex gap-3 mt-3">
                  <div className="flex-1 bg-emerald-50 rounded-xl px-3 py-2 text-center">
                    <p className="text-[10px] text-emerald-600 font-medium">Gasolina est.</p>
                    <p className="text-sm font-bold text-emerald-700">
                      ${estimateFuel(routeResult.distance)}
                    </p>
                  </div>
                  <div className="flex-1 bg-blue-50 rounded-xl px-3 py-2 text-center">
                    <p className="text-[10px] text-blue-600 font-medium">Casetas est.</p>
                    <p className="text-sm font-bold text-blue-700">
                      ${estimateTolls(routeResult.distance)}
                    </p>
                  </div>
                  <div className="flex-1 bg-purple-50 rounded-xl px-3 py-2 text-center">
                    <p className="text-[10px] text-purple-600 font-medium">Costo total</p>
                    <p className="text-sm font-bold text-purple-700">
                      ${estimateFuel(routeResult.distance) + estimateTolls(routeResult.distance)}
                    </p>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {showSteps && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/50 px-4 py-3 max-h-48 overflow-y-auto">
                      <div className="space-y-2">
                        {routeResult.steps.slice(0, 20).map((step, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-[9px] font-bold text-primary">{i + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-foreground leading-relaxed">{step.instruction}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{step.distance} · {step.duration}</p>
                            </div>
                          </div>
                        ))}
                        {routeResult.steps.length > 20 && (
                          <p className="text-[10px] text-muted-foreground text-center">
                            +{routeResult.steps.length - 20} pasos más
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!routeResult && !origin && !destination && (
        <div className="absolute bottom-20 left-0 right-0 z-20 px-4">
          <div className="bg-white/95 backdrop-blur-xl border border-black/5 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
            <div className="px-4 pt-3 pb-1">
              <h3 className="text-sm font-bold text-foreground">Rutas populares</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Toca una para calcularla al instante</p>
            </div>
            <div className="px-3 pb-3 mt-1 space-y-1">
              {POPULAR_ROUTES.map((route, idx) => (
                <button
                  key={idx}
                  onClick={() => selectPopularRoute(route)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 active:scale-[0.98] transition-all text-left"
                >
                  <span className="text-lg">{route.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {route.from} → {route.to.split(",")[0]}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{route.time} · {route.km}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40 shrink-0">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

function estimateFuel(distanceStr: string): number {
  const km = parseInt(distanceStr.replace(/[^\d]/g, ""));
  if (isNaN(km)) return 0;
  const liters = km / 12;
  return Math.round(liters * 24);
}

function estimateTolls(distanceStr: string): number {
  const km = parseInt(distanceStr.replace(/[^\d]/g, ""));
  if (isNaN(km)) return 0;
  if (km < 50) return 0;
  return Math.round((km / 100) * 180);
}
