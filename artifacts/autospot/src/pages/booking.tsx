import { useState, useMemo } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useGetCarById } from "@workspace/api-client-react";
import {
  IconChevronLeft, IconShield, IconCheck,
  IconMapPin, IconStar, IconLoader, IconTruck,
} from "@/components/ui/icons";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { RentalPaymentForm } from "@/components/booking/RentalPaymentForm";

export default function Booking() {
  const params = useParams();
  const carId = params.carId!;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const startDate = search.get("startDate") ?? "";
  const endDate = search.get("endDate") ?? "";
  const days = parseInt(search.get("days") ?? "1");

  const { data: car, isLoading } = useGetCarById(carId);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [insurance, setInsurance] = useState(false);
  const [delivery, setDelivery] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ id: number; status: string } | null>(null);
  const [paymentStep, setPaymentStep] = useState<{ bookingId: number; totalAmount: number; depositAmount: number } | null>(null);

  const pricing = useMemo(() => {
    if (!car || !days) return null;
    const subtotal = car.pricePerDay * days;
    const cleaning = car.cleaningFee;
    const service = Math.round(subtotal * 0.12);
    const insuranceFee = insurance ? Math.round(car.pricePerDay * 0.18 * days) : 0;
    const deliveryFee = delivery && car.deliveryFee ? car.deliveryFee : 0;
    const total = subtotal + cleaning + service + insuranceFee + deliveryFee;
    return { subtotal, cleaning, service, insuranceFee, deliveryFee, total };
  }, [car, days, insurance, delivery]);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast({ variant: "destructive", title: "Datos requeridos", description: "Por favor ingresa tu nombre y teléfono" });
      return;
    }
    if (!termsAccepted) {
      toast({ variant: "destructive", title: "Acepta los términos", description: "Debes aceptar los términos y condiciones" });
      return;
    }

    setIsSubmitting(true);
    try {
      const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const res = await fetch(`${BASE}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId,
          renterName: name,
          renterPhone: phone,
          renterEmail: email || null,
          startDate,
          endDate,
          insuranceAdded: insurance,
          deliveryRequested: delivery,
          notes: notes || null,
          termsAccepted: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 409) {
          toast({ variant: "destructive", title: "No disponible", description: "El auto no está disponible para esas fechas. Por favor elige otras." });
          return;
        }
        throw new Error(err.message ?? "Error al crear la reserva");
      }

      const booking = await res.json();

      const depAmt = Number(car?.depositAmount ?? 0);
      const totalAmt = pricing?.total ?? 0;
      if (totalAmt > 0 || depAmt > 0) {
        setPaymentStep({ bookingId: booking.id, totalAmount: totalAmt, depositAmount: depAmt });
      } else {
        setConfirmed({ id: booking.id, status: booking.status });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message ?? "Inténtalo de nuevo" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <IconLoader className="text-primary" size={32} />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Auto no encontrado</p>
        <Link href="/explore"><Button variant="outline">Explorar autos</Button></Link>
      </div>
    );
  }

  if (paymentStep) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 pt-safe py-4 flex items-center gap-3">
          <h1 className="text-[16px] font-bold">Pago de la reserva</h1>
        </div>
        <div className="px-5 py-6 space-y-5">
          <div className="flex items-center gap-3">
            {car && <img src={car.images[0]} alt={car.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />}
            <div>
              <p className="font-semibold text-sm">{car?.title}</p>
              <p className="text-[12px] text-muted-foreground">{startDate} — {endDate} · {days} días</p>
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-2xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Costo de la renta</span>
              <span className="font-bold text-primary">{formatCurrency(paymentStep.totalAmount)}</span>
            </div>
            {paymentStep.depositAmount > 0 && (
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Depósito en garantía</span>
                <span className="font-semibold">{formatCurrency(paymentStep.depositAmount)}</span>
              </div>
            )}
            {paymentStep.depositAmount > 0 && (
              <p className="text-[11px] text-muted-foreground bg-secondary/60 rounded-xl p-2.5 leading-relaxed">
                El depósito se bloquea en tu tarjeta pero <strong>no se cobra</strong>. Se libera en 3–5 días hábiles al devolver el auto sin daños.
              </p>
            )}
          </div>

          <div className="border-t border-border pt-5">
            <RentalPaymentForm
              bookingId={paymentStep.bookingId}
              rentalAmount={paymentStep.totalAmount}
              depositAmount={paymentStep.depositAmount}
              onSuccess={() => setConfirmed({ id: paymentStep.bookingId, status: car?.instantBook ? "confirmed" : "pending" })}
            />
          </div>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
          <IconCheck size={36} className="text-primary" />
        </div>
        <h1 className="text-2xl font-black mb-2">
          {confirmed.status === "confirmed" ? "Reserva confirmada" : "Solicitud enviada"}
        </h1>
        <p className="text-muted-foreground text-sm mb-2">
          {confirmed.status === "confirmed"
            ? "Tu reserva fue aceptada automáticamente. El anfitrión te contactará pronto."
            : "Tu solicitud fue enviada al anfitrión. Recibirás confirmación en breve."}
        </p>
        <p className="text-xs text-muted-foreground mb-6">Reserva #{confirmed.id}</p>

        <div className="bg-card border border-card-border rounded-2xl p-4 w-full max-w-sm mb-6 text-left space-y-2">
          <div className="flex items-center gap-3">
            <img src={car.images[0]} alt={car.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
            <div>
              <p className="font-semibold text-sm">{car.title}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <IconMapPin size={11} /> {car.city}
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-border">
            <span className="text-muted-foreground">Fechas</span>
            <span className="font-medium">{startDate} — {endDate}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total pagado</span>
            <span className="font-bold text-primary">{pricing && formatCurrency(pricing.total)}</span>
          </div>
        </div>

        <div className="flex gap-3 w-full max-w-sm">
          <Button variant="outline" className="flex-1" onClick={() => navigate("/explore")}>
            Seguir explorando
          </Button>
          <Button className="flex-1" onClick={() => navigate("/profile")}>
            Mis viajes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 pt-safe py-4 flex items-center gap-3">
        <button onClick={() => navigate(`/car/${carId}`)} className="p-2 -ml-2 rounded-full hover:bg-secondary">
          <IconChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">Confirmar reserva</h1>
      </div>

      <div className="px-5 py-5 space-y-6">
        {/* Car Summary */}
        <div className="bg-card border border-card-border rounded-2xl p-4">
          <div className="flex gap-3">
            <img src={car.images[0]} alt={car.title} className="w-20 h-16 rounded-xl object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm line-clamp-1">{car.title}</h2>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <IconMapPin size={11} /> {car.city}
              </div>
              {car.rating > 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold mt-1">
                  <IconStar size={10} className="text-amber-500" /> {car.rating.toFixed(1)} ({car.reviewCount} reseñas)
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-4 mt-3 pt-3 border-t border-border text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Recogida</p>
              <p className="font-semibold">{startDate}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entrega</p>
              <p className="font-semibold">{endDate}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duración</p>
              <p className="font-semibold">{days} {days === 1 ? "día" : "días"}</p>
            </div>
          </div>
        </div>

        {/* Renter Info */}
        <div>
          <h3 className="text-base font-bold mb-3">Tus datos</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Nombre completo *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Pérez Rodríguez" className="h-11 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Teléfono (WhatsApp) *</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+52 55 1234 5678" type="tel" className="h-11 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Correo electrónico (opcional)</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@email.com" type="email" className="h-11 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Notas al anfitrión (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Llego al aeropuerto a las 3pm..."
                className="w-full h-20 rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Add-ons */}
        <div>
          <h3 className="text-base font-bold mb-3">Opciones adicionales</h3>
          <div className="space-y-3">
            {/* Insurance */}
            <button
              onClick={() => setInsurance(!insurance)}
              className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-colors ${
                insurance ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <IconShield size={20} className={insurance ? "text-primary shrink-0 mt-0.5" : "text-muted-foreground shrink-0 mt-0.5"} />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-sm">Proteccion Plus</p>
                  {car && <span className="text-sm font-bold text-primary">+{formatCurrency(Math.round(car.pricePerDay * 0.18))}/día</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Cobertura extendida en caso de accidente, robo o daños. Deducible reducido.</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${insurance ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                {insurance && <IconCheck size={12} className="text-white" />}
              </div>
            </button>

            {/* Delivery */}
            {car.deliveryAvailable && (
              <button
                onClick={() => setDelivery(!delivery)}
                className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-colors ${
                  delivery ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <IconTruck size={20} className={delivery ? "text-primary shrink-0 mt-0.5" : "text-muted-foreground shrink-0 mt-0.5"} />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-sm">Entrega a domicilio</p>
                    <span className="text-sm font-bold text-primary">
                      {car.deliveryFee === 0 ? "Gratis" : `+${formatCurrency(car.deliveryFee ?? 0)}`}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">El anfitrión te lleva el auto a tu ubicación.</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${delivery ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                  {delivery && <IconCheck size={12} className="text-white" />}
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Price Breakdown */}
        {pricing && (
          <div className="bg-card border border-card-border rounded-2xl p-4">
            <h3 className="text-base font-bold mb-3">Desglose del precio</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{formatCurrency(car.pricePerDay)} x {days} {days === 1 ? "día" : "días"}</span>
                <span className="font-medium">{formatCurrency(pricing.subtotal)}</span>
              </div>
              {pricing.cleaning > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuota de limpieza</span>
                  <span className="font-medium">{formatCurrency(pricing.cleaning)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tarifa de servicio (12%)</span>
                <span className="font-medium">{formatCurrency(pricing.service)}</span>
              </div>
              {pricing.insuranceFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proteccion Plus</span>
                  <span className="font-medium">{formatCurrency(pricing.insuranceFee)}</span>
                </div>
              )}
              {pricing.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entrega</span>
                  <span className="font-medium">{formatCurrency(pricing.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2.5 border-t border-border">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(pricing.total)}</span>
              </div>
              {car.depositAmount > 0 && (
                <div className="mt-1 border-t border-border pt-2.5 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total a pagar hoy</span>
                    <span className="font-bold text-primary">{formatCurrency(pricing.total)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Depósito en garantía</span>
                    <span className="font-semibold text-foreground">{formatCurrency(car.depositAmount)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground bg-secondary/60 rounded-xl p-2.5 leading-relaxed">
                    El depósito se bloquea en tu tarjeta pero <strong>no se cobra</strong>. Se libera en 3–5 días hábiles al devolver el auto sin daños.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Terms */}
        <button
          onClick={() => setTermsAccepted(!termsAccepted)}
          className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-colors ${
            termsAccepted ? "border-primary bg-primary/5" : "border-border bg-card"
          }`}
        >
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${termsAccepted ? "border-primary bg-primary" : "border-muted-foreground"}`}>
            {termsAccepted && <IconCheck size={12} className="text-white" />}
          </div>
          <p className="text-sm text-muted-foreground">
            Acepto los <span className="text-primary font-semibold">términos y condiciones</span> de Rivones y del anfitrión. Confirmo que tengo licencia de conducir vigente.
          </p>
        </button>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border p-4 pb-safe">
        <div className="flex items-center gap-3">
          {pricing && (
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Total reserva</p>
              <p className="text-lg font-black text-primary">{formatCurrency(pricing.total)}</p>
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-xl font-bold text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
          >
            {isSubmitting ? (
              <><IconLoader size={18} className="mr-2" /> Procesando...</>
            ) : (
              car.instantBook ? "Reservar ahora" : "Solicitar reserva"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
