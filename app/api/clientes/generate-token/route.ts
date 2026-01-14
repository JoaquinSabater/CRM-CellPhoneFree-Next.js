import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/mysql';
import { generateClienteToken, generateClienteTokenExpiry } from '@/app/lib/tokens';
import { auth } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  let connection;
  
  try {
    const session = await auth();
    const usuarioId = session?.user?.id;

    if (!usuarioId) {
      return NextResponse.json(
        { success: false, message: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const { clienteId } = await request.json();

    if (!clienteId) {
      return NextResponse.json(
        { success: false, message: 'ID de cliente requerido' },
        { status: 400 }
      );
    }

    connection = await db.getConnection();
    await connection.query('SET SESSION wait_timeout=300');
    await connection.query('SET SESSION interactive_timeout=300');

    // Verificar que el cliente existe
    const [clienteRows] = await connection.query(
      'SELECT id, razon_social, email FROM clientes WHERE id = ?',
      [clienteId]
    );

    if ((clienteRows as any).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    const cliente = (clienteRows as any)[0];

    // Verificar si ya existe un token válido (no usado y no expirado)
    const [existingTokens] = await connection.query(
      'SELECT token, expires_at, usuario_id FROM clientes_tokens WHERE cliente_id = ? AND used = FALSE AND expires_at > NOW()',
      [clienteId]
    );

    if ((existingTokens as any).length > 0) {
      const existingToken = (existingTokens as any)[0];
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const link = `${baseUrl}/stock-ambulante?token=${existingToken.token}&cliente_id=${clienteId}&usuario_id=${existingToken.usuario_id}`;
      
      return NextResponse.json({
        success: true,
        message: 'Token ya existe y es válido',
        token: existingToken.token,
        link: link,
        expiresAt: existingToken.expires_at
      });
    }

    // Generar nuevo token
    const token = generateClienteToken();
    const expiresAt = generateClienteTokenExpiry();

    // Guardar token en la base de datos
    await connection.query(
      'INSERT INTO clientes_tokens (cliente_id, token, expires_at, usuario_id) VALUES (?, ?, ?, ?)',
      [clienteId, token, expiresAt, usuarioId]
    );

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const link = `${baseUrl}/stock-ambulante?token=${token}&cliente_id=${clienteId}&usuario_id=${usuarioId}`;

    console.log(`✅ Token generado para cliente ${cliente.razon_social} (ID: ${clienteId})`);
    console.log(`🔗 Link: ${link}`);

    return NextResponse.json({
      success: true,
      message: 'Token generado exitosamente',
      token: token,
      link: link,
      expiresAt: expiresAt,
      cliente: {
        id: cliente.id,
        razon_social: cliente.razon_social,
        email: cliente.email
      }
    });

  } catch (error) {
    console.error('❌ Error generando token de cliente:', error);
    return NextResponse.json(
      { success: false, message: 'Error al generar token' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('🔴 Error al liberar conexión:', releaseError);
      }
    }
  }
}
