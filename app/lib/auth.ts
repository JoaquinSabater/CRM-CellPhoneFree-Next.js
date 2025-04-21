// lib/auth.ts
import { authConfig } from '../auth.config'; // 👈 corregido
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import type { usuario } from '@/app/lib/definitions';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';
// @ts-ignore
import cron from 'node-cron';
import {db} from "../lib/mysql";


// cron.schedule('*/20 * * * *', async () => {
//   console.log('⏰ Ejecutando cron de recordatorios...');

//   try {
//     const now = new Date();

//     const recordatorios = await sql`
//       SELECT id, mensaje, chat_id, bot_token FROM recordatorios
//       WHERE enviado = false AND fecha_envio <= ${now};
//     `;

//     if (recordatorios.length === 0) {
//       console.log('✅ No hay recordatorios para enviar ahora.');
//       return;
//     }

//     for (const r of recordatorios) {
//       const chatId = r.chat_id;
//       const mensaje = r.mensaje;
//       const botToken = r.bot_token;

//       if (!botToken) {
//         console.warn(`⚠️ No se encontró bot_token para el recordatorio ${r.id}`);
//         continue;
//       }

//       console.log('➡️ Enviando a:', chatId);

//       const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
//       const payload = {
//         chat_id: chatId,
//         text: `🔔 Recordatorio:\n${mensaje}`,
//       };

//       try {
//         const res = await fetch(url, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(payload),
//         });

//         if (!res.ok) {
//           const error = await res.text();
//           throw new Error(`Error al enviar a Telegram: ${error}`);
//         }

//         // ✅ Marcar como enviado
//         await sql`
//           UPDATE recordatorios SET enviado = true WHERE id = ${r.id};
//         `;

//         console.log(`📤 Enviado a ${chatId}: "${mensaje}"`);
//       } catch (err: any) {
//         console.error(`❌ Error con chat_id ${chatId}:`, err.message);
//       }
//     }
//   } catch (error) {
//     console.error('❌ Error general en el cron de recordatorios:', error);
//   }
// });

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
          .object({ id: z.string(), password: z.string() })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          console.log('[authorize] Credenciales inválidas');
          return null;
        }

        const { id, password } = parsedCredentials.data;
        const usuario = await getUsuario(id);
        console.log('[authorize] Usuario desde DB:', usuario);

        if (!usuario) return null;

        const passwordsMatch = await bcrypt.compare(password, usuario.password.trim());
        if (!passwordsMatch) return null;

        return usuario as any;
      },
    }),
  ],
});