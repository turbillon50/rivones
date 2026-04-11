import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useCreateCar, getGetCarsQueryKey } from "@workspace/api-client-react";
import {
  IconCamera, IconChevronLeft, IconMapPin, IconLoader, IconInfo, IconZap,
  IconTruck, IconCheck, IconX,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { BottomNav } from "@/components/layout/BottomNav";
import { useUpload } from "@workspace/object-storage-web";

const FEATURE_OPTIONS = [
  "GPS", "Bluetooth", "CarPlay", "Android Auto", "Cámara Trasera", "Cámara 360°",
  "Techo Solar", "Asientos Calefaccionados", "Asientos Ventilados",
  "Tracción AWD", "Tracción 4x4", "Crucero Adaptativo", "Sensor Estacionamiento",
  "USB", "Pantalla Táctil", "Carga Inalámbrica",
];

const CITIES = ["Ciudad de México", "Guadalajara", "Monterrey", "Cancún", "Mérida", "Puebla", "Tijuana", "Querétaro", "Hermosillo", "Otra"];

export default function Upload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [instantBook, setInstantBook] = useState(true);
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  const { uploadFile } = useUpload({
    basePath: `${BASE}/api/storage`,
  });

  const [formData, setFormData] = useState({
    title: "",
    pricePerDay: "",
    depositAmount: "",
    cleaningFee: "",
    deliveryFee: "",
    address: "",
    city: "",
    description: "",
    images: [] as string[],
    category: "economico",
    fuelPolicy: "full_to_full",
    mileageLimit: "",
    minDays: "1",
    specs: {
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      km: 0,
      transmission: "automatic" as "automatic" | "manual" | "cvt",
      fuel: "gasoline" as "gasoline" | "diesel" | "hybrid" | "electric",
      color: "",
      doors: 4,
      seats: 5,
    }
  });

  const createCar = useCreateCar({
    mutation: {
      onSuccess: (newCar) => {
        toast({
          title: "Auto publicado",
          description: "Tu auto ya está disponible para rentar.",
        });
        queryClient.invalidateQueries({ queryKey: getGetCarsQueryKey() });
        setLocation(`/car/${newCar.id}`);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error al publicar",
          description: "Ocurrió un problema, intenta nuevamente.",
        });
      }
    }
  });

  const handleField = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleSpec = (field: string, value: any) => setFormData(prev => ({ ...prev, specs: { ...prev.specs, [field]: value } }));

  const toggleFeature = (f: string) => {
    setSelectedFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhoto(true);
    const newImages = [...formData.images];

    for (const file of Array.from(files)) {
      if (newImages.length >= 10) break;
      try {
        const result = await uploadFile(file);
        if (result) {
          const imageUrl = `${BASE}/api/storage/objects/${result.objectPath.replace(/^\/objects\//, "")}`;
          newImages.push(imageUrl);
        }
      } catch {
        toast({ variant: "destructive", title: "Error", description: `No se pudo subir ${file.name}` });
      }
    }

    setFormData(prev => ({ ...prev, images: newImages }));
    setUploadingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = () => {
    if (!formData.pricePerDay || !formData.city || !formData.specs.brand || !formData.specs.model) {
      toast({ variant: "destructive", title: "Datos incompletos", description: "Por favor completa todos los campos obligatorios." });
      return;
    }
    if (formData.images.length < 1) {
      toast({ variant: "destructive", title: "Fotos requeridas", description: "Sube al menos una foto de tu auto." });
      return;
    }

    createCar.mutate({
      title: `${formData.specs.brand} ${formData.specs.model} ${formData.specs.year}`.trim() || formData.title,
      pricePerDay: parseFloat(formData.pricePerDay),
      depositAmount: parseFloat(formData.depositAmount) || 0,
      location: { lat: 19.4326, lng: -99.1332 },
      address: formData.address || formData.city,
      city: formData.city,
      images: formData.images,
      specs: formData.specs,
      description: formData.description,
      features: selectedFeatures,
      tags: [],
      category: formData.category,
      status: "active",
      featured: false,
      badge: null,
      instantBook,
      deliveryAvailable,
      fuelPolicy: formData.fuelPolicy,
      cleaningFee: parseFloat(formData.cleaningFee) || 0,
    } as any);
  };

  const STEPS = ["Auto", "Precios", "Detalles", "Publicar"];

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 pt-safe py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => step > 1 ? setStep(step - 1) : setLocation("/explore")} className="p-1.5 -ml-1.5 rounded-full hover:bg-secondary">
            <IconChevronLeft size={22} />
          </button>
          <h1 className="text-lg font-bold">Publica tu auto</h1>
        </div>
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">Paso {step} de {STEPS.length}: {STEPS[step - 1]}</p>
      </div>

      <div className="px-5 py-5">
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-card border border-card-border rounded-2xl p-4 space-y-1 mb-2">
              <div className="flex items-center gap-2 text-primary">
                <IconInfo size={16} />
                <p className="text-sm font-semibold">Datos del vehículo</p>
              </div>
              <p className="text-xs text-muted-foreground">Ingresa la información básica de tu auto</p>
            </div>

            {[
              { label: "Marca *", field: "brand", placeholder: "Toyota, BMW, Ford..." },
              { label: "Modelo *", field: "model", placeholder: "Corolla, X5, Ranger..." },
            ].map(({ label, field, placeholder }) => (
              <div key={field}>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{label}</label>
                <Input value={(formData.specs as any)[field]} onChange={(e) => handleSpec(field, e.target.value)} placeholder={placeholder} className="h-11 rounded-xl" />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Año *</label>
                <Input type="number" value={formData.specs.year} onChange={(e) => handleSpec("year", parseInt(e.target.value))} className="h-11 rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Kilometraje *</label>
                <Input type="number" value={formData.specs.km || ""} onChange={(e) => handleSpec("km", parseInt(e.target.value))} placeholder="28000" className="h-11 rounded-xl" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Transmisión</label>
              <Select value={formData.specs.transmission} onValueChange={(v) => handleSpec("transmission", v)}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automático</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="cvt">CVT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Combustible</label>
              <Select value={formData.specs.fuel} onValueChange={(v) => handleSpec("fuel", v)}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasoline">Gasolina</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="hybrid">Híbrido</SelectItem>
                  <SelectItem value="electric">Eléctrico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Color</label>
                <Input value={formData.specs.color} onChange={(e) => handleSpec("color", e.target.value)} placeholder="Blanco" className="h-11 rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Asientos</label>
                <Input type="number" value={formData.specs.seats} onChange={(e) => handleSpec("seats", parseInt(e.target.value))} placeholder="5" className="h-11 rounded-xl" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Ciudad *</label>
              <Select value={formData.city} onValueChange={(v) => handleField("city", v)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Selecciona ciudad..." />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Dirección de entrega</label>
              <div className="relative">
                <IconMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input value={formData.address} onChange={(e) => handleField("address", e.target.value)} placeholder="Colonia, zona..." className="pl-9 h-11 rounded-xl" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Categoría</label>
              <Select value={formData.category} onValueChange={(v) => handleField("category", v)}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="economico">Económico</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="deportivo">Deportivo</SelectItem>
                  <SelectItem value="lujo">Lujo</SelectItem>
                  <SelectItem value="trabajo">Trabajo</SelectItem>
                  <SelectItem value="van">Van/Familiar</SelectItem>
                  <SelectItem value="electrico">Eléctrico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setStep(2)} className="w-full h-12 rounded-xl font-bold">Continuar</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-card border border-card-border rounded-2xl p-4 space-y-1 mb-2">
              <div className="flex items-center gap-2 text-primary">
                <IconInfo size={16} />
                <p className="text-sm font-semibold">Fija tu precio</p>
              </div>
              <p className="text-xs text-muted-foreground">Los precios son en pesos mexicanos (MXN)</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Precio por día (MXN) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                <Input type="number" value={formData.pricePerDay} onChange={(e) => handleField("pricePerDay", e.target.value)} placeholder="800" className="pl-7 h-12 rounded-xl text-lg font-bold" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Autos similares en tu ciudad cobran entre $600–$1,500/día</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Depósito de seguridad (MXN)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                <Input type="number" value={formData.depositAmount} onChange={(e) => handleField("depositAmount", e.target.value)} placeholder="3000" className="pl-7 h-11 rounded-xl" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Monto reembolsable al finalizar el viaje</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Cuota de limpieza (MXN)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                <Input type="number" value={formData.cleaningFee} onChange={(e) => handleField("cleaningFee", e.target.value)} placeholder="200" className="pl-7 h-11 rounded-xl" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Días mínimos de renta</label>
              <Select value={formData.minDays} onValueChange={(v) => handleField("minDays", v)}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 5, 7].map(d => <SelectItem key={d} value={String(d)}>{d} {d === 1 ? "día" : "días"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Política de combustible</label>
              <Select value={formData.fuelPolicy} onValueChange={(v) => handleField("fuelPolicy", v)}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_to_full">Lleno a lleno</SelectItem>
                  <SelectItem value="same_fuel_level">Mismo nivel</SelectItem>
                  <SelectItem value="charged">Cargado al 100% (eléctrico)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Instant Book */}
            <button
              onClick={() => setInstantBook(!instantBook)}
              className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-colors ${instantBook ? "border-primary bg-primary/5" : "border-border bg-card"}`}
            >
              <IconZap size={20} className={instantBook ? "text-amber-500 shrink-0 mt-0.5" : "text-muted-foreground shrink-0 mt-0.5"} />
              <div className="flex-1">
                <p className="font-semibold text-sm">Reserva inmediata</p>
                <p className="text-xs text-muted-foreground mt-0.5">Los renters pueden reservar sin tu aprobación. Aumenta tus reservas.</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${instantBook ? "border-amber-500 bg-amber-500" : "border-muted-foreground"}`}>
                {instantBook && <IconCheck size={12} className="text-white" />}
              </div>
            </button>

            {/* Delivery */}
            <button
              onClick={() => setDeliveryAvailable(!deliveryAvailable)}
              className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-colors ${deliveryAvailable ? "border-primary bg-primary/5" : "border-border bg-card"}`}
            >
              <IconTruck size={20} className={deliveryAvailable ? "text-primary shrink-0 mt-0.5" : "text-muted-foreground shrink-0 mt-0.5"} />
              <div className="flex-1">
                <p className="font-semibold text-sm">Ofrecer entrega a domicilio</p>
                <p className="text-xs text-muted-foreground mt-0.5">Entregar el auto en la ubicación del renter</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${deliveryAvailable ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                {deliveryAvailable && <IconCheck size={12} className="text-white" />}
              </div>
            </button>

            {deliveryAvailable && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Precio de entrega (0 = gratis)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                  <Input type="number" value={formData.deliveryFee} onChange={(e) => handleField("deliveryFee", e.target.value)} placeholder="0" className="pl-7 h-11 rounded-xl" />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl">Atrás</Button>
              <Button onClick={() => setStep(3)} className="flex-1 h-12 rounded-xl font-bold">Continuar</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="bg-card border border-card-border rounded-2xl p-4 space-y-1 mb-2">
              <div className="flex items-center gap-2 text-primary">
                <IconCamera size={16} />
                <p className="text-sm font-semibold">Fotos y descripción</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Descripción del auto</label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleField("description", e.target.value)}
                placeholder="Describe tu auto: características especiales, estado de conservación, qué lo hace único..."
                className="rounded-xl resize-none"
                rows={4}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Características incluidas</label>
              <div className="flex flex-wrap gap-2">
                {FEATURE_OPTIONS.map((f) => (
                  <button
                    key={f}
                    onClick={() => toggleFeature(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selectedFeatures.includes(f)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                    }`}
                  >
                    {selectedFeatures.includes(f) && <span className="mr-1">✓</span>}
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Fotos de tu auto *</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoPick}
              />
              <div className="grid grid-cols-3 gap-2">
                {formData.images.length < 10 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="aspect-square bg-secondary/50 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {uploadingPhoto ? <IconLoader size={20} className="text-primary" /> : <IconCamera size={20} />}
                    <p className="text-xs mt-1">{uploadingPhoto ? "Subiendo..." : "Agregar"}</p>
                  </button>
                )}
                {formData.images.map((img, i) => (
                  <div key={i} className="aspect-square bg-muted rounded-xl overflow-hidden border border-border relative group">
                    <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <IconX size={12} />
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                        <p className="text-[10px] text-white font-semibold">Portada</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {formData.images.length}/10 fotos · Usa fotos de buena calidad. Un auto con buenas fotos recibe 3x más reservas.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 rounded-xl">Atrás</Button>
              <Button onClick={() => setStep(4)} className="flex-1 h-12 rounded-xl font-bold">Continuar</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
              <h2 className="font-bold text-base">Resumen de tu publicación</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auto</span>
                  <span className="font-medium">{formData.specs.brand} {formData.specs.model} {formData.specs.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ciudad</span>
                  <span className="font-medium">{formData.city || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio/día</span>
                  <span className="font-bold text-primary">${formData.pricePerDay || "0"} MXN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reserva inmediata</span>
                  <span className={`font-medium ${instantBook ? "text-emerald-600" : "text-muted-foreground"}`}>{instantBook ? "Sí" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entrega</span>
                  <span className="font-medium">{deliveryAvailable ? "Sí" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Características</span>
                  <span className="font-medium">{selectedFeatures.length} seleccionadas</span>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
              <p className="text-sm font-semibold text-primary mb-1">Tus ganancias estimadas</p>
              <p className="text-2xl font-black text-primary">${Math.round(parseFloat(formData.pricePerDay || "0") * 0.8 * 10).toLocaleString()} MXN/mes</p>
              <p className="text-xs text-muted-foreground mt-1">Estimado con 10 días de renta. Rivones retiene el 20% de comisión.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1 h-12 rounded-xl">Atrás</Button>
              <Button
                onClick={handleSubmit}
                disabled={createCar.isPending}
                className="flex-1 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
              >
                {createCar.isPending ? (
                  <><IconLoader size={18} className="mr-2" /> Publicando...</>
                ) : "Publicar ahora"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
