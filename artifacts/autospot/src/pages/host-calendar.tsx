import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

export default function HostCalendar() {
  const params = useParams<{ carId: string }>();
  const carId = params?.carId ?? "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [blocked, setBlocked] = useState<Date[]>([]);
  const [bookedRanges, setBookedRanges] = useState<{ startDate: string; endDate: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<any>(`/cars/${carId}/availability`);
        setBlocked((data.blockedDates ?? []).map((s: string) => new Date(s)));
        setBookedRanges(data.bookedRanges ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [carId]);

  const bookedDates = bookedRanges.flatMap((r) => {
    const out: Date[] = [];
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) out.push(new Date(d));
    return out;
  });

  async function save() {
    setSaving(true);
    try {
      const isoStrings = blocked.map((d) => d.toISOString().slice(0, 10));
      await apiFetch(`/cars/${carId}/blocked-dates`, {
        method: "PUT",
        body: JSON.stringify({ blockedDates: isoStrings }),
      });
      toast({ title: "Disponibilidad actualizada" });
    } catch (err: any) {
      toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur">
        <button onClick={() => setLocation("/profile")} aria-label="Volver" className="rounded-full p-2 hover:bg-muted">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold">Calendario del auto</h1>
          <p className="text-xs text-muted-foreground">Bloquea días en que NO está disponible</p>
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-4 px-4 py-4">
        <Card className="p-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <DayPicker
              mode="multiple"
              selected={blocked}
              onSelect={(dates) => setBlocked(dates ?? [])}
              disabled={[{ before: new Date() }, ...bookedDates]}
              numberOfMonths={1}
              showOutsideDays
              weekStartsOn={1}
            />
          )}
          <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary"/>Bloqueado</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-yellow-500"/>Reservado</span>
          </div>
        </Card>

        <Button onClick={save} disabled={saving} className="h-12 w-full text-sm font-semibold">
          <Save size={16} className="mr-2" />
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}
