// app/api/check-user-roles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/mysql';
import { RowDataPacket } from 'mysql2';
import { SUPER_ADMIN_ID } from '@/app/lib/auth';
import { ROL_ADMIN } from '@/app/lib/roles';

interface Usuario extends RowDataPacket {
  id: number;
  vendedor_id: number | null;
  captador_id: number | null;
  rol: string | null;
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

    // El super usuario no está en la base de datos y tiene un único rol
    if (String(userId).trim().toLowerCase() === SUPER_ADMIN_ID) {
      return NextResponse.json({
        roles: [ROL_ADMIN],
        userId: SUPER_ADMIN_ID,
      });
    }

    // Buscar el usuario en la base de datos
    const [rows] = await db.query<Usuario[]>(
      'SELECT id, vendedor_id, captador_id, rol FROM usuarios WHERE id = ?',
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

    if (usuario.rol === 'administracion') {
      return NextResponse.json({
        roles: ['administracion'],
        userId: usuario.id
      });
    }

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
