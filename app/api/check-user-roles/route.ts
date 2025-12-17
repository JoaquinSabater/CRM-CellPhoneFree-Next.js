// app/api/check-user-roles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/mysql';
import { RowDataPacket } from 'mysql2';

interface Usuario extends RowDataPacket {
  id: number;
  vendedor_id: number | null;
  captador_id: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Buscar el usuario en la base de datos
    const [rows] = await db.query<Usuario[]>(
      'SELECT id, vendedor_id, captador_id FROM usuarios WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { roles: [] },
        { status: 200 }
      );
    }

    const usuario = rows[0];
    const roles: string[] = [];

    // Si tiene captador_id, puede actuar como captador
    if (usuario.captador_id !== null && usuario.captador_id !== 0) {
      roles.push('captador');
    }

    // Si tiene vendedor_id, puede actuar como vendedor
    if (usuario.vendedor_id !== null && usuario.vendedor_id !== 0) {
      roles.push('vendedor');
    }

    return NextResponse.json({
      roles,
      userId: usuario.id
    });

  } catch (error) {
    console.error('[ERROR] Error al verificar roles del usuario:', error);
    return NextResponse.json(
      { error: 'Error al verificar roles', roles: [] },
      { status: 500 }
    );
  }
}
