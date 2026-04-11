import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = "Rivones <hola@rentamerapido.autos>";

export async function sendWelcomeEmail(to: string, name: string) {
  if (!resend) {
    console.warn("Resend not configured, skipping welcome email");
    return null;
  }
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "¡Bienvenido a Rivones! 🚗",
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f1629;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#1a2744;border-radius:16px;overflow:hidden;margin-top:32px;margin-bottom:32px;">
    <tr>
      <td style="background:linear-gradient(135deg,#0f1629,#1a2744);padding:40px 32px;text-align:center;">
        <h1 style="color:#e0e4ea;font-size:28px;margin:0;font-style:italic;font-weight:900;letter-spacing:0.05em;">RIVONES</h1>
        <div style="width:80px;height:2px;background:linear-gradient(90deg,transparent,#00d4ff,transparent);margin:12px auto 0;"></div>
        <p style="color:rgba(255,255,255,0.6);font-size:14px;margin:12px 0 0;">Renta autos en todo México</p>
      </td>
    </tr>
    <tr>
      <td style="padding:40px 32px;">
        <h2 style="color:#e0e4ea;font-size:22px;margin:0 0 16px;">¡Hola${name ? `, ${name}` : ""}! 👋</h2>
        <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 16px;">
          Bienvenido a <strong style="color:#e0e4ea;">Rivones</strong>, la plataforma más fácil y segura para rentar autos en México.
        </p>
        <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 24px;">
          Ya puedes explorar cientos de autos disponibles cerca de ti, reservar al instante, y disfrutar de la mejor experiencia de renta.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr>
            <td style="background:linear-gradient(135deg,#00b8d9,#00d4ff);border-radius:12px;padding:14px 32px;">
              <a href="https://rentamerapido.autos" style="color:#0f1629;text-decoration:none;font-size:16px;font-weight:600;">Explorar autos</a>
            </td>
          </tr>
        </table>
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:32px 0;">
        <p style="color:#64748b;font-size:13px;line-height:1.5;margin:0;">
          ¿Tienes un auto? Publícalo en Rivones y genera ingresos extra como anfitrión.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#0f1629;padding:24px 32px;text-align:center;">
        <p style="color:#475569;font-size:12px;margin:0;">
          © ${new Date().getFullYear()} Rivones · rentamerapido.autos
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
  return data;
}
