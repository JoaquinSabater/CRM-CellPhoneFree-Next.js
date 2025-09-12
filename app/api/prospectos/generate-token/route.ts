import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/mysql';
import { generateProspectoToken, generateProspectoTokenExpiry } from '@/app/lib/tokens';

export async function POST(request: NextRequest) {
  let connection;
  
  try {
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

    // Verificar que el prospecto existe
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

    // Verificar si ya existe un token válido (no usado y no expirado)
    const [existingTokens] = await connection.query(
      'SELECT token, expires_at FROM prospectos_tokens WHERE prospecto_id = ? AND used = FALSE AND expires_at > NOW()',
      [prospectoId]
    );

    if ((existingTokens as any).length > 0) {
      const existingToken = (existingTokens as any)[0];
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const link = `${baseUrl}/prospecto-order?token=${existingToken.token}`;
      
      return NextResponse.json({
        success: true,
        message: 'Token ya existe y es válido',
        token: existingToken.token,
        link: link,
        expiresAt: existingToken.expires_at
      });
    }

    // Generar nuevo token
    const token = generateProspectoToken();
    const expiresAt = generateProspectoTokenExpiry();

    // Guardar token en la base de datos
    await connection.query(
      'INSERT INTO prospectos_tokens (prospecto_id, token, expires_at) VALUES (?, ?, ?)',
      [prospectoId, token, expiresAt]
    );

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const link = `${baseUrl}/prospecto-order?token=${token}`;

    console.log(`✅ Token generado para prospecto ${prospecto.nombre} (ID: ${prospectoId})`);
    console.log(`🔗 Link: ${link}`);

    return NextResponse.json({
      success: true,
      message: 'Token generado exitosamente',
      token: token,
      link: link,
      expiresAt: expiresAt,
      prospecto: {
        id: prospecto.id,
        nombre: prospecto.nombre,
        email: prospecto.email
      }
    });

  } catch (error) {
    console.error('❌ Error generando token de prospecto:', error);
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