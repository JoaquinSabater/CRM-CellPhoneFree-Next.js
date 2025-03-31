import postgres from 'postgres';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
  clienteForm,
} from './definitions';
import { formatCurrency } from './utils';
import { vendedor } from '@/app/lib/definitions'; // adaptá si tu ruta es distinta
import { pedido } from './definitions'; // Asegurate de importar tu tipo


const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

//NO SE USA
export async function fetchRevenue() {
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)
    //TO-DO esto se tiene que comentar

    //console.log('Fetching revenue data...');
    //await new Promise((resolve) => setTimeout(resolve, 1000));

    const data = await sql<Revenue[]>`SELECT * FROM revenue`;

    //console.log('Data fetch completed after 3 seconds.');

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

//NO SE USA
export async function fetchLatestInvoices() {
  try {
    const data = await sql<LatestInvoiceRaw[]>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

//NO SE USA
export async function fetchCardData() {
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0][0].count ?? '0');
    const numberOfCustomers = Number(data[1][0].count ?? '0');
    const totalPaidInvoices = formatCurrency(data[2][0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(data[2][0].pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(query: string, type: string, limit: string, currentPage: number) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await sql<InvoicesTable[]>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url,
        customers.limits_check,
        customers.customer_type
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        (customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`} OR
        customers.limits_check::text ILIKE ${`%${query}%`})
        AND (customers.customer_type ILIKE ${`%${type}%`})
        AND (customers.limits_check::text ILIKE ${`%${limit}%`})
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchFilteredClientes(query: string, vendedorId: number) {
  return await sql`
    SELECT 
      c.id,
      c.razon_social,
      c.modalidad_de_pago,
      c.contactar,
      c.tipo_de_cliente,
      c.cantidad_de_dias,
      c.cuenta_corriente,
      c.monto,
      p.nombre AS provincia_nombre,
      l.nombre AS localidad_nombre
    FROM clientes c
    LEFT JOIN localidad l ON c.localidad_id = l.id
    LEFT JOIN provincia p ON l.provincia_id = p.id
    WHERE c.vendedor_id = ${vendedorId}
      AND (
        c.razon_social ILIKE ${'%' + query + '%'} OR
        c.modalidad_de_pago ILIKE ${'%' + query + '%'} OR
        c.tipo_de_cliente ILIKE ${'%' + query + '%'} OR
        p.nombre ILIKE ${'%' + query + '%'} OR
        l.nombre ILIKE ${'%' + query + '%'}
      );
  `;
}

export async function fetchClientesPages(query: string) {
  const totalItems = await sql`
    SELECT COUNT(*)
    FROM clientes c
    LEFT JOIN localidad l ON c.localidad_id = l.id
    LEFT JOIN provincia p ON l.provincia_id = p.id
    WHERE 
      c.razon_social ILIKE ${'%' + query + '%'} OR
      c.modalidad_de_pago ILIKE ${'%' + query + '%'} OR
      c.tipo_de_cliente ILIKE ${'%' + query + '%'} OR
      p.nombre ILIKE ${'%' + query + '%'} OR
      l.nombre ILIKE ${'%' + query + '%'}
  `;

  const totalCount = Number(totalItems[0]?.count || 0);
  return Math.ceil(totalCount / ITEMS_PER_PAGE); // Calcular el número total de páginas
}

export async function fetchInvoicesPages(query: string, type: string, limit: string) {
  try {
    const data = await sql`
      SELECT COUNT(*)
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        (customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`} OR
        customers.limits_check::text ILIKE ${`%${query}%`})
        AND (customers.customer_type ILIKE ${`%${type}%`})
        AND (customers.limits_check::text ILIKE ${`%${limit}%`})
    `;

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await sql<InvoiceForm[]>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
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
  console.log('[getVendedorById] ID recibido:', id);

  try {
    const data = await sql<vendedor[]>`
      SELECT *
      FROM vendedores
      WHERE id = ${id};
    `;

    console.log('[getVendedorById] Resultado DB:', data);

    const vendedorExtendido = data.map((v) => ({
      ...v,
      rol: 'Vendedor',
    }));

    console.log('[getVendedorById] Vendedor formateado:', vendedorExtendido[0]);

    return vendedorExtendido[0] ?? null;
  } catch (error) {
    console.error('[getVendedorById] Error:', error);
    return null;
  }
}

export async function fetchCustomers() {
  try {
    const customers = await sql<CustomerField[]>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

//NO SE USA
export async function fetchFilteredCustomers(query: string) {
  try {
    const data = await sql<CustomersTableType[]>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
