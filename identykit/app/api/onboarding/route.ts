import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs";
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const { basic, medico, emergencia } = await request.json();

  const sql = neon(process.env.DATABASE_URL!);

  await sql`
    INSERT INTO identykit.users (id, clerk_id, email, full_name)
    VALUES (${userId}, ${userId}, ${email}, ${basic.full_name})
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email
  `;

  await sql`
    INSERT INTO identykit.perfil (user_id, curp, fecha_nacimiento, tipo_sangre)
    VALUES (${userId}, ${basic.curp}, ${basic.fecha_nacimiento || null}, ${basic.tipo_sangre})
    ON CONFLICT (user_id) DO UPDATE SET
      curp = EXCLUDED.curp, fecha_nacimiento = EXCLUDED.fecha_nacimiento,
      tipo_sangre = EXCLUDED.tipo_sangre, updated_at = NOW()
  `;

  const alergias = medico.alergias.split("\n").filter(Boolean);
  const padecimientos = medico.padecimientos.split("\n").filter(Boolean);
  const medicamentos = medico.medicamento_actual ? [medico.medicamento_actual] : [];

  await sql`
    INSERT INTO identykit.medico (user_id, alergias, padecimientos, medicamentos, medico_cabecera, medico_telefono)
    VALUES (${userId}, ${alergias}, ${padecimientos}, ${medicamentos}, ${medico.medico_cabecera}, ${medico.medico_telefono})
    ON CONFLICT (user_id) DO UPDATE SET
      alergias = EXCLUDED.alergias, padecimientos = EXCLUDED.padecimientos,
      medicamentos = EXCLUDED.medicamentos, medico_cabecera = EXCLUDED.medico_cabecera,
      medico_telefono = EXCLUDED.medico_telefono, updated_at = NOW()
  `;

  await sql`
    INSERT INTO identykit.contactos_emergencia (user_id, nombre, relacion, telefono, es_principal)
    VALUES (${userId}, ${emergencia.nombre}, ${emergencia.relacion}, ${emergencia.telefono}, true)
    ON CONFLICT DO NOTHING
  `;

  return NextResponse.json({ ok: true });
}
