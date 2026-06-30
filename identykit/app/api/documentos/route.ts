import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json([], { status:401 });
  try {
    const users = await sql`SELECT id FROM identykit.users WHERE clerk_id=${userId} LIMIT 1`;
    if (!users.length) return NextResponse.json([]);
    const uid = users[0].id;
    const docs = await sql`SELECT tipo, archivo_nombre, created_at FROM identykit.documentos WHERE user_id=${uid}`;
    return NextResponse.json(docs);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  try {
    const form = await req.formData();
    const tipo = form.get("tipo") as string;
    const archivo = form.get("archivo") as File;
    if (!tipo || !archivo) return NextResponse.json({ error:"Faltan campos" }, { status:400 });

    const users = await sql`SELECT id FROM identykit.users WHERE clerk_id=${userId} LIMIT 1`;
    if (!users.length) return NextResponse.json({ error:"User not found" }, { status:404 });
    const uid = users[0].id;

    const existing = await sql`SELECT id FROM identykit.documentos WHERE user_id=${uid} AND tipo=${tipo} LIMIT 1`;
    if (existing.length) {
      await sql`UPDATE identykit.documentos SET archivo_nombre=${archivo.name}, updated_at=NOW() WHERE user_id=${uid} AND tipo=${tipo}`;
    } else {
      await sql`INSERT INTO identykit.documentos (user_id, tipo, archivo_nombre) VALUES (${uid},${tipo},${archivo.name})`;
    }
    return NextResponse.json({ ok:true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}
