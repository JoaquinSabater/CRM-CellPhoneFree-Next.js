import {db} from "@/app/lib/mysql";

export async function handleListarItems(): Promise<string> {
  const [rows]: any = await db.query('SELECT nombre FROM items ORDER BY nombre ASC')

  if (!rows.length) {
    return '⚠️ No se encontraron ítems cargados.'
  }

  const lista = rows.map((row: any) => `• ${row.nombre}`).join('<br>')

  return `📦 <b>Ítems disponibles:</b><br>${lista}`
}
