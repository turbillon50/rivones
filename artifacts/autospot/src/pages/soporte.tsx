import { LegalPage, LegalSection } from "@/components/layout/LegalPage";
import { Link } from "wouter";

const FAQS = [
  {
    q: "¿Cómo reservo un auto?",
    a: "Busca el auto que quieres en Explorar o Mapa, elige tus fechas, revisa el precio total y toca \"Reservar ahora\". Si el auto tiene Reserva Instantánea, tu reserva se confirma de inmediato. Si no, el anfitrión tiene 24 horas para aceptar.",
  },
  {
    q: "¿Qué documentos necesito para rentar?",
    a: "Licencia de conducir vigente (mexicana o extranjera con más de 1 año de antigüedad) y una tarjeta de débito o crédito a tu nombre para el depósito de seguridad.",
  },
  {
    q: "¿Cómo funciona el depósito?",
    a: "Al confirmar la reserva se realiza un cargo temporal a tu tarjeta por el monto del depósito. Se libera entre 3 y 5 días hábiles después de devolver el auto en buenas condiciones.",
  },
  {
    q: "¿Qué pasa si necesito cancelar?",
    a: "El reembolso depende de la política del anfitrión (Flexible, Estándar o Estricta) y del tiempo que falte para el inicio de la renta. Consulta nuestra Política de Cancelaciones para conocer los detalles.",
  },
  {
    q: "¿Tengo seguro durante la renta?",
    a: "Sí, puedes contratar el plan Rivones Protege al momento de reservar. Cubre daños al vehículo hasta $200,000 MXN y responsabilidad civil hasta $1,000,000 MXN. Si tienes seguro propio que cubra vehículos rentados, puedes declinar el plan.",
  },
  {
    q: "¿Cómo publico mi auto como anfitrión?",
    a: "Activa el modo anfitrión desde la pantalla de Explorar, luego toca el botón de cámara en la barra inferior. Te guiaremos a través de un formulario de 4 pasos para publicar tu auto en minutos.",
  },
  {
    q: "¿Cuándo recibo mi pago como anfitrión?",
    a: "El pago se libera 24 horas después de que el arrendatario recoja el vehículo. Lo recibirás en tu cuenta bancaria registrada dentro de los 3 días hábiles siguientes.",
  },
  {
    q: "¿Qué hago si hay un accidente o daño?",
    a: "Toma fotos inmediatamente y repórtalo desde la app en la sección de tu reserva activa. No muevas el vehículo si hay un accidente grave. Si contrataste Rivones Protege, un representante te contactará en menos de 2 horas.",
  },
];

export default function Soporte() {
  return (
    <LegalPage title="Soporte y Ayuda" lastUpdated="1 de abril de 2026">

      <LegalSection title="Preguntas frecuentes">
        <div className="space-y-4 mt-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-secondary/40 rounded-2xl p-4">
              <p className="font-semibold text-foreground text-sm mb-1.5">{faq.q}</p>
              <p className="text-[13px] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="Contacto directo">
        <div className="space-y-3 mt-2">
          <div className="bg-secondary/40 rounded-2xl p-4">
            <p className="font-semibold text-foreground text-sm mb-0.5">Correo electrónico</p>
            <p className="text-primary font-medium text-sm">soporte@rivones.mx</p>
            <p className="text-[12px] mt-1">Respondemos en menos de 24 horas hábiles</p>
          </div>
          <div className="bg-secondary/40 rounded-2xl p-4">
            <p className="font-semibold text-foreground text-sm mb-0.5">WhatsApp</p>
            <p className="text-primary font-medium text-sm">+52 55 4000 7890</p>
            <p className="text-[12px] mt-1">Lunes a viernes · 9:00 am – 7:00 pm</p>
          </div>
          <div className="bg-secondary/40 rounded-2xl p-4">
            <p className="font-semibold text-foreground text-sm mb-0.5">Emergencias durante tu renta</p>
            <p className="text-primary font-medium text-sm">+52 55 4000 7891</p>
            <p className="text-[12px] mt-1">Disponible 24/7 para accidentes o incidentes</p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="Documentos legales">
        <div className="space-y-2 mt-2">
          {[
            { label: "Términos y Condiciones", href: "/terminos" },
            { label: "Política de Privacidad", href: "/privacidad" },
            { label: "Política de Cancelaciones", href: "/cancelaciones" },
            { label: "Eliminar mi cuenta", href: "/eliminar-cuenta" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex items-center justify-between bg-secondary/40 rounded-2xl px-4 py-3">
                <span className="text-[13px] font-medium text-foreground">{item.label}</span>
                <span className="text-muted-foreground text-lg">›</span>
              </div>
            </Link>
          ))}
        </div>
      </LegalSection>

    </LegalPage>
  );
}
