import postgres from 'postgres';
import {
  clienteForm,
} from './definitions';
import { formatCurrency } from './utils';
import { vendedor } from '@/app/lib/definitions'; // adaptá si tu ruta es distinta
import { pedido } from './definitions'; // Asegurate de importar tu tipo
import {db} from "../lib/mysql";
import { RowDataPacket } from 'mysql2';


const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });


const ITEMS_PER_PAGE = 6;

//Funciona
export async function getCantidadClientesPorVendedor(vendedorId: number) {
  const result = await sql`
    SELECT COUNT(*) AS count
    FROM clientes
    WHERE vendedor_id = ${vendedorId};
  `;
  return Number(result[0]?.count ?? 0);
}

export async function getCantidadPedidosDelMes(vendedorId: number) {
  const now = new Date();
  const primerDiaDelMes = new Date(now.getFullYear(), now.getMonth(), 1);

  const result = await sql`
    SELECT COUNT(*) AS count
    FROM pedidos
    WHERE vendedor_id = ${vendedorId}
    AND fecha_creacion >= ${primerDiaDelMes};
  `;
  return Number(result[0]?.count ?? 0);
}

/*
  Anda pero hay que cambiar ILIKE por LIKE

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
    WHERE c.vendedor_id = 1
      AND (
        c.razon_social LIKE '%h%' OR
        p.nombre LIKE '%h%' OR
        l.nombre LIKE '%h%' OR
        fc.valor LIKE '%h%'
      )
    GROUP BY c.id, p.nombre, l.nombre
    ORDER BY c.razon_social ASC
*/
export async function fetchFilteredClientes(query: string, vendedorId: number) {
  return await sql`
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
    WHERE c.vendedor_id = ${vendedorId}
      AND (
        c.razon_social ILIKE ${'%' + query + '%'} OR
        p.nombre ILIKE ${'%' + query + '%'} OR
        l.nombre ILIKE ${'%' + query + '%'} OR
        fc.valor ILIKE ${'%' + query + '%'}
      )
    GROUP BY c.id, p.nombre, l.nombre
    ORDER BY c.razon_social ASC;
  `;
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



//Funciona cambiando por LIKE
export async function fetchClientesPages(query: string, vendedorId: number) {
  const totalItems = await sql`
    SELECT COUNT(DISTINCT c.id) AS count
    FROM clientes c
    LEFT JOIN localidad l ON c.localidad_id = l.id
    LEFT JOIN provincia p ON l.provincia_id = p.id
    LEFT JOIN filtros_clientes fc ON c.id = fc.cliente_id
    WHERE c.vendedor_id = ${vendedorId}
      AND (
        c.razon_social ILIKE ${'%' + query + '%'} OR
        p.nombre ILIKE ${'%' + query + '%'} OR
        l.nombre ILIKE ${'%' + query + '%'} OR
        fc.valor ILIKE ${'%' + query + '%'}
      );
  `;

  const totalCount = Number(totalItems[0]?.count || 0);
  return Math.ceil(totalCount / ITEMS_PER_PAGE);
}



//YA LO CAMBIE
export async function fetchProspectsPages(query: string) {
  const likeQuery = `%${query}%`;

  const sql = `
    SELECT COUNT(*) as total
    FROM prospectos
    WHERE activo = true
      AND (
        LOWER(nombre) LIKE LOWER(?) OR
        LOWER(email) LIKE LOWER(?) OR
        LOWER(telefono) LIKE LOWER(?)
      );
  `;

  const [rows] = await db.query<RowDataPacket[]>(sql, [likeQuery, likeQuery, likeQuery]);

  // ⬇️ Casteo como array del shape esperado
  const result = rows as { total: number }[];

  const totalCount = Number(result[0]?.total || 0);

  return Math.ceil(totalCount / ITEMS_PER_PAGE);
}

//Funciona
export async function fetchFiltrosPorVendedor(vendedorId: number) {
  return await sql`
    SELECT 
      fc.cliente_id,
      f.nombre,
      fc.valor
    FROM filtros_clientes fc
    JOIN filtros f ON fc.filtro_id = f.id
    JOIN clientes c ON c.id = fc.cliente_id
    WHERE c.vendedor_id = ${vendedorId};
  `;
}

//Funciona
export async function fetchClienteById(id: string) {
  try {
    const data = await sql<clienteForm[]>`
      SELECT 
        c.*,
        l.nombre AS localidad_nombre,
        p.nombre AS provincia_nombre
      FROM clientes c
      LEFT JOIN localidad l ON c.localidad_id = l.id
      LEFT JOIN provincia p ON l.provincia_id = p.id
      WHERE c.id = ${id};
    `;

    return data[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch cliente.');
  }
}

//Funciona
export async function getEtiquetasGlobales() {
  const result = await sql`
    SELECT id, nombre FROM filtros ORDER BY nombre;
  `;
  return result;
}

//Funciona
export async function getPedidosByCliente(clienteId: string): Promise<pedido[]> {
  return await sql<pedido[]>`
    SELECT 
      id,
      vendedor_id,
      cliente_id,
      fecha_creacion,
      estado
    FROM pedidos
    WHERE cliente_id = ${clienteId}
    ORDER BY fecha_creacion DESC;
  `;
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
    SELECT id, nombre, provincia_id
    FROM localidad
    ORDER BY nombre;
  `;

  const [rows]: any = await db.query(sql);
  return rows;
}

//Funciona
export async function getFiltrosDelCliente(clienteId: string) {
  const id = Number(clienteId);
  try {
    const result = await sql`
      SELECT filtro_id, valor
      FROM filtros_clientes
      WHERE cliente_id = ${clienteId};
    `;
    return result;
  } catch (error) {
    console.error('Error al obtener filtros del cliente:', error);
    throw new Error('No se pudieron cargar los filtros del cliente.');
  }
}



export async function getVendedorById(id: number | string): Promise<(vendedor & { rol: string }) | null> {
  //console.log('[getVendedorById] ID recibido:', id);
  try {
    const data = await sql<vendedor[]>`
      SELECT *
      FROM vendedores
      WHERE id = ${id};
    `;

    //console.log('[getVendedorById] Resultado DB:', data);

    const vendedorExtendido = data.map((v) => ({
      ...v,
      rol: 'Vendedor',
    }));

    //console.log('[getVendedorById] Vendedor formateado:', vendedorExtendido[0]);

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






