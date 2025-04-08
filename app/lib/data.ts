import postgres from 'postgres';
import {
  clienteForm,
} from './definitions';
import { formatCurrency } from './utils';
import { vendedor } from '@/app/lib/definitions'; // adaptá si tu ruta es distinta
import { pedido } from './definitions'; // Asegurate de importar tu tipo


const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const ITEMS_PER_PAGE = 6;

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

export async function getEtiquetasGlobales() {
  const result = await sql`
    SELECT id, nombre FROM filtros ORDER BY nombre;
  `;
  return result;
}

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

export async function getAllProvincias() {
  const result = await sql`
    SELECT id, nombre
    FROM provincia
    ORDER BY nombre;
  `;
  return result;
}

export async function getAllLocalidades() {
  const result = await sql`
    SELECT id, nombre, provincia_id
    FROM localidad
    ORDER BY nombre;
  `;
  return result;
}


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

export async function fetchProspectos() {
  try {
    const result = await sql`
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
      ORDER BY p.fecha_contacto DESC;
    `;

    return result;
  } catch (error) {
    console.error('Error al obtener prospectos:', error);
    throw new Error('No se pudieron obtener los prospectos.');
  }
}

export async function getProspectoById(id: number) {
  try {
    const result = await sql`
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
      WHERE p.id = ${id};
    `;

    return result[0] ?? null;
  } catch (error) {
    console.error('Error al obtener prospecto por ID:', error);
    return null;
  }
}






