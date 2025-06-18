import { db } from "@/app/lib/mysql";

export async function handleProvinciaTopClientes(
  entities: { provincia: string },
  rol: string
): Promise<string> {
  if (rol !== "captador") {
    return "⚠️ Esta consulta solo está disponible para vendedores captadores.";
  }

  const { provincia } = entities;

  // Top 10 clientes por compras
  const [rows]: any[] = await db.query(
    `SELECT c.id AS cliente_id, c.razon_social AS cliente_nombre, SUM(r.total) AS total_comprado
     FROM clientes c
     JOIN remitos r ON c.id = r.cliente_id
     JOIN localidad l ON c.localidad_id = l.id
     JOIN provincia p ON l.provincia_id = p.id
     WHERE LOWER(p.nombre) = ?
     GROUP BY c.id
     ORDER BY total_comprado DESC
     LIMIT 10`,
    [provincia]
  );

  if (!rows.length) {
    return `No encontré clientes que hayan comprado en la provincia de <b>${provincia}</b>.`;
  }

  const clientesHtml = rows
    .map(
      (row: any, i: number) =>
        `• <a href="/dashboard/invoices/${row.cliente_id}/edit?from=dashboard" target="_blank"><b>${row.cliente_nombre}</b></a> – $${Number(row.total_comprado).toLocaleString('es-AR')}`
    )
    .join("<br>");

  // Cantidad de clientes inactivos (no compran hace más de 60 días)
  const [inactivos]: any[] = await db.query(
    `SELECT COUNT(*) AS cantidad
     FROM (
       SELECT c.id
       FROM clientes c
       JOIN remitos r ON c.id = r.cliente_id
       JOIN localidad l ON c.localidad_id = l.id
       JOIN provincia p ON l.provincia_id = p.id
       WHERE LOWER(p.nombre) = ?
       GROUP BY c.id
       HAVING MAX(r.fecha_generacion) < DATE_SUB(CURDATE(), INTERVAL 60 DAY)
     ) AS subconsulta`,
    [provincia]
  );
  const cantidadInactivos = inactivos[0]?.cantidad ?? 0;

  // Cantidad de clientes activos (compraron en los últimos 60 días)
  const [activos]: any[] = await db.query(
    `SELECT COUNT(*) AS cantidad
     FROM (
       SELECT c.id
       FROM clientes c
       JOIN remitos r ON c.id = r.cliente_id
       JOIN localidad l ON c.localidad_id = l.id
       JOIN provincia p ON l.provincia_id = p.id
       WHERE LOWER(p.nombre) = ?
       GROUP BY c.id
       HAVING MAX(r.fecha_generacion) >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
     ) AS subconsulta`,
    [provincia]
  );
  const cantidadActivos = activos[0]?.cantidad ?? 0;

  return `✅ <b>Top 10 clientes de la provincia de "${provincia[0].toUpperCase() + provincia.slice(1)}":</b><br>${clientesHtml}<br><br>Clientes activos en la provincia: <b>${cantidadActivos}</b><br>Clientes inactivos en la provincia: <b>${cantidadInactivos}</b>`;
}