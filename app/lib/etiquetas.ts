import postgres from 'postgres';


const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function getEtiquetasGlobales() {
    try {
      const result = await sql`SELECT * FROM etiquetas`;
      return result;
    } catch (error) {
      console.error('Error al obtener etiquetas:', error);
      throw new Error('No se pudieron cargar las etiquetas.');
    }
  }
  
  export async function crearEtiqueta(nombre: string, vendedorId: number) {
    try {
      const result = await sql`
        INSERT INTO etiquetas (nombre, vendedor_id)
        VALUES (${nombre}, ${vendedorId})
        RETURNING *
      `;
      return result;
    } catch (error) {
      console.error('Error al crear etiqueta:', error);
      throw new Error('No se pudo crear la etiqueta.');
    }
  }
  
  export async function getEtiquetasByCliente(clienteId: number) {
    try {
      const result = await sql`
        SELECT e.*
        FROM etiquetas e
        INNER JOIN clientes_etiquetas ce ON ce.etiqueta_id = e.id
        WHERE ce.cliente_id = ${clienteId}
      `;
      return result;
    } catch (error) {
      console.error('Error al obtener etiquetas del cliente:', error);
      throw new Error('No se pudieron obtener etiquetas del cliente.');
    }
  }
  
  export async function setEtiquetasDelCliente(clienteId: number, etiquetasIds: number[]) {
    try {
      await sql`
        DELETE FROM clientes_etiquetas WHERE cliente_id = ${clienteId}
      `;
  
      for (const etiquetaId of etiquetasIds) {
        await sql`
          INSERT INTO clientes_etiquetas (cliente_id, etiqueta_id)
          VALUES (${clienteId}, ${etiquetaId})
        `;
      }
    } catch (error) {
      console.error('Error al actualizar etiquetas del cliente:', error);
      throw new Error('No se pudieron actualizar las etiquetas del cliente.');
    }
  }