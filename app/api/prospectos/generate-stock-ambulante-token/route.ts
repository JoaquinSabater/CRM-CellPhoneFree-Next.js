import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/mysql';
import { auth } from '@/app/lib/auth';
import { generateProspectoToken, generateClienteTokenExpiry } from '@/app/lib/tokens';

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

    const { prospectoId } = await request.json();

    if (!prospectoId) {
      return NextResponse.json(
        { success: false, message: 'ID de prospecto requerido' },
        { status: 400 }
      );
    }

    connection = await db.getConnection();
    await connection.query('SET SESSION wait_timeout=300');
    await connection.query('SET SESSION interactive_timeout=300');

    const [prospectoRows] = await connection.query(
      'SELECT id, nombre, email FROM prospectos WHERE id = ?',
      [prospectoId]
    );

    if ((prospectoRows as any).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Prospecto no encontrado' },
        { status: 404 }
      );
    }

    const prospecto = (prospectoRows as any)[0];

    const [existingTokens] = await connection.query(
      'SELECT token, expires_at FROM prospectos_tokens WHERE prospecto_id = ? AND used = FALSE AND expires_at > NOW() AND token LIKE "sa_%"',
      [prospectoId]
    );

    if ((existingTokens as any).length > 0) {
      const existingToken = (existingTokens as any)[0];
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const link = `${baseUrl}/stock-ambulante?token=${existingToken.token}&prospecto_id=${prospectoId}&usuario_id=0`;

      return NextResponse.json({
        success: true,
        message: 'Token ya existe y es válido',
        token: existingToken.token,
        link,
        expiresAt: existingToken.expires_at
      });
    }

    const token = `sa_${generateProspectoToken()}`;
    const expiresAt = generateClienteTokenExpiry();

    await connection.query(
      'INSERT INTO prospectos_tokens (prospecto_id, token, expires_at) VALUES (?, ?, ?)',
      [prospectoId, token, expiresAt]
    );

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const link = `${baseUrl}/stock-ambulante?token=${token}&prospecto_id=${prospectoId}&usuario_id=${usuarioId}`;

    console.log(`✅ Token de stock ambulante generado para prospecto ${prospecto.nombre} (ID: ${prospectoId})`);
    console.log(`🔗 Link: ${link}`);

    return NextResponse.json({
      success: true,
      message: 'Token generado exitosamente',
      token,
      link,
      expiresAt,
      prospecto: {
        id: prospecto.id,
        nombre: prospecto.nombre,
        email: prospecto.email
      }
    });
  } catch (error) {
    console.error('❌ Error generando token de stock ambulante para prospecto:', error);
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