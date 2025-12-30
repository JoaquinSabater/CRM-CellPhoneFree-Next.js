import { vendedor } from '@/app/lib/definitions';
import { cliente } from './definitions';
import {db} from "../lib/mysql";
import { RowDataPacket } from 'mysql2';

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
  const fechaISO = primerDiaDelMes.toISOString().slice(0, 19).replace('T', ' ');

  const [rows]: any = await db.query(
    'SELECT COUNT(*) AS count FROM pedidos WHERE vendedor_id = ? AND fecha_creacion >= ?',
    [vendedorId, fechaISO]
  );

  return Number(rows[0]?.count ?? 0);
}

export async function getVentasDelDiaPorVendedor() {
  const [rows]: any[] = await db.query(`
    SELECT 
      c.vendedor_id,
      v.nombre AS vendedor_nombre,
      COALESCE(SUM(
        r.total - (r.total * (r.porcentaje_descuento / 100))
      ), 0) AS total_hoy
    FROM remitos r
    JOIN clientes c ON r.cliente_id = c.id
    JOIN vendedores v ON c.vendedor_id = v.id
    WHERE DATE(r.fecha_generacion) = CURDATE()
      AND r.estado IN ('generado', 'entregado', 'facturado')
    GROUP BY c.vendedor_id, v.nombre
    ORDER BY total_hoy DESC

  `);
  return rows;
}

export async function getPedidosPorSemana(vendedorId: number) {
  const [rows]: any = await db.query(
    `SELECT 
        WEEK(fecha_creacion) AS semana,
        COUNT(*) AS cantidad
     FROM pedidos
     WHERE vendedor_id = ?
       AND fecha_creacion >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
     GROUP BY semana
     ORDER BY semana`,
    [vendedorId]
  )

  return rows as { semana: number; cantidad: number }[]
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
        (LOWER(f.nombre) LIKE LOWER(?) AND fc.valor = '1')
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

  return rows as cliente[];
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


export async function getPedidosPreliminaresPorVendedor(vendedorId: number) {
  const sql = `
    SELECT 
      pp.id,
      pp.fecha_creacion,
      pp.estado,
      pp.observaciones_generales,
      c.id AS cliente_id,
      c.razon_social AS cliente_nombre,
      COUNT(ppd.id) AS total_items,
      SUM(ppd.cantidad_solicitada * COALESCE(ppd.precio_unitario, 0)) AS valor_estimado
    FROM pedido_preliminar pp
    JOIN clientes c ON pp.cliente_id = c.id
    LEFT JOIN pedido_preliminar_detalle ppd ON pp.id = ppd.pedido_preliminar_id
    WHERE c.vendedor_id = ? 
      AND pp.estado IN ('borrador', 'enviado')
    GROUP BY pp.id, pp.fecha_creacion, pp.estado, pp.observaciones_generales, c.id, c.razon_social
    ORDER BY pp.fecha_creacion DESC
    LIMIT 10
  `;
  
  const [rows] = await db.query(sql, [vendedorId]);
  return rows as {
    id: number;
    fecha_creacion: string;
    estado: string;
    observaciones_generales: string;
    cliente_id: number;
    cliente_nombre: string;
    total_items: number;
    valor_estimado: number;
  }[];
}

export async function getDetallePedidoPreliminar(pedidoId: number) {
  const sql = `
    SELECT 
      ppd.id,
      ppd.articulo_codigo_interno,
      i.nombre AS item_nombre,
      a.modelo,
      m.nombre AS marca_nombre,
      ppd.cantidad_solicitada,
      ppd.precio_unitario,
      pps.sugerencia
    FROM pedido_preliminar_detalle ppd
    JOIN articulos a ON ppd.articulo_codigo_interno = a.codigo_interno
    JOIN items i ON a.item_id = i.id
    JOIN marcas m ON a.marca_id = m.id
    LEFT JOIN pedido_preliminar_detalle_sugerencias pps ON ppd.id = pps.pedido_preliminar_detalle_id
    WHERE ppd.pedido_preliminar_id = ?
    ORDER BY i.nombre, a.modelo
  `;
  
  const [rows] = await db.query(sql, [pedidoId]);
  return rows as {
    id: number;
    articulo_codigo_interno: string;
    item_nombre: string;
    modelo: string;
    marca_nombre: string;
    cantidad_solicitada: number;
    precio_unitario: number;
    sugerencia?: string;
  }[];
}

//Funciona
export async function fetchClienteById(id: string) {
  try {
    const sql = `
      SELECT 
        c.*,
        l.nombre AS localidad_nombre,
        p.id AS provincia_id,
        p.nombre AS provincia_nombre,
        CASE 
          WHEN ca.cliente_id IS NOT NULL THEN 1 
          ELSE 0 
        END as tiene_acceso,
        ca.id as auth_id,
        ca.email_verified,
        ca.failed_login_attempts,
        ca.locked_until
      FROM clientes c
      LEFT JOIN localidad l ON c.localidad_id = l.id
      LEFT JOIN provincia p ON l.provincia_id = p.id
      LEFT JOIN clientes_auth ca ON c.id = ca.cliente_id
      WHERE c.id = ?;
    `;

    const [rows]: any = await db.query(sql, [id]);
    return rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch cliente.');
  }
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

export async function getClienteDinero(clienteId: number) {
  const sql = `
    SELECT 
      DATE_FORMAT(fecha_generacion, '%Y-%m') AS mes, 
      SUM(total) AS total
    FROM remitos
    WHERE cliente_id = ?
    GROUP BY mes
    ORDER BY mes
    LIMIT 12
  `;
  const [rows] = await db.query(sql, [clienteId]);
  return rows as { mes: string; total: number }[];
}

export async function fetchPedidosPorMes(clienteId: number) {
  const query = `
    SELECT 
      DATE_FORMAT(fecha_creacion, '%Y-%m') AS mes,
      COUNT(*) AS cantidad
    FROM pedidos
    WHERE cliente_id = ?
    GROUP BY DATE_FORMAT(fecha_creacion, '%Y-%m')
    ORDER BY DATE_FORMAT(fecha_creacion, '%Y-%m') ASC;
  `;
  const [rows] = await db.query(query, [clienteId]);
  return rows;
}

export async function getGraficoItemPorSemana(item: string, vendedorId: number) {
  const [raw] = await db.query(
    `SELECT
        WEEK(r.fecha_generacion) AS semana,
        SUM(rd.cantidad) AS total_vendido
     FROM remitos r
     JOIN remitos_detalle rd ON r.id = rd.remito_id
     JOIN articulos a ON rd.articulo_codigo = a.codigo_interno
     JOIN items i ON a.item_id = i.id
     JOIN clientes c ON r.cliente_id = c.id
     WHERE i.nombre LIKE ?
       AND c.vendedor_id = ?
       AND r.fecha_generacion >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
     GROUP BY semana
     ORDER BY semana`,
    [`%${item}%`, vendedorId]
  );
  return raw as { semana: number; total_vendido: number }[];
}

export async function fetchClientesEnDesgraciaPorVendedor(vendedorId: number) {
  const sql = `
    SELECT 
      c.id AS cliente_id,
      c.razon_social AS cliente_nombre,
      MAX(p.fecha_creacion) AS ultima_compra
    FROM clientes c
    INNER JOIN pedidos p ON c.id = p.cliente_id
    WHERE c.vendedor_id = ?
    GROUP BY c.id
    HAVING
      MAX(p.fecha_creacion) <= DATE_SUB(CURDATE(), INTERVAL 40 DAY)
      AND MAX(p.fecha_creacion) > DATE_SUB(CURDATE(), INTERVAL 60 DAY)
    ORDER BY ultima_compra ASC
  `;
  const [rows]: any[] = await db.query(sql, [vendedorId]);
  return rows;
}

export async function getCantidadProspectosPorCaptador(captadorId: number) {
  const [rows]: any = await db.query(
    'SELECT COUNT(*) AS count FROM prospectos WHERE captador_id = ? AND activo = 1;',
    [captadorId]
  );
  console.log('Cantidad de prospectos para captador', captadorId, ':', rows[0]?.count ?? 0);
  return Number(rows[0]?.count ?? 0);
}

export async function getCantidadProspectosConvertidosPorCaptador(captadorId: number) {
  const [rows]: any = await db.query(
    'SELECT COUNT(*) AS count FROM prospectos WHERE captador_id = ? AND convertido = 1;',
    [captadorId]
  );
  return Number(rows[0]?.count ?? 0);
}

export async function getTopItemsVendidos(topN: number, ultimosDias: number) {  
  const sql = `
    SELECT 
      i.nombre AS item_nombre,
      SUM(rd.cantidad) AS total_vendido,
      COUNT(DISTINCT r.cliente_id) AS clientes_distintos,
      COUNT(DISTINCT c.vendedor_id) AS vendedores_distintos,
      ROUND(AVG(rd.precio_unitario), 2) AS precio_promedio
    FROM remitos r
    JOIN remitos_detalle rd ON r.id = rd.remito_id
    JOIN articulos a ON rd.articulo_codigo = a.codigo_interno
    JOIN items i ON a.item_id = i.id
    JOIN clientes c ON r.cliente_id = c.id
    WHERE r.fecha_generacion >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      AND r.estado IN ('generado', 'entregado', 'facturado')
    GROUP BY i.id, i.nombre
    ORDER BY total_vendido DESC
    LIMIT ?
  `;
  
  const [rows] = await db.query(sql, [ultimosDias, topN]);
  return rows as {
    item_nombre: string;
    total_vendido: number;
    clientes_distintos: number;
    vendedores_distintos: number;
    precio_promedio: number;
  }[];
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

export async function getMarcasConProductos(clienteId: number) {
  const sql = `
    SELECT DISTINCT m.id, m.nombre
    FROM marcas m
    JOIN articulos a ON a.marca_id = m.id
    JOIN remitos_detalle rd ON rd.articulo_codigo = a.codigo_interno
    JOIN remitos r ON r.id = rd.remito_id
    WHERE r.cliente_id = ?
    ORDER BY m.nombre
  `;
  const [rows] = await db.query(sql, [clienteId]);
  return rows;
}

export async function getProductosPorMarca(clienteId: number, marcaId: number) {
  const sql = `
    SELECT 
      a.modelo,
      i.nombre AS item_nombre,
      SUM(rd.cantidad) AS cantidad
    FROM remitos r
    JOIN remitos_detalle rd ON r.id = rd.remito_id
    JOIN articulos a ON rd.articulo_codigo = a.codigo_interno
    JOIN items i ON a.item_id = i.id
    WHERE r.cliente_id = ? AND a.marca_id = ?
    GROUP BY a.modelo, i.nombre
    ORDER BY cantidad DESC
  `;
  const [rows] = await db.query(sql, [clienteId, marcaId]);
  return rows;
}

export async function getArticulosDePedido(pedidoId: number) {
  const sql = `
    SELECT 
      i.nombre AS item_nombre,
      a.modelo,
      rd.cantidad
    FROM remitos r
    JOIN remitos_detalle rd ON r.id = rd.remito_id
    JOIN articulos a ON rd.articulo_codigo = a.codigo_interno
    JOIN items i ON a.item_id = i.id
    WHERE r.pedido_id = ?
  `;
  const [rows] = await db.query(sql, [pedidoId]);
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


export async function getCaptadorById(id: number) {

  const sql = `
    SELECT id, nombre, url_imagen
    FROM captador
    WHERE id = ?;
  `;

  const [rows]: any = await db.query(sql, [id]);
  
  return rows[0];
}

export async function getProspectoById(id: number) {
  // 🆕 AGREGAR TIMESTAMP PARA EVITAR CACHE
  const timestamp = Date.now();
  console.log(`🔍 [DEBUG ${timestamp}] Consultando prospecto ${id} desde BD...`);
  
  try {
    const sql = `
      SELECT 
        p.id,
        p.fecha_contacto,
        p.por_donde_llego,
        p.razon_social,
        p.nombre,
        p.apellido,
        p.contacto,
        p.email,
        p.telefono,
        p.facebook,
        p.instagram,
        p.domicilio,
        p.negocio,
        p.provincia_id,
        prov.nombre AS provincia,
        p.localidad_id,
        loc.nombre AS ciudad,
        p.lat,
        p.lng,
        p.condicion_iva_id,
        p.condicion_iibb_id,
        p.origen,
        p.cliente_referidor_id,
        p.referidor_nombre,
        p.tipo_venta_referido,
        p.cuit,
        p.anotaciones,
        p.observaciones,
        p.fecha_pedido_asesoramiento,
        p.url
      FROM prospectos p
      LEFT JOIN provincia prov ON p.provincia_id = prov.id
      LEFT JOIN localidad loc ON p.localidad_id = loc.id
      WHERE p.id = ?
    `;
    const [rows]: any = await db.query(sql, [id]);
    const result = rows[0] ?? null;
    
    console.log(`✅ [DEBUG ${timestamp}] Prospecto ${id} obtenido:`, {
      id: result?.id,
      nombre: result?.nombre,
      por_donde_llego: result?.por_donde_llego,
      email: result?.email
    });
    
    return result;
  } catch (error) {
    console.error(`❌ [DEBUG ${timestamp}] Error al obtener prospecto ${id}:`, error);
    return null;
  }
}

export async function fetchFiltrosFijos() {
  const [rows] = await db.query('SELECT id, nombre, categoria FROM filtros ORDER BY categoria, nombre');
  return rows as { id: number; nombre: string; categoria: string }[];
}

export async function fetchFiltrosDeClientes(clienteIds: number[]) {
  if (clienteIds.length === 0) return [];
  const ids = clienteIds.join(',');
  const [rows] = await db.query(`
    SELECT cliente_id, filtro_id, valor
    FROM filtros_clientes
    WHERE cliente_id IN (${ids})
  `);
  return rows as { cliente_id: number; filtro_id: number; valor: string }[];
}

export async function getCondicionesIva() {
  const [rows] = await db.query('SELECT id, codigo, descripcion FROM condiciones_iva ORDER BY descripcion');
  return rows as { id: number; codigo: string; descripcion: string }[];
}

export async function getCondicionesIibb() {
  const [rows] = await db.query('SELECT id, codigo, descripcion FROM condiciones_iibb ORDER BY descripcion');
  return rows as { id: number; codigo: string; descripcion: string }[];
}

// Aliases para compatibilidad
export const getCondicionesIVA = getCondicionesIva;
export const getCondicionesIIBB = getCondicionesIibb;
