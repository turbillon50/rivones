import { LegalPage, LegalSection } from "@/components/layout/LegalPage";

export default function Privacidad() {
  return (
    <LegalPage title="Política de Privacidad" lastUpdated="1 de abril de 2026">

      <LegalSection title="1. Responsable del tratamiento">
        <p>
          Rivones ("nosotros", "nos") es responsable del tratamiento de tus datos personales
          conforme a lo establecido en la Ley Federal de Protección de Datos Personales en Posesión
          de los Particulares (LFPDPPP) y su Reglamento, así como a los Lineamientos del Aviso de
          Privacidad.
        </p>
        <p>
          Domicilio: Av. Insurgentes Sur 1602, Colonia Crédito Constructor, Alcaldía Benito Juárez,
          Ciudad de México, C.P. 03940.
        </p>
        <p>Correo de privacidad: <span className="font-medium text-foreground">privacidad@rivones.mx</span></p>
      </LegalSection>

      <LegalSection title="2. Datos que recopilamos">
        <p>Recopilamos los siguientes datos personales:</p>
        <p className="font-medium text-foreground">Datos de identidad y contacto:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Nombre completo, correo electrónico, número de teléfono.</li>
          <li>Foto de perfil (opcional).</li>
          <li>Fecha de nacimiento (para verificar requisitos de edad).</li>
        </ul>
        <p className="font-medium text-foreground">Datos de verificación:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Imagen de licencia de conducir.</li>
          <li>Identificación oficial (INE o pasaporte) para Anfitriones.</li>
          <li>RFC para efectos de facturación.</li>
        </ul>
        <p className="font-medium text-foreground">Datos de uso de la plataforma:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Historial de búsquedas y reservas.</li>
          <li>Calificaciones y reseñas.</li>
          <li>Mensajes intercambiados con otros usuarios (a través de la app).</li>
        </ul>
        <p className="font-medium text-foreground">Datos de pago:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Información de tarjeta procesada por Stripe. Rivones NO almacena números de tarjeta.</li>
          <li>Historial de transacciones para efectos fiscales.</li>
        </ul>
        <p className="font-medium text-foreground">Datos de dispositivo y ubicación:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Dirección IP, tipo de dispositivo, sistema operativo, versión de la app.</li>
          <li>Ubicación aproximada para mostrar autos cercanos (solo si otorgas permiso).</li>
          <li>Identificadores de dispositivo para notificaciones push.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Finalidades del tratamiento">
        <p className="font-medium text-foreground">Finalidades primarias (necesarias para el servicio):</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Crear y gestionar tu cuenta de usuario.</li>
          <li>Verificar tu identidad y elegibilidad para rentar o publicar vehículos.</li>
          <li>Procesar reservas, pagos y reembolsos.</li>
          <li>Facilitar la comunicación entre Arrendatarios y Anfitriones.</li>
          <li>Resolver disputas y gestionar reclamaciones de daños.</li>
          <li>Cumplir con obligaciones fiscales y legales.</li>
        </ul>
        <p className="font-medium text-foreground">Finalidades secundarias (puedes oponerte):</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Enviarte comunicaciones de marketing sobre ofertas y nuevas funciones.</li>
          <li>Realizar encuestas de satisfacción.</li>
          <li>Mostrarte publicidad personalizada dentro de la app.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Transferencia de datos a terceros">
        <p>
          Tus datos pueden ser compartidos con los siguientes terceros, exclusivamente para los fines
          indicados:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="font-medium text-foreground">Stripe Inc.</span> — procesamiento de pagos (EE.UU., adherido al marco de Privacy Shield).</li>
          <li><span className="font-medium text-foreground">Clerk Inc.</span> — autenticación y gestión de identidad.</li>
          <li><span className="font-medium text-foreground">Google LLC</span> — servicios de mapas y geolocalización.</li>
          <li><span className="font-medium text-foreground">Autoridades competentes</span> — en caso de requerimiento legal, orden judicial o para prevenir fraudes.</li>
        </ul>
        <p>
          No vendemos, alquilamos ni compartimos tus datos personales con fines publicitarios de
          terceros sin tu consentimiento expreso.
        </p>
      </LegalSection>

      <LegalSection title="5. Retención de datos">
        <p>
          Conservamos tus datos mientras tu cuenta esté activa. Una vez eliminada la cuenta,
          eliminamos o anonimizamos tus datos personales en un plazo máximo de 30 días, salvo que:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Existan reservas activas o disputas pendientes de resolución.</li>
          <li>La ley mexicana exija conservar la información por un periodo mayor (por ejemplo,
            datos fiscales durante 5 años conforme al CFF).</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Tus derechos (Derechos ARCO)">
        <p>
          Conforme a la LFPDPPP, tienes derecho a:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="font-medium text-foreground">Acceso</span>: conocer qué datos tenemos sobre ti.</li>
          <li><span className="font-medium text-foreground">Rectificación</span>: corregir datos inexactos o incompletos.</li>
          <li><span className="font-medium text-foreground">Cancelación</span>: solicitar la eliminación de tus datos.</li>
          <li><span className="font-medium text-foreground">Oposición</span>: oponerte al tratamiento de tus datos para finalidades secundarias.</li>
          <li><span className="font-medium text-foreground">Portabilidad</span>: recibir una copia de tus datos en formato legible.</li>
          <li><span className="font-medium text-foreground">Revocación del consentimiento</span>: retirar tu consentimiento en cualquier momento.</li>
        </ul>
        <p>
          Para ejercer cualquiera de estos derechos, envía un correo a{" "}
          <span className="font-medium text-foreground">privacidad@rivones.mx</span> con tu nombre
          completo, una copia de tu identificación y una descripción clara de tu solicitud.
          Responderemos en un plazo máximo de 20 días hábiles.
        </p>
      </LegalSection>

      <LegalSection title="7. Seguridad de los datos">
        <p>
          Implementamos medidas técnicas y organizativas para proteger tus datos personales contra
          acceso no autorizado, pérdida o destrucción, incluyendo:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Cifrado en tránsito mediante TLS 1.3.</li>
          <li>Cifrado en reposo para datos sensibles.</li>
          <li>Acceso restringido a datos personales basado en roles.</li>
          <li>Auditorías de seguridad periódicas.</li>
        </ul>
        <p>
          En caso de una vulneración de seguridad que afecte tus datos, serás notificado dentro de
          los 3 días hábiles siguientes a su detección.
        </p>
      </LegalSection>

      <LegalSection title="8. Cookies y tecnologías de rastreo">
        <p>
          Usamos cookies y tecnologías similares para mantener tu sesión activa, recordar tus
          preferencias y medir el rendimiento de la app. Puedes gestionar las cookies desde la
          configuración de tu navegador o dispositivo, aunque esto puede afectar algunas
          funcionalidades del servicio.
        </p>
      </LegalSection>

      <LegalSection title="9. Menores de edad">
        <p>
          Rivones no está dirigido a personas menores de 18 años. No recopilamos intencionalmente
          datos de menores. Si identificamos que un menor ha proporcionado datos sin autorización
          parental, procederemos a eliminarlos de inmediato.
        </p>
      </LegalSection>

      <LegalSection title="10. Cambios a esta política">
        <p>
          Podemos actualizar esta Política de Privacidad periódicamente. Los cambios significativos
          serán notificados mediante aviso en la app o correo electrónico con al menos 15 días de
          anticipación. Te recomendamos revisar esta política periódicamente.
        </p>
      </LegalSection>

      <LegalSection title="11. Contacto y quejas">
        <p>
          Para cualquier duda, queja o ejercicio de derechos, contáctanos en:
        </p>
        <p className="font-medium text-foreground">privacidad@rivones.mx</p>
        <p>
          Si consideras que tu derecho a la protección de datos ha sido vulnerado, puedes presentar
          una queja ante el Instituto Nacional de Transparencia, Acceso a la Información y
          Protección de Datos Personales (INAI) en <span className="font-medium text-foreground">www.inai.org.mx</span>.
        </p>
      </LegalSection>

    </LegalPage>
  );
}
