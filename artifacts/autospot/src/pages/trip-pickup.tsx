import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhotoPicker } from "@/components/upload/PhotoPicker";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera } from "lucide-react";

export default function TripPickup() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = params?.bookingId ?? "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<string[]>([]);
  const [odometer, setOdometer] = useState("");
  const [fuel, setFuel] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (photos.length < 4) {
      toast({ title: "Sube al menos 4 fotos", description: "Frente, ambos costados y posterior", variant: "destructive" });
      return;
    }
    if (!odometer) {
      toast({ title: "Ingresa el kilometraje", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch(`/bookings/${bookingId}/inspections`, {
        method: "POST",
        body: JSON.stringify({
          type: "pickup",
          odometerKm: parseInt(odometer),
          fuelLevel: fuel || null,
          photos,
          notes: notes || null,
        }),
      });
      toast({ title: "Inspección registrada", description: "¡Buen viaje!" });
      setLocation("/profile");
    } catch (err: any) {
      toast({ title: "No se pudo registrar", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur">
        <button onClick={() => history.back()} aria-label="Volver" className="rounded-full p-2 hover:bg-muted">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-base font-semibold">Recogida del auto</h1>
          <p className="text-xs text-muted-foreground">Reserva #{bookingId}</p>
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-4 px-4 py-4">
        <Card className="border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
          <Camera size={14} className="inline-block mr-1.5 text-primary" />
          Documenta el estado del auto antes de salir. Estas fotos protegen tanto al anfitrión como a ti
          en caso de daños o reclamos.
        </Card>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Fotos del auto (mínimo 4)</Label>
          <p className="text-xs text-muted-foreground">Incluye frente, los dos costados y la parte trasera. Suma daños existentes si los hay.</p>
          <PhotoPicker value={photos} onChange={setPhotos} maxFiles={10} accept="image/*" />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold" htmlFor="odo">Kilometraje al recoger</Label>
          <Input id="odo" type="number" inputMode="numeric" value={odometer} onChange={(e) => setOdometer(e.target.value)} placeholder="Ej. 45230" />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold" htmlFor="fuel">Nivel de combustible</Label>
          <select
            id="fuel"
            value={fuel}
            onChange={(e) => setFuel(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Selecciona…</option>
            <option value="full">Lleno</option>
            <option value="3/4">3/4</option>
            <option value="1/2">Medio</option>
            <option value="1/4">1/4</option>
            <option value="empty">Vacío</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold" htmlFor="notes">Notas (opcional)</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Rayón en cofrón izquierdo, llanta delantera tiene poca presión…"
          />
        </div>

        <Button onClick={submit} disabled={submitting} className="h-12 w-full text-sm font-semibold">
          {submitting ? "Registrando…" : "Iniciar viaje"}
        </Button>
      </div>
    </div>
  );
}
