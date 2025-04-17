//import postgres from 'postgres';
import {db} from "../lib/mysql";

//const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function listInvoices() {
  const sql = `SELECT * FROM usuarios;`;
  const [rows] = await db.query(sql);
  return rows;
}

export async function GET() {
  try {
   	return Response.json(await listInvoices());
   } catch (error) {
   	return Response.json({ error }, { status: 500 });
   }
}
