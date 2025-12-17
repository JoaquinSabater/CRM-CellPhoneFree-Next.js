'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/app/lib/auth';
import { AuthError } from 'next-auth';
import { auth } from '@/app/lib/auth';
import {db} from "../lib/mysql";
import bcrypt from 'bcryptjs';

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
    const [prospecto]: any = await db.query(
      'SELECT * FROM prospectos WHERE id = ?',
      [prospectoId]
    );

    if (!prospecto[0]) {
      throw new Error('Prospecto no encontrado');
    }

    const prospectoData = prospecto[0];
    let clienteId;

    const [clienteExistente]: any = await db.query(
      'SELECT id FROM clientes WHERE cuit_dni = ?',
      [prospectoData.cuit]
    );

    if (clienteExistente[0]) {
      clienteId = clienteExistente[0].id; 
      
      if (mantenerExistente === 'true') {
        await db.query(
          'UPDATE clientes SET prospecto_id = ? WHERE cuit_dni = ?',
          [prospectoId, prospectoData.cuit]
        );
      } else {
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
      const [result]: any = await db.query(
        `INSERT INTO clientes (
          razon_social,
          nombre,
          apellido,
          contacto,
          email,
          telefono,
          facebook,
          instagram,
          domicilio,
          localidad_id,
          cuit_dni,
          condicion_iva_id,
          condicion_iibb_id,
          origen,
          cliente_referidor_id,
          referidor_nombre,
          tipo_venta_referido,
          observaciones,
          vendedor_id,
          fecha_creacion,
          prospecto_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
        [
          prospectoData.razon_social || prospectoData.nombre,
          prospectoData.nombre,
          prospectoData.apellido,
          prospectoData.contacto,
          prospectoData.email,
          prospectoData.telefono,
          prospectoData.facebook,
          prospectoData.instagram,
          prospectoData.domicilio,
          prospectoData.localidad_id,
          prospectoData.cuit,
          prospectoData.condicion_iva_id,
          prospectoData.condicion_iibb_id,
          prospectoData.origen,
          prospectoData.cliente_referidor_id,
          prospectoData.referidor_nombre,
          prospectoData.tipo_venta_referido,
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

// app/lib/actions.ts - Modificar updateCliente:
export async function updateCliente(id: string, formData: FormData, filtrosDisponibles?: any[]) {
  console.log('🚀 [DEBUG] updateCliente iniciado:', { id });
  
  const observaciones = formData.get('observaciones') as string | null;
  const habilitado = formData.get('habilitado') ? 1 : 0;
  const contenidoEspecial = formData.get('contenidoEspecial') ? 1 : 0;
  const distribuidor = formData.get('Distribuidor') ? 1 : 0;
  
  // 🆕 CAMPOS DE CONTRASEÑA
  const nuevaPassword = formData.get('nueva_password') as string;
  const confirmarPassword = formData.get('confirmar_password') as string;

  console.log('📊 [DEBUG] Datos a actualizar:', { 
    observaciones, 
    habilitado, 
    contenidoEspecial,
    distribuidor,
    cambiarPassword: !!nuevaPassword
  });

  // 🔒 VALIDAR CONTRASEÑAS SI SE PROPORCIONAN
  if (nuevaPassword || confirmarPassword) {
    if (!nuevaPassword || !confirmarPassword) {
      throw new Error('Debe completar ambos campos de contraseña');
    }
    
    if (nuevaPassword !== confirmarPassword) {
      throw new Error('Las contraseñas no coinciden');
    }
    
    if (nuevaPassword.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
  }

  try {
    // ✅ ACTUALIZAR CLIENTE
    const [result]: any = await db.query(
      'UPDATE clientes SET observaciones = ?, habilitado = ?, contenidoEspecial = ?, Distribuidor = ? WHERE id = ?',
      [observaciones, habilitado, contenidoEspecial, distribuidor, id]
    );
    
    console.log('✅ [DEBUG] Cliente actualizado:', {
      affectedRows: result.affectedRows,
      changedRows: result.changedRows
    });

    // 🔒 ACTUALIZAR CONTRASEÑA SI SE PROPORCIONÓ
    if (nuevaPassword) {
      console.log('🔒 [DEBUG] Actualizando contraseña del cliente...');
      
      // Verificar si el cliente tiene acceso al sistema
      const [clienteAuth]: any = await db.query(
        'SELECT id FROM clientes_auth WHERE cliente_id = ?',
        [id]
      );
      
      if (clienteAuth[0]) {
        // Encriptar la nueva contraseña
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(nuevaPassword, saltRounds);
        
        // Actualizar contraseña en clientes_auth
        await db.query(
          'UPDATE clientes_auth SET password_hash = ? WHERE cliente_id = ?',
          [hashedPassword, id]
        );
        
        console.log('✅ [DEBUG] Contraseña actualizada exitosamente');
      } else {
        console.warn('⚠️ [DEBUG] Cliente no tiene acceso al sistema, no se puede actualizar contraseña');
        throw new Error('Este cliente no tiene acceso al sistema. No se puede cambiar la contraseña.');
      }
    }

    // 📋 ACTUALIZAR FILTROS (sin cambios)
    if (filtrosDisponibles && Array.isArray(filtrosDisponibles)) {
      console.log('🔄 [DEBUG] Actualizando filtros...');
      
      const filtros = filtrosDisponibles.map((filtro: any) => ({
        filtro_id: filtro.id,
        valor: formData.get(`filtro-${filtro.id}`) === '1' ? '1' : '0',
      }));

      await db.query('DELETE FROM filtros_clientes WHERE cliente_id = ?', [id]);

      if (filtros.length > 0) {
        const values = filtros.map(f => [id, f.filtro_id, f.valor]);
        await db.query(
          'INSERT INTO filtros_clientes (cliente_id, filtro_id, valor) VALUES ?',
          [values]
        );
      }
      
      console.log('✅ [DEBUG] Filtros actualizados');
    }

  } catch (error) {
    console.error('❌ [DEBUG] Error en updateCliente:', error);
    throw error;
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateProspecto(id: number, formData: FormData) {
  console.log('🚀 [DEBUG] updateProspecto iniciado:', { id });

  const getString = (key: string) => String(formData.get(key) ?? '');
  const getNumberOrNull = (key: string) => {
    const value = formData.get(key);
    const parsed = Number(value);
    return !value || parsed === 0 || isNaN(parsed) ? null : parsed;
  };

  const fields = {
    fecha_contacto: getString('fecha_contacto'),
    por_donde_llego: getString('por_donde_llego'),
    razon_social: getString('razon_social'),
    nombre: getString('nombre'),
    apellido: getString('apellido'),
    contacto: getString('contacto'),
    email: getString('email'),
    telefono: getString('telefono'),
    facebook: getString('facebook'),
    instagram: getString('instagram'),
    domicilio: getString('domicilio'),
    negocio: getString('negocio'),
    provincia_id: getNumberOrNull('provincia_id'),
    localidad_id: getNumberOrNull('localidad_id'),
    condicion_iva_id: getNumberOrNull('condicion_iva_id'),
    condicion_iibb_id: getNumberOrNull('condicion_iibb_id'),
    cuit: getString('cuit'),
    origen: getString('origen'),
    referidor_nombre: getString('referidor_nombre'),
    tipo_venta_referido: getString('tipo_venta_referido'),
    anotaciones: getString('anotaciones'),
    fecha_pedido_asesoramiento: getString('fecha_pedido_asesoramiento'),
    url: getString('url'),
  };

  console.log('📊 [DEBUG] Campos a actualizar:', fields);

  const updateQuery = `
    UPDATE prospectos SET
      fecha_contacto = ?,
      por_donde_llego = ?,
      razon_social = ?,
      nombre = ?,
      apellido = ?,
      contacto = ?,
      email = ?,
      telefono = ?,
      facebook = ?,
      instagram = ?,
      domicilio = ?,
      negocio = ?,
      provincia_id = ?,
      localidad_id = ?,
      condicion_iva_id = ?,
      condicion_iibb_id = ?,
      cuit = ?,
      origen = ?,
      referidor_nombre = ?,
      tipo_venta_referido = ?,
      anotaciones = ?,
      fecha_pedido_asesoramiento = ?,
      url = ?
    WHERE id = ?
  `;

  const values = [
    fields.fecha_contacto,
    fields.por_donde_llego,
    fields.razon_social,
    fields.nombre,
    fields.apellido,
    fields.contacto,
    fields.email,
    fields.telefono,
    fields.facebook,
    fields.instagram,
    fields.domicilio,
    fields.negocio,
    fields.provincia_id,
    fields.localidad_id,
    fields.condicion_iva_id,
    fields.condicion_iibb_id,
    fields.cuit,
    fields.origen,
    fields.referidor_nombre,
    fields.tipo_venta_referido,
    fields.anotaciones,
    fields.fecha_pedido_asesoramiento,
    fields.url,
    id,
  ];

  try {
    console.log('📝 [DEBUG] Ejecutando query...');
    const [result]: any = await db.query(updateQuery, values);
    console.log('✅ [DEBUG] Update exitoso:', result.affectedRows, 'filas afectadas');

    // 🆕 INVALIDAR CACHE MÚLTIPLE
    revalidatePath('/dashboard/invoices'); 
    revalidatePath(`/dashboard/invoices/prospects/${id}/edit`); 
    revalidatePath('/dashboard');

    // ✅ SEGUIMIENTO → CREAR RECORDATORIO (esto sí funciona)
    const seguimientoValue = getString('seguimiento');
    if (seguimientoValue && seguimientoValue !== '') {
      console.log('🔔 [DEBUG] Procesando seguimiento:', seguimientoValue);
      
      let diasExtra = 0;
      if (seguimientoValue === '2') diasExtra = 3;
      if (seguimientoValue === '3') diasExtra = 7;
      if (seguimientoValue === '4') diasExtra = 15;

      const now = new Date();
      const fechaEnvio = new Date(now);
      fechaEnvio.setDate(now.getDate() + diasExtra);
      const fecha = fechaEnvio.toISOString().slice(0, 10);
      const mensaje = `📌 Seguimiento ${seguimientoValue} para el prospecto: ${fields.nombre}`;

      const recordatorioForm = new FormData();
      recordatorioForm.append('mensaje', mensaje);
      recordatorioForm.append('fecha', fecha);
      recordatorioForm.append('prospecto_id', String(id));

      await createRecordatorio(recordatorioForm);
      console.log('✅ [DEBUG] Recordatorio creado');
    }

  } catch (error) {
    console.error('❌ [DEBUG] Error en updateProspecto:', error);
    throw error;
  }

  console.log('🎯 [DEBUG] Redirigiendo...');
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
    razon_social: formData.get('razon_social')?.toString() || null,
    nombre: formData.get('nombre')?.toString() || null,
    apellido: formData.get('apellido')?.toString() || null,
    contacto: formData.get('contacto')?.toString() || null,
    email: formData.get('email')?.toString() || null,
    telefono: formData.get('telefono')?.toString() || null,
    facebook: formData.get('facebook')?.toString() || null,
    instagram: formData.get('instagram')?.toString() || null,
    domicilio: formData.get('domicilio')?.toString() || null,
    negocio: formData.get('negocio')?.toString() || null,
    provincia_id: Number(formData.get('provincia_id')) || null,
    localidad_id: Number(formData.get('localidad_id')) || null,
    condicion_iva_id: Number(formData.get('condicion_iva_id')) || null,
    condicion_iibb_id: Number(formData.get('condicion_iibb_id')) || null,
    cuit: formData.get('cuit')?.toString() || null,
    origen: formData.get('origen')?.toString() || null,
    referidor_nombre: formData.get('referidor_nombre')?.toString() || null,
    tipo_venta_referido: formData.get('tipo_venta_referido')?.toString() || null,
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
        razon_social,
        nombre,
        apellido,
        contacto,
        email,
        telefono,
        facebook,
        instagram,
        domicilio,
        negocio,
        provincia_id,
        localidad_id,
        condicion_iva_id,
        condicion_iibb_id,
        cuit,
        origen,
        referidor_nombre,
        tipo_venta_referido,
        anotaciones,
        fecha_pedido_asesoramiento,
        url,
        captador_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      fields.fecha_contacto,
      fields.por_donde_llego,
      fields.razon_social,
      fields.nombre,
      fields.apellido,
      fields.contacto,
      fields.email,
      fields.telefono,
      fields.facebook,
      fields.instagram,
      fields.domicilio,
      fields.negocio,
      fields.provincia_id,
      fields.localidad_id,
      fields.condicion_iva_id,
      fields.condicion_iibb_id,
      fields.cuit,
      fields.origen,
      fields.referidor_nombre,
      fields.tipo_venta_referido,
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
    await signIn('credentials', {
      id: formData.get('id') as string,
      password: formData.get('password') as string,
      selectedRole: (formData.get('selectedRole') as string) || '',
      redirectTo: (formData.get('redirectTo') as string) || '/dashboard',
    });
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