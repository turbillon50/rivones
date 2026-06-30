"use client";
import Link from "next/link";

export default function Terminos() {
  return (
    <main style={{ minHeight:"100vh", background:"#ffffff", padding:"24px", maxWidth:"600px", margin:"0 auto" }}>
      <div style={{ marginBottom:"24px" }}>
        <Link href="/" style={{ color:"#0D47A1", fontSize:"14px" }}>← Volver</Link>
        <h1 style={{ color:"#0D47A1", fontSize:"24px", fontWeight:"700", marginTop:"12px" }}>Términos y Condiciones</h1>
      </div>
      {[
        { t:"Uso del Servicio", c:"Identy-Kit permite almacenar y compartir información personal, médica y documental mediante un código QR. El usuario autoriza la captura, almacenamiento y transmisión de sus datos bajo los términos aquí descritos. El servicio es de uso personal e intransferible." },
        { t:"Privacidad de Datos", c:"Los datos se almacenan en bases de datos cifradas. Solo pueden ser accedidos mediante autenticación con tu cuenta registrada y mediante el QR personal. No vendemos ni compartimos tu información con terceros sin tu consentimiento explícito." },
        { t:"Seguridad", c:"Implementamos cifrado TLS en todas las comunicaciones. El usuario es responsable de mantener su dispositivo seguro y de no compartir su QR o credenciales con terceros no autorizados." },
        { t:"Responsabilidad", c:"La aplicación no sustituye la atención médica profesional. Los datos médicos son proporcionados por el usuario y pueden contener imprecisiones. Identy-Kit no se responsabiliza por errores u omisiones en dicha información." },
        { t:"Contacto", c:"Para dudas o reportes escríbenos a soporte@identykit.app" },
      ].map(s => (
        <section key={s.t} style={{ marginBottom:"24px" }}>
          <h2 style={{ color:"#0D47A1", fontSize:"16px", fontWeight:"600", marginBottom:"8px" }}>{s.t}</h2>
          <p style={{ color:"#374151", lineHeight:"1.6", fontSize:"15px" }}>{s.c}</p>
        </section>
      ))}
    </main>
  );
}
