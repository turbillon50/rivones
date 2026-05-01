import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhotoPicker } from "@/components/upload/PhotoPicker";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShieldCheck, AlertTriangle } from "lucide-react";

export default function TripReturn() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = params?.bookingId ?? "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<string[]>([]);
  const [odometer, setOdometer] = useState("");
  const [fuel, setFuel] = useState("");
  const [notes, setNotes] = useState("");
  const [hasDamage, setHasDamage] = useState(false);
  const [damageReport, setDamageReport] = useState("");
  const [damageAmount, setDamageAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (photos.length < 4) {
      toast({ title: "Sube al menos 4 fotos", variant: "destructive" });
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
          type: "return",
          odometerKm: parseInt(odometer),
          fuelLevel: fuel || null,
          photos,
          notes: notes || null,
          damageReport: hasDamage ? damageReport : null,
          damageAmount: hasDamage && damageAmount ? parseFloat(damageAmount) : null,
        }),
      });

      // If no damage, automatically release the deposit
      if (!hasDamage) {
        try {
          await apiFetch(`/stripe/release-deposit/${bookingId}`, { method: "POST" });
        } catch {
          // Host needs to release manually if there's an error
        }
      }

      toast({
        title: hasDamage ? "Reporte enviado" : "¡Viaje terminado! ✓",
        description: hasDamage ? "El equipo Rivones revisará el caso." : "Depósito liberado.",
      });
      setLocation(`/booking/${bookingId}/review`);
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
          <h1 className="text-base font-semibold">Devolución del auto</h1>
          <p className="text-xs text-muted-foreground">Reserva #{bookingId}</p>
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-4 px-4 py-4">
        <Card className="border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck size={14} className="mr-1.5 inline-block text-primary" />
          Si el auto regresa sin daños, tu depósito en garantía se libera automáticamente. Si reportas
          daños, el depósito queda retenido hasta que un asesor revise el caso.
        </Card>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Fotos del auto al regresar</Label>
          <PhotoPicker value={photos} onChange={setPhotos} maxFiles={10} accept="image/*" />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold" htmlFor="odo">Kilometraje final</Label>
          <Input id="odo" type="number" inputMode="numeric" value={odometer} onChange={(e) => setOdometer(e.target.value)} />
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

        <div className="space-y-2 rounded-xl border border-border bg-card p-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={hasDamage}
              onChange={(e) => setHasDamage(e.target.checked)}
              className="h-4 w-4"
            />
            <AlertTriangle size={14} className="text-yellow-500" />
            Reportar daños
          </label>
          {hasDamage && (
            <>
              <textarea
                value={damageReport}
                onChange={(e) => setDamageReport(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Describe los daños con detalle…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <div className="space-y-1">
                <Label className="text-xs">Monto estimado del daño (MXN)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={damageAmount}
                  onChange={(e) => setDamageAmount(e.target.value)}
                  placeholder="2500"
                />
              </div>
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold" htmlFor="notes">Notas (opcional)</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={1000}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <Button onClick={submit} disabled={submitting} className="h-12 w-full text-sm font-semibold">
          {submitting ? "Registrando…" : "Finalizar viaje"}
        </Button>
      </div>
    </div>
  );
}
