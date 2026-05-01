import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api";
import { PhotoPicker } from "@/components/upload/PhotoPicker";
import { CheckCircle2, Clock, AlertTriangle, ArrowLeft } from "lucide-react";

interface MeResponse {
  id: string | null;
  role?: string;
  licenseStatus?: string;
  ineStatus?: string;
}

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: any }> = {
  none:     { label: "Falta subir",        cls: "bg-muted text-muted-foreground",          icon: AlertTriangle },
  pending:  { label: "En revisión",        cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400", icon: Clock },
  verified: { label: "Verificado",         cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 },
  rejected: { label: "Rechazado",          cls: "bg-red-500/15 text-red-700 dark:text-red-400",            icon: AlertTriangle },
};

export default function KycPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<MeResponse>("/users/me");
      setMe(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const role = me?.role ?? "renter";
  const showIne = role === "host" || role === "both";

  async function submitDoc(category: "license" | "ine", paths: string[]) {
    if (paths.length === 0) {
      toast({ title: "Sube al menos una foto", variant: "destructive" });
      return;
    }
    try {
      await apiFetch("/documents", {
        method: "POST",
        body: JSON.stringify({
          category,
          label: category === "license" ? "Licencia de conducir" : "INE / Identificación oficial",
          images: paths,
        }),
      });
      toast({ title: "Documento enviado", description: "Lo revisaremos en menos de 24 hrs." });
      await refresh();
    } catch (err: any) {
      toast({ title: "No se pudo enviar", description: err.message, variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur">
        <button onClick={() => setLocation("/profile")} aria-label="Volver" className="rounded-full p-2 hover:bg-muted">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-base font-semibold">Verificación de identidad</h1>
          <p className="text-xs text-muted-foreground">Para renta segura en todo México</p>
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-4 px-4 py-6">
        {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}

        {!loading && (
          <>
            <KycCard
              title="Licencia de conducir"
              subtitle="Necesaria para reservar autos"
              status={me?.licenseStatus ?? "none"}
              hint="Sube una foto clara del frente Y reverso de tu licencia mexicana o extranjera (vigencia mínima 1 año)."
              onSubmit={(paths) => submitDoc("license", paths)}
              maxFiles={2}
            />

            {showIne && (
              <KycCard
                title="Identificación oficial (INE / Pasaporte)"
                subtitle="Necesaria para publicar autos como anfitrión"
                status={me?.ineStatus ?? "none"}
                hint="Sube frente y reverso de tu INE vigente, o la página principal de tu pasaporte."
                onSubmit={(paths) => submitDoc("ine", paths)}
                maxFiles={2}
              />
            )}

            <Card className="border-dashed border-primary/30 bg-primary/5 p-4 text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground">¿Por qué pedimos esto?</strong>
              <p className="mt-1">
                La verificación de identidad protege a anfitriones y arrendatarios contra fraudes y nos
                permite cumplir con la Ley Federal de Protección de Datos Personales en Posesión de los
                Particulares. Tus documentos se cifran en reposo y solo el equipo de verificación de
                Rivones tiene acceso.
              </p>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function KycCard({
  title, subtitle, status, hint, onSubmit, maxFiles,
}: {
  title: string;
  subtitle: string;
  status: string;
  hint: string;
  onSubmit: (paths: string[]) => Promise<void>;
  maxFiles: number;
}) {
  const [paths, setPaths] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.none;
  const Icon = badge.icon;

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.cls}`}>
          <Icon size={12} />
          {badge.label}
        </span>
      </div>

      {(status === "none" || status === "rejected") && (
        <>
          <p className="text-xs text-muted-foreground">{hint}</p>
          <PhotoPicker
            value={paths}
            onChange={setPaths}
            maxFiles={maxFiles}
            label="Sube las fotos"
          />
          <Button
            onClick={async () => {
              setSubmitting(true);
              try { await onSubmit(paths); setPaths([]); }
              finally { setSubmitting(false); }
            }}
            disabled={submitting || paths.length === 0}
            className="w-full"
          >
            {submitting ? "Enviando…" : "Enviar para verificar"}
          </Button>
        </>
      )}

      {status === "pending" && (
        <p className="text-xs text-muted-foreground">
          Estamos revisando tu documento. Recibirás un correo cuando esté listo (máx. 24 hrs).
        </p>
      )}
      {status === "verified" && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          ¡Listo! Tu documento fue verificado.
        </p>
      )}
    </Card>
  );
}
