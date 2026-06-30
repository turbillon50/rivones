import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = neon(process.env.DATABASE_URL!);

  const rows = await sql`
    SELECT
      u.id, u.full_name, u.email,
      p.curp, p.fecha_nacimiento, p.tipo_sangre,
      m.alergias, m.padecimientos, m.medicamentos, m.medico_cabecera, m.medico_telefono,
      ce.nombre AS emerg_nombre, ce.relacion AS emerg_relacion, ce.telefono AS emerg_telefono
    FROM identykit.users u
    LEFT JOIN identykit.perfil p ON p.user_id = u.id
    LEFT JOIN identykit.medico m ON m.user_id = u.id
    LEFT JOIN identykit.contactos_emergencia ce ON ce.user_id = u.id AND ce.es_principal = true
    WHERE u.id = ${userId}
  `;

  return NextResponse.json(rows[0] ?? null);
}
