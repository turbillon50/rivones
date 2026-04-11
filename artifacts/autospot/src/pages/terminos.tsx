import { LegalPage, LegalSection } from "@/components/layout/LegalPage";

export default function Terminos() {
  return (
    <LegalPage title="Términos y Condiciones" lastUpdated="1 de abril de 2026">

      <LegalSection title="1. Aceptación de los términos">
        <p>
          Al acceder o utilizar la plataforma Rivones, incluyendo la aplicación móvil y el sitio web
          asociado, aceptas quedar vinculado por estos Términos y Condiciones ("Términos"). Si no
          estás de acuerdo con alguno de estos términos, no podrás usar el servicio.
        </p>
        <p>
          Rivones es una plataforma tecnológica que conecta a personas que desean rentar un auto
          ("Arrendatarios") con propietarios de vehículos que desean ponerlos en renta ("Anfitriones").
          Rivones no es una agencia de arrendamiento de vehículos; el contrato de arrendamiento se
          celebra directamente entre Arrendatario y Anfitrión.
        </p>
      </LegalSection>

      <LegalSection title="2. Elegibilidad">
        <p>Para usar Rivones como Arrendatario debes:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Tener al menos 21 años de edad (25 años para vehículos de lujo o deportivos).</li>
          <li>Contar con licencia de conducir válida emitida en México o en el extranjero con vigencia mínima de 1 año.</li>
          <li>Tener una tarjeta de débito o crédito a tu nombre para el cargo del depósito.</li>
          <li>No tener antecedentes de accidentes graves o delitos viales en los últimos 3 años.</li>
        </ul>
        <p>Para registrarte como Anfitrión debes:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Ser propietario del vehículo o contar con autorización expresa del propietario.</li>
          <li>El vehículo debe tener máximo 10 años de antigüedad y pasar una inspección de seguridad.</li>
          <li>Contar con póliza de seguro vigente a nombre del vehículo.</li>
          <li>Tener un RFC activo para efectos de facturación.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Proceso de reserva">
        <p>
          Las reservas se realizan a través de la plataforma y son vinculantes una vez confirmadas.
          El Arrendatario paga el monto total por adelantado, incluyendo tarifa diaria, seguro opcional,
          entrega a domicilio (si aplica) y cuota de limpieza.
        </p>
        <p>
          El Anfitrión tiene la facultad de aceptar o rechazar una solicitud de reserva dentro de las
          24 horas siguientes. En caso de rechazo, el monto será reembolsado íntegramente.
        </p>
        <p>
          Para las reservas de Reserva Instantánea, la confirmación es automática y el Arrendatario
          recibirá los datos de entrega inmediatamente.
        </p>
      </LegalSection>

      <LegalSection title="4. Depósito de seguridad">
        <p>
          Al inicio de cada renta, se realiza un cargo de depósito a la tarjeta del Arrendatario
          según el monto indicado en el anuncio del vehículo. Este depósito es liberado dentro de
          los 5 días hábiles posteriores a la devolución del vehículo, siempre que no se reporten
          daños o infracciones pendientes.
        </p>
        <p>
          En caso de daños, el Anfitrión tiene 72 horas después de la devolución para reportarlos
          con evidencia fotográfica. Rivones actuará como mediador para resolver cualquier disputa.
        </p>
      </LegalSection>

      <LegalSection title="5. Responsabilidades del Arrendatario">
        <ul className="list-disc pl-5 space-y-1">
          <li>Tratar el vehículo con el mismo cuidado que trataría su propiedad personal.</li>
          <li>Devolver el vehículo en las condiciones y hora acordadas.</li>
          <li>Reportar cualquier daño o incidente inmediatamente a través de la app.</li>
          <li>No fumar dentro del vehículo, salvo que el Anfitrión lo permita expresamente.</li>
          <li>No transportar mascotas salvo autorización explícita del Anfitrión.</li>
          <li>No usar el vehículo para actividades ilícitas, carreras o para manejar fuera de carretera.</li>
          <li>Respetar los límites de kilometraje establecidos en el anuncio.</li>
          <li>No subarrendar el vehículo a terceros.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Responsabilidades del Anfitrión">
        <ul className="list-disc pl-5 space-y-1">
          <li>Garantizar que el vehículo esté en condiciones mecánicas y de seguridad óptimas.</li>
          <li>Mantener el seguro del vehículo vigente durante toda la duración de la renta.</li>
          <li>Entregar el vehículo limpio, con tanque lleno (o según política indicada) y a tiempo.</li>
          <li>Proporcionar información veraz sobre el vehículo, su ubicación y sus características.</li>
          <li>Responder a las solicitudes y mensajes dentro de las 24 horas.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Seguros y protección">
        <p>
          Rivones ofrece un plan de protección opcional ("Rivones Protege") que cubre daños
          al vehículo hasta por $200,000 MXN y responsabilidad civil frente a terceros hasta por
          $1,000,000 MXN, según los términos de la póliza vigente.
        </p>
        <p>
          El plan de protección NO cubre: daños causados por conducción bajo los efectos del alcohol
          o drogas, daño intencional, uso fuera de los términos acordados, o eventos no reportados.
        </p>
        <p>
          Si el Arrendatario cuenta con seguro propio que cubra vehículos rentados, puede optar por
          no contratar el plan de Rivones, bajo su entera responsabilidad.
        </p>
      </LegalSection>

      <LegalSection title="8. Tarifas y pagos">
        <p>
          Los precios se muestran en Pesos Mexicanos (MXN) e incluyen IVA donde corresponda.
          Rivones cobra una tarifa de servicio sobre cada transacción:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Arrendatario: 12% sobre el subtotal de la renta.</li>
          <li>Anfitrión: 25% sobre el monto que recibe Rivones como comisión de plataforma.</li>
        </ul>
        <p>
          Los pagos se procesan a través de Stripe. Rivones no almacena datos de tarjeta de crédito.
          Los pagos a Anfitriones se liberan 24 horas después de que el Arrendatario recoja el vehículo.
        </p>
      </LegalSection>

      <LegalSection title="9. Conducta prohibida">
        <p>Queda estrictamente prohibido:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Crear cuentas falsas o proporcionar información incorrecta.</li>
          <li>Manipular calificaciones o reseñas.</li>
          <li>Realizar transacciones fuera de la plataforma para evadir tarifas.</li>
          <li>Acosar o amenazar a otros usuarios.</li>
          <li>Usar el servicio para actividades ilegales.</li>
        </ul>
        <p>
          El incumplimiento de estas restricciones podrá resultar en la suspensión o eliminación
          permanente de tu cuenta, sin perjuicio de las acciones legales correspondientes.
        </p>
      </LegalSection>

      <LegalSection title="10. Limitación de responsabilidad">
        <p>
          Rivones actúa exclusivamente como plataforma intermediaria. En la medida máxima permitida
          por la ley mexicana, Rivones no será responsable por daños indirectos, incidentales,
          especiales o consecuentes que surjan del uso o la imposibilidad de uso del servicio.
        </p>
        <p>
          La responsabilidad máxima total de Rivones hacia cualquier usuario no superará el monto
          total pagado por dicho usuario en los 12 meses anteriores al evento que dio origen al reclamo.
        </p>
      </LegalSection>

      <LegalSection title="11. Modificaciones">
        <p>
          Rivones se reserva el derecho de modificar estos Términos en cualquier momento. Los
          cambios serán notificados con al menos 15 días de anticipación a través de la app o correo
          electrónico. El uso continuo del servicio después de dicho plazo implica la aceptación
          de los nuevos términos.
        </p>
      </LegalSection>

      <LegalSection title="12. Legislación aplicable">
        <p>
          Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier disputa
          que no pueda resolverse de forma amistosa será sometida a la jurisdicción de los tribunales
          competentes de la Ciudad de México, renunciando expresamente a cualquier otro fuero.
        </p>
        <p>
          Para reclamaciones menores, ambas partes pueden acudir a la Procuraduría Federal del
          Consumidor (PROFECO) como instancia de mediación.
        </p>
      </LegalSection>

      <LegalSection title="13. Contacto">
        <p>Para cualquier duda sobre estos Términos contáctanos en:</p>
        <p className="font-medium text-foreground">legal@rivones.mx</p>
      </LegalSection>

    </LegalPage>
  );
}
