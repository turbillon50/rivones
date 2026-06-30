import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  try {
    const users = await sql`SELECT * FROM identykit.users WHERE clerk_id=${userId} LIMIT 1`;
    if (!users.length) return NextResponse.json(null);
    const u = users[0];
    const uid = u.id;

    const [perf, med, docs] = await Promise.all([
      sql`SELECT * FROM identykit.perfil WHERE user_id=${uid} LIMIT 1`,
      sql`SELECT * FROM identykit.medico WHERE user_id=${uid} LIMIT 1`,
      sql`SELECT tipo FROM identykit.documentos WHERE user_id=${uid}`,
    ]);

    const p = perf[0] || {};
    const m = med[0] || {};
    const docTipos = docs.map((d:any) => d.tipo);

    const completado = {
      personal: !!(p.nombre || u.nombre),
      medico: !!(m.tipo_sangre),
      academico: !!(p.escolaridad),
      documentos: docTipos.length > 0,
      contactos: !!(p.contacto_emergencia),
    };
    const total = Object.values(completado).filter(Boolean).length;

    return NextResponse.json({
      nombre: p.nombre || u.nombre,
      email: u.email,
      medico: m,
      completado,
      progreso: Math.round((total/5)*100),
      documentos: docTipos,
    });
  } catch (err: any) {
    console.error("GET /api/perfil", err);
    return NextResponse.json({ error: err.message }, { status:500 });
  }
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const body = await req.json();
  const { seccion, ...data } = body;

  try {
    const users = await sql`SELECT id FROM identykit.users WHERE clerk_id=${userId} LIMIT 1`;
    if (!users.length) return NextResponse.json({ error:"User not found" }, { status:404 });
    const uid = users[0].id;

    if (seccion === "medico") {
      const { tipo_sangre, alergias, padecimientos, medicamentos, medico_cabecera, tel_medico } = data;
      const existing = await sql`SELECT id FROM identykit.medico WHERE user_id=${uid} LIMIT 1`;
      if (existing.length) {
        await sql`UPDATE identykit.medico SET tipo_sangre=${tipo_sangre||null}, alergias=${alergias||null}, padecimientos=${padecimientos||null}, medicamentos=${medicamentos||null}, medico_cabecera=${medico_cabecera||null}, tel_medico=${tel_medico||null} WHERE user_id=${uid}`;
      } else {
        await sql`INSERT INTO identykit.medico (user_id, tipo_sangre, alergias, padecimientos, medicamentos, medico_cabecera, tel_medico) VALUES (${uid},${tipo_sangre||null},${alergias||null},${padecimientos||null},${medicamentos||null},${medico_cabecera||null},${tel_medico||null})`;
      }
    }
    return NextResponse.json({ ok:true });
  } catch (err: any) {
    console.error("POST /api/perfil", err);
    return NextResponse.json({ error: err.message }, { status:500 });
  }
}
