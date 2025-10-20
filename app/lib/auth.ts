// app/lib/auth.ts
import { authConfig } from '../auth.config';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import type { usuario } from '@/app/lib/definitions';
import bcrypt from 'bcryptjs';
import {db} from "../lib/mysql";

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
        const usuario = await getUsuario(id);
        console.log('[authorize] Usuario desde DB:', usuario);

        if (!usuario) return null;

        const hashNormalizado = usuario.password.trim().replace('$2y$', '$2a$');
        const passwordsMatch = await bcrypt.compare(password, hashNormalizado);
        if (!passwordsMatch) return null;

        // 🎯 LÓGICA ESPECÍFICA PARA USUARIO 21
        if (id === '21') {
          if (!selectedRole) {
            console.log('[authorize] Usuario 21 debe seleccionar rol');
            return null;
          }

          if (selectedRole === 'vendedor') {
            // Usuario 21 como vendedor: usar vendedor_id = 18
            return {
              ...usuario,
              rol: 'vendedor',
              vendedor_id: 18,
              captador_id: null
            } as any;
          } else if (selectedRole === 'captador') {
            // Usuario 21 como captador: usar su captador_id normal
            return {
              ...usuario,
              rol: 'captador',
              vendedor_id: null,
              captador_id: usuario.captador_id
            } as any;
          }
        }

        // Para todos los otros usuarios, comportamiento normal
        return usuario as any;
      },
    }),
  ],
});