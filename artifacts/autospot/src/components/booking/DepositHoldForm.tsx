import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { IconLoader, IconLock, IconShield } from "@/components/ui/icons";
import { formatCurrency } from "@/lib/format";

function DepositForm({
  depositAmount,
  onSuccess,
  onSkip,
}: {
  depositAmount: number;
  onSuccess: () => void;
  onSkip: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(confirmError.message ?? "Error al autorizar el depósito");
      setLoading(false);
      return;
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-secondary/50 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Depósito en garantía</span>
          <span className="font-bold text-foreground">{formatCurrency(depositAmount)}</span>
        </div>
        <div className="flex items-start gap-2 text-[12px] text-muted-foreground">
          <IconShield size={13} className="shrink-0 mt-0.5 text-emerald-600" />
          <p>
            Este monto <strong className="text-foreground">no se cobra</strong> — solo se bloquea
            temporalmente en tu tarjeta como garantía. Se libera automáticamente al terminar el viaje
            sin daños, en un plazo de 3 a 5 días hábiles.
          </p>
        </div>
      </div>

      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <p className="text-[13px] text-destructive font-medium">{error}</p>
      )}

      <div className="space-y-2">
        <button
          type="submit"
          disabled={loading || !stripe}
          className="w-full h-12 rounded-xl bg-foreground text-background font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
        >
          {loading ? (
            <><IconLoader size={16} /> Autorizando...</>
          ) : (
            <><IconLock size={15} /> Autorizar depósito en garantía</>
          )}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="w-full h-10 rounded-xl border border-border text-muted-foreground text-[13px] font-medium"
        >
          Continuar sin depósito
        </button>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Pago seguro procesado por Stripe · Cifrado SSL
      </p>
    </form>
  );
}

export function DepositHoldForm({
  bookingId,
  depositAmount,
  onSuccess,
  onSkip,
}: {
  bookingId: number;
  depositAmount: number;
  onSuccess: () => void;
  onSkip: () => void;
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
          setLoadError("Stripe no está configurado. Puedes continuar sin depósito.");
          return;
        }
        setStripePromise(loadStripe(publishableKey));
      })
      .catch(() => setLoadError("No se pudo conectar con el sistema de pagos."));

    fetch(`${BASE}/api/stripe/create-deposit-hold`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, amount: depositAmount }),
    })
      .then((r) => r.json())
      .then(({ clientSecret, error }) => {
        if (error) throw new Error(error);
        setClientSecret(clientSecret);
      })
      .catch((err) => {
        console.error("Deposit hold error:", err);
        setLoadError("No se pudo crear el depósito. Puedes continuar sin él.");
      });
  }, [bookingId, depositAmount]);

  if (loadError) {
    return (
      <div className="space-y-4">
        <div className="bg-secondary/50 rounded-2xl p-4">
          <p className="text-[13px] text-muted-foreground">{loadError}</p>
        </div>
        <button
          onClick={onSkip}
          className="w-full h-12 rounded-xl bg-foreground text-background font-bold text-[15px]"
        >
          Continuar
        </button>
      </div>
    );
  }

  if (!stripePromise || !clientSecret) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <IconLoader size={28} className="text-primary" />
        <p className="text-[13px] text-muted-foreground">Preparando el depósito...</p>
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
      <DepositForm
        depositAmount={depositAmount}
        onSuccess={onSuccess}
        onSkip={onSkip}
      />
    </Elements>
  );
}
