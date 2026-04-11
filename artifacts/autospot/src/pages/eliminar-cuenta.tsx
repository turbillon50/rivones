import { useState } from "react";
import { LegalPage, LegalSection } from "@/components/layout/LegalPage";

export default function EliminarCuenta() {
  const [step, setStep] = useState<"info" | "confirm" | "done">("info");
  const [reason, setReason] = useState("");

  return (
    <LegalPage title="Eliminar mi cuenta" lastUpdated="1 de abril de 2026">

      {step === "info" && (
        <>
          <LegalSection title="Qué pasará con tu cuenta">
            <p>
              Al eliminar tu cuenta de Rivones se realizarán las siguientes acciones de forma
              permanente e irreversible:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Tu perfil, foto y datos personales serán eliminados dentro de los 30 días siguientes.</li>
              <li>Tus anuncios de vehículos publicados serán dados de baja de inmediato.</li>
              <li>Perderás acceso a tu historial de viajes y reseñas.</li>
              <li>Los pagos o reembolsos pendientes serán procesados antes de la eliminación.</li>
              <li>No podrás recuperar tu cuenta una vez confirmada la eliminación.</li>
            </ul>
          </LegalSection>

          <LegalSection title="Antes de continuar">
            <div className="space-y-3 mt-2">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                <p className="text-amber-800 dark:text-amber-200 font-semibold text-sm mb-1">Reservas activas</p>
                <p className="text-amber-700 dark:text-amber-300 text-[13px]">
                  No puedes eliminar tu cuenta si tienes reservas activas o pendientes de completar.
                  Espera a que finalicen o cancélalas primero.
                </p>
              </div>
              <div className="bg-secondary/50 rounded-2xl p-4">
                <p className="font-semibold text-sm text-foreground mb-1">¿Solo quieres tomar un descanso?</p>
                <p className="text-[13px]">
                  Puedes desactivar temporalmente tus anuncios desde la sección de Anfitrión sin
                  eliminar tu cuenta. Tu historial y calificaciones se conservarán.
                </p>
              </div>
            </div>
          </LegalSection>

          <LegalSection title="Datos que conservamos">
            <p>
              Conforme a la legislación fiscal mexicana (Código Fiscal de la Federación), conservamos
              los registros de transacciones durante 5 años por obligación legal, aunque tu cuenta
              personal sea eliminada. Estos datos no serán visibles ni accesibles para ti.
            </p>
          </LegalSection>

          <div className="pt-2">
            <button
              onClick={() => setStep("confirm")}
              className="w-full py-3 rounded-2xl border border-border text-foreground font-semibold text-[14px] hover:bg-secondary/50 transition-colors"
            >
              Continuar con la eliminación
            </button>
          </div>
        </>
      )}

      {step === "confirm" && (
        <>
          <LegalSection title="Confirma tu solicitud">
            <p>
              Para procesar tu solicitud, necesitamos saber el motivo de tu salida. Esta información
              nos ayuda a mejorar el servicio.
            </p>
          </LegalSection>

          <div className="space-y-2.5 mt-2">
            {[
              "Ya no necesito rentar autos",
              "La app no cumplió mis expectativas",
              "Problemas con un anfitrión o arrendatario",
              "Preocupaciones de privacidad",
              "Encontré otra plataforma",
              "Otro motivo",
            ].map((opt) => (
              <button
                key={opt}
                onClick={() => setReason(opt)}
                className={`w-full text-left px-4 py-3 rounded-2xl border text-[13px] font-medium transition-colors ${
                  reason === opt
                    ? "border-foreground bg-secondary text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="pt-4 space-y-3">
            <button
              disabled={!reason}
              onClick={() => setStep("done")}
              className="w-full py-3 rounded-2xl bg-foreground text-background font-semibold text-[14px] disabled:opacity-40 transition-opacity"
            >
              Eliminar mi cuenta definitivamente
            </button>
            <button
              onClick={() => setStep("info")}
              className="w-full py-3 rounded-2xl border border-border text-foreground font-semibold text-[14px]"
            >
              Cancelar
            </button>
          </div>
        </>
      )}

      {step === "done" && (
        <LegalSection title="Solicitud recibida">
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
              <span className="text-3xl">✓</span>
            </div>
            <div>
              <p className="font-bold text-foreground text-[15px] mb-2">Solicitud enviada</p>
              <p className="text-[13px] leading-relaxed">
                Procesaremos la eliminación de tu cuenta dentro de los próximos 30 días.
                Recibirás un correo de confirmación cuando el proceso esté completo.
              </p>
              <p className="text-[13px] mt-3">
                Si cambias de opinión, contáctanos antes de que finalice el plazo en{" "}
                <span className="text-primary font-medium">soporte@rivones.mx</span>
              </p>
            </div>
          </div>
        </LegalSection>
      )}

    </LegalPage>
  );
}
