import { LegalPage, LegalSection } from "@/components/layout/LegalPage";

export default function Cancelaciones() {
  return (
    <LegalPage title="Política de Cancelaciones" lastUpdated="1 de abril de 2026">

      <LegalSection title="Cancelaciones por parte del Arrendatario">
        <p>
          Cuando cancelas una reserva como Arrendatario, el reembolso depende de la política que
          eligió el Anfitrión al publicar su vehículo y de cuánto tiempo antes de la fecha de inicio
          realizas la cancelación.
        </p>
      </LegalSection>

      <LegalSection title="Política Flexible">
        <p>
          Aplica cuando el anuncio del Anfitrión indica "Cancelación flexible".
        </p>
        <div className="bg-secondary/40 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="font-medium text-foreground">Más de 24 horas antes</span>
            <span className="text-emerald-600 font-bold">Reembolso completo</span>
          </div>
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="font-medium text-foreground">Menos de 24 horas antes</span>
            <span className="text-amber-600 font-bold">50% de reembolso</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-foreground">Después del inicio de la renta</span>
            <span className="text-red-500 font-bold">Sin reembolso</span>
          </div>
        </div>
        <p className="text-xs">La tarifa de servicio de Rivones se reembolsa íntegramente si cancelas con más de 24 horas de anticipación.</p>
      </LegalSection>

      <LegalSection title="Política Estándar">
        <p>
          Aplica cuando el anuncio indica "Cancelación estándar".
        </p>
        <div className="bg-secondary/40 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="font-medium text-foreground">Más de 5 días antes</span>
            <span className="text-emerald-600 font-bold">Reembolso completo</span>
          </div>
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="font-medium text-foreground">Entre 1 y 5 días antes</span>
            <span className="text-amber-600 font-bold">50% de reembolso</span>
          </div>
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="font-medium text-foreground">Menos de 24 horas antes</span>
            <span className="text-orange-500 font-bold">25% de reembolso</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-foreground">Después del inicio</span>
            <span className="text-red-500 font-bold">Sin reembolso</span>
          </div>
        </div>
        <p className="text-xs">La tarifa de servicio se reembolsa al 50% si cancelas con más de 5 días de anticipación.</p>
      </LegalSection>

      <LegalSection title="Política Estricta">
        <p>
          Aplica cuando el anuncio indica "Cancelación estricta".
        </p>
        <div className="bg-secondary/40 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="font-medium text-foreground">Más de 7 días antes</span>
            <span className="text-emerald-600 font-bold">Reembolso completo</span>
          </div>
          <div className="flex justify-between items-center border-b border-border pb-2">
            <span className="font-medium text-foreground">Entre 3 y 7 días antes</span>
            <span className="text-amber-600 font-bold">50% de reembolso</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-foreground">Menos de 3 días antes o después del inicio</span>
            <span className="text-red-500 font-bold">Sin reembolso</span>
          </div>
        </div>
        <p className="text-xs">La tarifa de servicio no es reembolsable bajo esta política.</p>
      </LegalSection>

      <LegalSection title="Cancelaciones por parte del Anfitrión">
        <p>
          Si el Anfitrión cancela una reserva confirmada, el Arrendatario recibirá un reembolso
          completo incluyendo la tarifa de servicio, sin importar la política del anuncio.
        </p>
        <p>
          Adicionalmente, el Anfitrión estará sujeto a las siguientes consecuencias:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Cancelar dentro de las 24 horas previas al inicio: penalización de $500 MXN descontada de su próximo pago.</li>
          <li>Tres o más cancelaciones en 12 meses: suspensión temporal del anuncio.</li>
          <li>Patrón de cancelaciones repetidas: eliminación permanente del acceso como Anfitrión.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Circunstancias extraordinarias (Fuerza mayor)">
        <p>
          Rivones puede emitir reembolsos completos independientemente de la política del anuncio
          cuando existan circunstancias fuera del control de las partes, incluyendo:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Desastres naturales (terremotos, huracanes, inundaciones) que afecten el área de la renta.</li>
          <li>Declaratoria de emergencia sanitaria por autoridades mexicanas.</li>
          <li>Fallecimiento o enfermedad grave del Arrendatario o Anfitrión con documentación médica.</li>
          <li>Restricciones de viaje gubernamentales que impidan el desplazamiento.</li>
        </ul>
        <p>
          En estos casos debes contactar a Soporte Rivones con documentación de respaldo dentro de
          las 48 horas siguientes al evento.
        </p>
      </LegalSection>

      <LegalSection title="Cómo cancelar una reserva">
        <p>Para cancelar una reserva:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Ve a tu perfil y selecciona la pestaña "Mis viajes".</li>
          <li>Selecciona la reserva que deseas cancelar.</li>
          <li>Toca "Cancelar reserva" y confirma el motivo.</li>
          <li>Recibirás un correo de confirmación con el detalle del reembolso.</li>
        </ol>
        <p>
          Los reembolsos se procesan dentro de los 5 a 10 días hábiles, dependiendo del banco o
          emisor de tu tarjeta.
        </p>
      </LegalSection>

      <LegalSection title="Contacto">
        <p>
          Si tienes dudas sobre el estado de tu cancelación o reembolso, contáctanos en:
        </p>
        <p className="font-medium text-foreground">soporte@rivones.mx</p>
      </LegalSection>

    </LegalPage>
  );
}
