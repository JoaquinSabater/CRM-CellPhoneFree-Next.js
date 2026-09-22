// app/lib/auth.ts
import { authConfig } from '../auth.config';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import type { usuario } from '@/app/lib/definitions';
import bcrypt from 'bcryptjs';
import {db} from "../lib/mysql";
import { ROL_ADMIN } from '@/app/lib/roles';

/** Id del super usuario. No existe en la tabla usuarios. */
export const SUPER_ADMIN_ID = 'admin';

const superAdminUser = {
  id: SUPER_ADMIN_ID,
  username: SUPER_ADMIN_ID,
  email: '',
  rol: ROL_ADMIN,
  vendedor_id: null,
  captador_id: null,
};

/**
 * Valida la contraseña del super usuario contra el entorno.
 * Se usa ADMIN_PASSWORD_HASH (bcrypt) y, si no está, ADMIN_PASSWORD (texto plano).
 * Sin ninguna de las dos configuradas el login de 'admin' queda deshabilitado.
 */
async function validarSuperAdmin(password: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim();

  if (hash) {
    return bcrypt.compare(password, hash.replace('$2y$', '$2a$'));
  }

  const plano = process.env.ADMIN_PASSWORD;

  if (!plano) {
    console.error('[authorize] El usuario admin no tiene ADMIN_PASSWORD ni ADMIN_PASSWORD_HASH configurados.');
    return false;
  }

  return password === plano;
}

async function getUsuario(id: string): Promise<usuario | null> {
  try {
    const sql = 'SELECT * FROM usuarios WHERE id = ?';
    const [rows]: any = await db.query(sql, [id]);

    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('[getUsuario] Error al obtener usuario:', error);
    return null;
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ 
            id: z.string(), 
            password: z.string(),
            selectedRole: z.string().optional()
          })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          console.log('[authorize] Credenciales inválidas');
          return null;
        }

        const { id, password, selectedRole } = parsedCredentials.data;

        // 🔑 Super usuario: no está en la base, se valida contra el entorno
        if (id.trim().toLowerCase() === SUPER_ADMIN_ID) {
          const passwordValida = await validarSuperAdmin(password);

          if (!passwordValida) {
            console.log('[authorize] Password inválida para el super usuario');
            return null;
          }

          return superAdminUser as any;
        }

        const usuario = await getUsuario(id);
        console.log('[authorize] Usuario desde DB:', usuario);

        if (!usuario) return null;

        //const hashNormalizado = usuario.password.trim().replace('$2y$', '$2a$');
        //const passwordsMatch = await bcrypt.compare(password, hashNormalizado);
        //if (!passwordsMatch) return null;

        if (usuario.rol === 'administracion') {
          return usuario as any;
        }

        const tieneAmbosRoles = usuario.vendedor_id && usuario.captador_id;

        if (tieneAmbosRoles) {
          if (!selectedRole) {
            console.log('[authorize] Usuario con ambos roles debe seleccionar uno');
            return null;
          }

          if (selectedRole === 'vendedor') {
            return {
              ...usuario,
              rol: 'vendedor',
              vendedor_id: usuario.vendedor_id,
              captador_id: null
            } as any;
          } else if (selectedRole === 'captador') {
            return {
              ...usuario,
              rol: 'captador',
              vendedor_id: null,
              captador_id: usuario.captador_id
            } as any;
          }
        }

        return usuario as any;
      },
    }),
  ],
});
