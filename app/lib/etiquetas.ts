import postgres from 'postgres';


const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
  
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