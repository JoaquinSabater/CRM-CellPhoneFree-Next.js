'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/app/lib/auth';
import { AuthError } from 'next-auth';
import { auth } from '@/app/lib/auth';
import {db} from "../lib/mysql";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function createRecordatorio(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: 'No autenticado' };
  }

  const mensaje = formData.get('mensaje') as string;
  const fecha = formData.get('fecha') as string;
  const prospecto_id = formData.get('prospecto_id') as string | null;

  if (!fecha) {
    return { success: false, error: 'La fecha es requerida' };
  }

  const fechaCompleta = new Date(fecha);

  if (isNaN(fechaCompleta.getTime())) {
    return { success: false, error: 'Fecha inválida' };
  }

  if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN no está definido en el .env');
    return { success: false, error: 'Error interno del servidor (BOT_TOKEN faltante)' };
  }

  const fechaEnvio = fechaCompleta.toISOString();

  const [rows]: any = await db.query(
    'SELECT chat_id_crm FROM usuarios WHERE id = ?',
    [userId]
  );
  const usuario = rows[0];
  const chat_id = usuario?.chat_id_crm;

  if (!chat_id) {
    return {
      success: false,
      error: 'Falta el chat_id del usuario para enviar el recordatorio.',
    };
  }

  // Inserta prospecto_id si viene, si no, inserta null
  await db.query(
    'INSERT INTO recordatorios (mensaje, fecha_envio, chat_id, bot_token, prospecto_id) VALUES (?, ?, ?, ?, ?)',
    [mensaje, fechaEnvio, chat_id, BOT_TOKEN, prospecto_id ? Number(prospecto_id) : null]
  );

  console.log(`✅ Recordatorio creado para el ${fechaEnvio} con mensaje: "${mensaje}"`);

  return { success: true };
}

// app/lib/actions.ts
export async function altaCliente(prospectoId: number, formData: FormData) {
  const vendedorId = formData.get('vendedor_id');
  const mantenerExistente = formData.get('mantener_existente');

  if (!vendedorId) {
    throw new Error('Debe seleccionar un vendedor.');
  }

  try {
    // Obtener datos del prospecto
    const [prospecto]: any = await db.query(
      'SELECT * FROM prospectos WHERE id = ?',
      [prospectoId]
    );

    if (!prospecto[0]) {
      throw new Error('Prospecto no encontrado');
    }

    const prospectoData = prospecto[0];
    let clienteId; // Variable para almacenar el ID del cliente

    // Verificar si ya existe un cliente con el mismo CUIT
    const [clienteExistente]: any = await db.query(
      'SELECT id FROM clientes WHERE cuit_dni = ?',
      [prospectoData.cuit]
    );

    if (clienteExistente[0]) {
      clienteId = clienteExistente[0].id; // 📝 Guardar el ID del cliente existente
      
      if (mantenerExistente === 'true') {
        await db.query(
          'UPDATE clientes SET prospecto_id = ? WHERE cuit_dni = ?',
          [prospectoId, prospectoData.cuit]
        );
      } else {
        // Actualizar cliente existente SOLO con nuevo vendedor y prospecto_id
        await db.query(
          `UPDATE clientes SET
            vendedor_id = ?,
            prospecto_id = ?
          WHERE cuit_dni = ?`,
          [
            vendedorId,
            prospectoId,
            prospectoData.cuit
          ]
        );
      }
    } else {
      // Cliente NO existe - CREAR nuevo cliente
      const [result]: any = await db.query(
        `INSERT INTO clientes (
          razon_social,
          nombre,
          email,
          telefono,
          localidad_id,
          cuit_dni,
          observaciones,
          vendedor_id,
          fecha_creacion,
          prospecto_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
        [
          prospectoData.nombre,
          prospectoData.nombre,
          prospectoData.email,
          prospectoData.telefono,
          prospectoData.localidad_id,
          prospectoData.cuit,
          prospectoData.anotaciones,
          vendedorId,
          prospectoId
        ]
      );
      
      clienteId = result.insertId; // 📝 Guardar el ID del cliente recién creado
    }

    // 🆕 ACTUALIZAR PEDIDOS PRELIMINARES DEL PROSPECTO
    console.log(`🔄 Actualizando pedidos preliminares del prospecto ${prospectoId} al cliente ${clienteId}`);
    
    const [updateResult]: any = await db.query(
      `UPDATE pedido_preliminar 
       SET cliente_id = ?, vendedor_id = ? 
       WHERE prospecto_id = ? AND cliente_id IS NULL AND vendedor_id IS NULL`,
      [clienteId, vendedorId, prospectoId]
    );
    
    console.log(`✅ ${updateResult.affectedRows} pedidos preliminares actualizados`);

    // Eliminar recordatorios y marcar prospecto como convertido
    await db.query(
      `DELETE FROM recordatorios WHERE prospecto_id = ?`,
      [prospectoId]
    );

    await db.query(
      `UPDATE prospectos SET activo = false, convertido = 1 WHERE id = ?`,
      [prospectoId]
    );
    
  } catch (err) {
    console.error('❌ Error al dar de alta cliente:', err);
    throw err;
  }
}

// Nueva función para verificar si existe un cliente con el mismo CUIT
export async function verificarClienteExistente(prospectoId: number) {
  try {
    const [prospecto]: any = await db.query(
      'SELECT cuit FROM prospectos WHERE id = ?',
      [prospectoId]
    );

    if (!prospecto[0]?.cuit) {
      return { existe: false };
    }

    const [cliente]: any = await db.query(
      `SELECT c.id, c.razon_social, v.nombre as vendedor_nombre, v.id as vendedor_id
       FROM clientes c 
       LEFT JOIN vendedores v ON c.vendedor_id = v.id
       WHERE c.cuit_dni = ?`,
      [prospecto[0].cuit]
    );

    if (cliente[0]) {
      return {
        existe: true,
        cliente: cliente[0]
      };
    }

    return { existe: false };
  } catch (error) {
    console.error('❌ Error al verificar cliente existente:', error);
    return { existe: false };
  }
}

export async function updateCliente(id: string, formData: FormData, filtrosDisponibles?: any[]) {
  const observaciones = formData.get('observaciones') as string | null;
    const habilitado = formData.get('habilitado') ? 1 : 0; // Nueva línea

  // 1. Actualizar campo fijo
    await db.query(
      'UPDATE clientes SET observaciones = ?, habilitado = ? WHERE id = ?',
      [observaciones, habilitado, id]
    );

  await db.query(
    'UPDATE clientes SET observaciones = ? WHERE id = ?',
    [observaciones, id]
  );

  // 2. Actualizar filtros si vienen disponibles
  if (filtrosDisponibles && Array.isArray(filtrosDisponibles)) {
    // Prepara los filtros seleccionados como checkboxes
    const filtros = filtrosDisponibles.map((filtro: any) => ({
      filtro_id: filtro.id,
      valor: formData.get(`filtro-${filtro.id}`) === '1' ? '1' : '0',
    }));

    // Borra los filtros actuales del cliente
    await db.query('DELETE FROM filtros_clientes WHERE cliente_id = ?', [id]);

    // Inserta los nuevos filtros
    if (filtros.length > 0) {
      const values = filtros.map(f => [id, f.filtro_id, f.valor]);
      await db.query(
        'INSERT INTO filtros_clientes (cliente_id, filtro_id, valor) VALUES ?',
        [values]
      );
    }
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

//YA CAMBIE ESTA 
export async function updateProspecto(id: number, formData: FormData) {
  const getString = (key: string) => String(formData.get(key) ?? '');
  const getNumberOrNull = (key: string) => {
    const value = formData.get(key);
    const parsed = Number(value);
    return !value || parsed === 0 || isNaN(parsed) ? null : parsed;
  };

  const fields = {
    fecha_contacto: getString('fecha_contacto'),
    por_donde_llego: getString('por_donde_llego'),
    nombre: getString('nombre'),
    email: getString('email'),
    telefono: getString('telefono'),
    negocio: getString('negocio'),
    provincia_id: getNumberOrNull('provincia_id'),
    localidad_id: getNumberOrNull('localidad_id'),
    cuit: getString('cuit'),
    anotaciones: getString('anotaciones'),
    fecha_pedido_asesoramiento: getString('fecha_pedido_asesoramiento'),
    url: getString('url'),
    seguimiento: getString('seguimiento'),
  };

  const updateQuery = `
    UPDATE prospectos SET
      fecha_contacto = ?,
      por_donde_llego = ?,
      nombre = ?,
      email = ?,
      telefono = ?,
      negocio = ?,
      provincia_id = ?,
      localidad_id = ?,
      cuit = ?,
      anotaciones = ?,
      fecha_pedido_asesoramiento = ?,
      url = ?
    WHERE id = ?
  `;

  const values = [
    fields.fecha_contacto,
    fields.por_donde_llego,
    fields.nombre,
    fields.email,
    fields.telefono,
    fields.negocio,
    fields.provincia_id,
    fields.localidad_id,
    fields.cuit,
    fields.anotaciones,
    fields.fecha_pedido_asesoramiento,
    fields.url,
    id,
  ];

  await db.query(updateQuery, values);

  // 🔁 Seguimiento → crear recordatorio
  if (fields.seguimiento) {
    let diasExtra = 0;

    if (fields.seguimiento === '2') diasExtra = 3;
    if (fields.seguimiento === '3') diasExtra = 7;
    if (fields.seguimiento === '4') diasExtra = 15;

    const now = new Date();
    const fechaEnvio = new Date(now);
    fechaEnvio.setDate(now.getDate() + diasExtra);

    const fecha = fechaEnvio.toISOString().slice(0, 10);

    const mensaje = `📌 Seguimiento ${fields.seguimiento} para el prospecto: ${fields.nombre}`;

    const recordatorioForm = new FormData();
    recordatorioForm.append('mensaje', mensaje);
    recordatorioForm.append('fecha', fecha);

    await createRecordatorio(recordatorioForm);
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}


//YA CAMBIE ESTA
export async function desactivarProspecto(id: number) {
  try {
    const query = `
      UPDATE prospectos
      SET activo = false
      WHERE id = ?
    `;
    await db.query(query, [id]);
  } catch (error) {
    console.error('❌ Error al desactivar el prospecto:', error);
    throw new Error('No se pudo desactivar el prospecto');
  }
}




//YA CAMBIE ESTA
export async function createProspecto(formData: FormData) {
  const session = await auth();
  const captadorId = session?.user?.captador_id;

  const fields = {
    fecha_contacto: formData.get('fecha_contacto')?.toString() || null,
    por_donde_llego: formData.get('por_donde_llego')?.toString() || null,
    nombre: formData.get('nombre')?.toString() || null,
    email: formData.get('email')?.toString() || null,
    telefono: formData.get('telefono')?.toString() || null,
    negocio: formData.get('negocio')?.toString() || null,
    provincia_id: Number(formData.get('provincia_id')) || null,
    localidad_id: Number(formData.get('localidad_id')) || null,
    cuit: formData.get('cuit')?.toString() || null,
    anotaciones: formData.get('anotaciones')?.toString() || null,
    fecha_pedido_asesoramiento: formData.get('fecha_pedido_asesoramiento')?.toString() || null,
    url: formData.get('url')?.toString() || null,
    captador_id: captadorId || null,
  };

  try {
    const query = `
      INSERT INTO prospectos (
        fecha_contacto,
        por_donde_llego,
        nombre,
        email,
        telefono,
        negocio,
        provincia_id,
        localidad_id,
        cuit,
        anotaciones,
        fecha_pedido_asesoramiento,
        url,
        captador_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      fields.fecha_contacto,
      fields.por_donde_llego,
      fields.nombre,
      fields.email,
      fields.telefono,
      fields.negocio,
      fields.provincia_id,
      fields.localidad_id,
      fields.cuit,
      fields.anotaciones,
      fields.fecha_pedido_asesoramiento,
      fields.url,
      fields.captador_id,
    ];

    const [result]: any = await db.query(query, values);
    const prospectoId = result.insertId;

    // Solo crear recordatorios si negocio es uno de los valores permitidos
    const negocioValido = [
      'fisico',
      'fisicos y online',
      'fisico mas de uno'
    ];
    if (fields.negocio && negocioValido.includes(fields.negocio.toLowerCase())) {
      const seguimientos = [
        { tipo: '2', dias: 2 },
        { tipo: '3', dias: 7 },
        { tipo: '4', dias: 15 },
        { tipo: '5', dias: 30 },
      ];

      for (const seguimiento of seguimientos) {
        const fechaEnvio = new Date();
        fechaEnvio.setDate(fechaEnvio.getDate() + seguimiento.dias);
        const fecha = fechaEnvio.toISOString().slice(0, 10);
        const mensaje = `📌 Seguimiento ${seguimiento.tipo} para el prospecto: ${fields.nombre}`;

        const recordatorioForm = new FormData();
        recordatorioForm.append('mensaje', mensaje);
        recordatorioForm.append('fecha', fecha);
        recordatorioForm.append('prospecto_id', String(prospectoId)); // Nuevo campo

        await createRecordatorio(recordatorioForm);
      }
    }

  } catch (error) {
    console.error('❌ Error al crear el prospecto:', error);
    throw new Error('Error al crear el prospecto');
  }
}


  export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      await signIn('credentials', formData);
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return 'Invalid credentials.';
          default:
            return 'Something went wrong.';
        }
      }
      throw error;
    }
  }