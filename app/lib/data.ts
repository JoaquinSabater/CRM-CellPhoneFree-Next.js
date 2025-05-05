import { formatCurrency } from './utils';
import { vendedor } from '@/app/lib/definitions'; // adaptá si tu ruta es distinta
import { pedido } from './definitions'; // Asegurate de importar tu tipo
import {db} from "../lib/mysql";
import { RowDataPacket } from 'mysql2';

//Funciona
export async function getCantidadClientesPorVendedor(vendedorId: number) {
  const [rows]: any = await db.query(
    'SELECT COUNT(*) AS count FROM clientes WHERE vendedor_id = ?',
    [vendedorId]
  );

  return Number(rows[0]?.count ?? 0);
}

export async function getCantidadPedidosDelMes(vendedorId: number) {
  const now = new Date();
  const primerDiaDelMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const fechaISO = primerDiaDelMes.toISOString().slice(0, 19).replace('T', ' '); // MySQL friendly

  const [rows]: any = await db.query(
    'SELECT COUNT(*) AS count FROM pedidos WHERE vendedor_id = ? AND fecha_creacion >= ?',
    [vendedorId, fechaISO]
  );

  return Number(rows[0]?.count ?? 0);
}

export async function fetchFilteredClientes(query: string, vendedorId: number) {
  const likeQuery = `%${query}%`;

  const sql = `
    SELECT 
      c.id,
      c.razon_social,
      p.nombre AS provincia_nombre,
      l.nombre AS localidad_nombre
    FROM clientes c
    LEFT JOIN localidad l ON c.localidad_id = l.id
    LEFT JOIN provincia p ON l.provincia_id = p.id
    LEFT JOIN filtros_clientes fc ON c.id = fc.cliente_id
    LEFT JOIN filtros f ON fc.filtro_id = f.id
    WHERE c.vendedor_id = ?
      AND (
        LOWER(c.razon_social) LIKE LOWER(?) OR
        LOWER(p.nombre) LIKE LOWER(?) OR
        LOWER(l.nombre) LIKE LOWER(?) OR
        LOWER(fc.valor) LIKE LOWER(?)
      )
    GROUP BY c.id
    ORDER BY c.razon_social ASC
  `;

  const [rows]: any = await db.query(sql, [
    vendedorId,
    likeQuery,
    likeQuery,
    likeQuery,
    likeQuery,
  ]);

  return rows;
}

//YA LO CAMBIE
export async function fetchFilteredProspects(query: string, captadorId: number) {
  const likeQuery = `%${query}%`;

  const sql = `
    SELECT 
        p.id,
        p.nombre,
        p.email,
        p.telefono,
        p.negocio,
        prov.nombre AS provincia_nombre,
        loc.nombre AS localidad_nombre,
        p.fecha_contacto
    FROM prospectos p
    LEFT JOIN provincia prov ON p.provincia_id = prov.id
    LEFT JOIN localidad loc ON p.localidad_id = loc.id
    WHERE p.activo = true
      AND p.captador_id = ?
      AND (
        LOWER(loc.nombre) LIKE LOWER(?) OR
        LOWER(p.nombre) LIKE LOWER(?) OR
        LOWER(p.email) LIKE LOWER(?) OR
        LOWER(p.telefono) LIKE LOWER(?)
      )
    ORDER BY p.fecha_contacto DESC
  `;

  const [rows] = await db.query(sql, [captadorId, likeQuery, likeQuery, likeQuery, likeQuery]);
  return rows;
}

//Funciona
export async function fetchFiltrosPorVendedor(vendedorId: number) {
  const sql = `
    SELECT 
      fc.cliente_id,
      f.nombre,
      fc.valor
    FROM filtros_clientes fc
    JOIN filtros f ON fc.filtro_id = f.id
    JOIN clientes c ON c.id = fc.cliente_id
    WHERE c.vendedor_id = ?;
  `;

  const [rows]: any = await db.query(sql, [vendedorId]);
  return rows; // 💥 importante: devolvés solo rows
}

//Funciona
export async function fetchClienteById(id: string) {
  try {
    const sql = `
      SELECT 
        c.*,
        l.nombre AS localidad_nombre,
        p.nombre AS provincia_nombre
      FROM clientes c
      LEFT JOIN localidad l ON c.localidad_id = l.id
      LEFT JOIN provincia p ON l.provincia_id = p.id
      WHERE c.id = ?;
    `;

    const [rows]: any = await db.query(sql, [id]);
    return rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch cliente.');
  }
}

//Funciona
export async function getEtiquetasGlobales() {
  const sql = `
    SELECT id, nombre FROM filtros ORDER BY nombre;
  `;

  const [rows] = await db.query(sql);
  return rows;
}

export async function getVendedores() {
  const sql = `SELECT id, nombre FROM vendedores ORDER BY nombre`;

  const [rows] = await db.query<RowDataPacket[]>(sql);
  return rows;
}

//Funciona
export async function getPedidosByCliente(clienteId: string): Promise<any[]> {
  const sql = `
    SELECT 
      p.*,
      u1.username AS armador_nombre,
      u2.username AS controlador_nombre
    FROM pedidos p
    LEFT JOIN usuarios u1 ON p.armador_id = u1.id
    LEFT JOIN usuarios u2 ON p.controlador_id = u2.id
    WHERE p.cliente_id = ?
    ORDER BY p.fecha_creacion DESC;
  `;

  const [rows] = await db.query<RowDataPacket[]>(sql, [clienteId]);
  return rows;
}

export async function getTopItemsByCliente(clienteId: string): Promise<any[]> {
  const sql = `
    SELECT 
      i.nombre AS item_nombre, 
      SUM(rd.cantidad) AS total_comprado
    FROM remitos r
    JOIN remitos_detalle rd ON r.id = rd.remito_id
    JOIN articulos a ON rd.articulo_codigo = a.codigo_interno
    JOIN items i ON a.item_id = i.id
    WHERE r.cliente_id = ?
    GROUP BY i.nombre
    ORDER BY total_comprado DESC
    LIMIT 5;
  `;

  const [rows] = await db.query<RowDataPacket[]>(sql, [clienteId]);
  return rows;
}

//Funciona
export async function getAllProvincias() {
  const sql = `
    SELECT id, nombre
    FROM provincia
    ORDER BY nombre;
  `;

  const [rows]: any = await db.query(sql);
  return rows;
}

//Funciona
export async function getAllLocalidades() {
  const sql = `
    SELECT id, nombre, provincia_id,codigopostal
    FROM localidad
    ORDER BY nombre;
  `;

  const [rows]: any = await db.query(sql);
  return rows;
}

//Funciona
export async function getFiltrosDelCliente(clienteId: string) {
  try {
    const sql = `
      SELECT filtro_id, valor
      FROM filtros_clientes
      WHERE cliente_id = ?;
    `;

    const [rows] = await db.query<RowDataPacket[]>(sql, [clienteId]);
    return rows;
  } catch (error) {
    console.error('Error al obtener filtros del cliente:', error);
    throw new Error('No se pudieron cargar los filtros del cliente.');
  }
}



export async function getVendedorById(id: number | string): Promise<(vendedor & { rol: string }) | null> {
  try {
    const sql = `
      SELECT *
      FROM vendedores
      WHERE id = ?;
    `;

    const [rows] = await db.query<RowDataPacket[]>(sql, [id]);

    const vendedorExtendido = (rows as vendedor[]).map((v) => ({
      ...v,
      rol: 'Vendedor',
    }));

    return vendedorExtendido[0] ?? null;
  } catch (error) {
    console.error('[getVendedorById] Error:', error);
    return null;
  }
}


//YA LO CAMBIE
export async function getCaptadorById(id: number) {

  const sql = `
    SELECT id, nombre, url_imagen
    FROM captador
    WHERE id = ?;
  `;

  const [rows]: any = await db.query(sql, [id]);
  
  return rows[0];
}

//YA LO CAMBIE
export async function fetchProspectos() {
  try {
    const sql = `
      SELECT 
        p.id,
        p.nombre,
        p.email,
        p.telefono,
        p.fecha_contacto,
        prov.nombre AS provincia,
        loc.nombre AS ciudad
      FROM prospectos p
      LEFT JOIN provincia prov ON p.provincia_id = prov.id
      LEFT JOIN localidad loc ON p.localidad_id = loc.id
      WHERE p.activo = true
      ORDER BY p.fecha_contacto DESC;
    `;

    const [rows] = await db.query(sql);
    return rows;
  } catch (error) {
    console.error('Error al obtener prospectos:', error);
    throw new Error('No se pudieron obtener los prospectos.');
  }
}

//YA LO CAMBIE
export async function getProspectoById(id: number) {
  try {

    const sql = `
      SELECT 
        p.id,
        p.fecha_contacto,
        p.por_donde_llego,
        p.nombre,
        p.email,
        p.telefono,
        p.negocio,
        p.provincia_id,
        prov.nombre AS provincia,
        p.localidad_id,
        loc.nombre AS ciudad,
        p.cuit,
        p.anotaciones,
        p.fecha_pedido_asesoramiento,
        p.url
      FROM prospectos p
      LEFT JOIN provincia prov ON p.provincia_id = prov.id
      LEFT JOIN localidad loc ON p.localidad_id = loc.id
      WHERE p.id = ?;
    `;

    const [rows]: any = await db.query(sql, [id]);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Error al obtener prospecto por ID:', error);
    return null;
  }
}






