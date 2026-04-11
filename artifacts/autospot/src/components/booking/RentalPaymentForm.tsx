import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { IconLoader, IconLock, IconShield, IconCheck } from "@/components/ui/icons";
import { formatCurrency } from "@/lib/format";

function PaymentForm({
  rentalAmount,
  depositAmount,
  onSuccess,
  bookingId,
}: {
  rentalAmount: number;
  depositAmount: number;
  onSuccess: () => void;
  bookingId: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rentalPaid, setRentalPaid] = useState(false);
  const [depositAuthorized, setDepositAuthorized] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Error al procesar el pago");
      setLoading(false);
      return;
    }

    setRentalPaid(true);

    if (depositAmount > 0) {
      try {
        const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
        const res = await fetch(`${BASE}/api/stripe/create-deposit-hold`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId, amount: depositAmount }),
        });
        const data = await res.json();
        if (data.clientSecret) {
          const { error: depError } = await stripe.confirmPayment({
            clientSecret: data.clientSecret,
            confirmParams: { return_url: window.location.href },
            redirect: "if_required",
          });
          if (depError) {
            console.warn("Deposit hold failed (rental still paid):", depError.message);
          } else {
            setDepositAuthorized(true);
          }
        }
      } catch {
        console.warn("Could not create deposit hold, continuing...");
      }
    }

    setLoading(false);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <IconShield size={14} className="text-emerald-600" />
          <span className="font-semibold">Pago seguro con Stripe</span>
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          Tu información de pago está protegida con cifrado de nivel bancario. Rivones nunca almacena los datos de tu tarjeta.
        </p>
      </div>

      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <p className="text-[13px] text-destructive font-medium">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-[#00b8d9] to-[#006680] text-white font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity shadow-lg shadow-primary/25"
      >
        {loading ? (
          <><IconLoader size={16} /> Procesando...</>
        ) : (
          <><IconLock size={15} /> Pagar {formatCurrency(rentalAmount)}</>
        )}
      </button>

      <p className="text-center text-[11px] text-muted-foreground">
        Pago seguro procesado por Stripe · Cifrado SSL
      </p>
    </form>
  );
}

export function RentalPaymentForm({
  bookingId,
  rentalAmount,
  depositAmount,
  onSuccess,
}: {
  bookingId: number;
  rentalAmount: number;
  depositAmount: number;
  onSuccess: () => void;
}) {
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

    fetch(`${BASE}/api/stripe/config`)
      .then((r) => r.json())
      .then(({ publishableKey }) => {
        if (!publishableKey || publishableKey.includes("placeholder")) {
          setLoadError("Stripe no está configurado aún.");
          return;
        }
        setStripePromise(loadStripe(publishableKey));
      })
      .catch(() => setLoadError("No se pudo conectar con el sistema de pagos."));

    fetch(`${BASE}/api/stripe/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: rentalAmount,
        currency: "mxn",
        metadata: { bookingId: String(bookingId), type: "rental_payment" },
      }),
    })
      .then((r) => r.json())
      .then(({ clientSecret: cs, paymentIntentId, error }) => {
        if (error) throw new Error(error);
        setClientSecret(cs);
        fetch(`${BASE}/api/bookings/${bookingId}/rental-intent`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rentalPaymentIntentId: paymentIntentId }),
        }).catch(() => {});
      })
      .catch((err) => {
        console.error("Payment intent error:", err);
        setLoadError("No se pudo preparar el pago.");
      });
  }, [bookingId, rentalAmount]);

  if (loadError) {
    return (
      <div className="space-y-4">
        <div className="bg-secondary/50 rounded-2xl p-4">
          <p className="text-[13px] text-muted-foreground">{loadError}</p>
        </div>
        <button
          onClick={onSuccess}
          className="w-full h-12 rounded-xl bg-foreground text-background font-bold text-[15px]"
        >
          Continuar sin pago en línea
        </button>
      </div>
    );
  }

  if (!stripePromise || !clientSecret) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <IconLoader size={28} className="text-primary" />
        <p className="text-[13px] text-muted-foreground">Preparando el pago...</p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#f43f5e",
            borderRadius: "12px",
            fontFamily: "inherit",
          },
        },
      }}
    >
      <PaymentForm
        rentalAmount={rentalAmount}
        depositAmount={depositAmount}
        onSuccess={onSuccess}
        bookingId={bookingId}
      />
    </Elements>
  );
}
