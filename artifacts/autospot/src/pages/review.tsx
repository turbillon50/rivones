import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star } from "lucide-react";

interface Booking {
  id: number;
  carId: number;
  renterId: string;
  status: string;
}

export default function ReviewPage() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = params?.bookingId ?? "";
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<Booking>(`/bookings/${bookingId}`).then(setBooking).catch(() => setBooking(null));
  }, [bookingId]);

  const isHost = booking && user?.id !== booking.renterId;
  const reviewerType = isHost ? "host" : "renter";

  async function submit() {
    if (comment.trim().length < 10) {
      toast({ title: "El comentario debe tener al menos 10 caracteres", variant: "destructive" });
      return;
    }
    if (!booking) return;
    setSubmitting(true);
    try {
      await apiFetch(`/cars/${booking.carId}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          bookingId: booking.id,
          reviewerType,
          reviewerName: user?.name ?? "Usuario",
        }),
      });
      toast({ title: "¡Reseña publicada!", description: "Tu reseña queda visible cuando tu contraparte también publique o pasen 14 días." });
      setLocation("/profile");
    } catch (err: any) {
      toast({ title: "No se pudo publicar", description: err.message, variant: "destructive" });
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
          <h1 className="text-base font-semibold">{isHost ? "Reseña al arrendatario" : "Reseña al auto"}</h1>
          <p className="text-xs text-muted-foreground">Reserva #{bookingId}</p>
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-4 px-4 py-6">
        <Card className="space-y-4 p-5">
          <div>
            <p className="mb-2 text-sm font-semibold">¿Cómo lo calificas?</p>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  aria-label={`${n} estrellas`}
                  className="rounded-full p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={n <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Tu reseña</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder={isHost ? "¿Cómo cuidó el auto? ¿Lo recomendarías?" : "¿Cómo estaba el auto? ¿Cómo fue la entrega? ¿La atención del anfitrión?"}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">{comment.length}/2000</p>
          </div>

          <p className="rounded-md bg-muted p-2 text-[11px] leading-relaxed text-muted-foreground">
            Para evitar represalias, tu reseña queda oculta hasta que tu contraparte también publique o pasen
            14 días. Después se mostrarán ambas al mismo tiempo.
          </p>

          <Button onClick={submit} disabled={submitting} className="h-11 w-full text-sm font-semibold">
            {submitting ? "Publicando…" : "Publicar reseña"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
