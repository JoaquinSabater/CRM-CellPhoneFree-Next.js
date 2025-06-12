import { db } from '@/app/lib/mysql';

export async function GET() {
  const [rows]: any[] = await db.query('SELECT id, nombre FROM items ORDER BY nombre');
  return new Response(JSON.stringify(rows), { status: 200 });
}