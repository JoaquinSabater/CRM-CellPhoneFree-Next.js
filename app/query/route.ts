import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function listInvoices() {
const data = await sql`
      UPDATE usuarios
      SET bot_token = '7621617937:AAHwMTSVAvwT4CMttEPx-CjfKB2oGes1_y0'
      WHERE id = 3;
      `;
 	return data;
 }

export async function GET() {
  try {
   	return Response.json(await listInvoices());
   } catch (error) {
   	return Response.json({ error }, { status: 500 });
   }
}
