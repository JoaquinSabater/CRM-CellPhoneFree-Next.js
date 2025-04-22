// lib/auth.ts
import { authConfig } from '../auth.config'; // 👈 corregido
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import type { usuario } from '@/app/lib/definitions';
import bcrypt from 'bcryptjs';
import {db} from "../lib/mysql";


const botToken = process.env.TELEGRAM_BOT_TOKEN;

// 🔔 Envío de recordatorios
async function enviarRecordatoriosPendientes() {
  console.log('📤 Verificando recordatorios pendientes al iniciar sesión...');

  if (!botToken) {
    console.error('❌ BOT_TOKEN no definido en el entorno.');
    return;
  }

  const now = new Date();

  try {
    const [recordatorios]: any = await db.query(
      `SELECT id, mensaje, chat_id 
       FROM recordatorios 
       WHERE enviado = false AND fecha_envio <= ?`,
      [now]
    );

    if (!recordatorios || recordatorios.length === 0) {
      console.log('✅ No hay recordatorios para enviar.');
      return;
    }

    for (const r of recordatorios) {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const payload = {
        chat_id: r.chat_id,
        text: `🔔 Recordatorio:\n${r.mensaje}`,
      };

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Telegram API error: ${errorText}`);
        }

        // ✅ Marcar como enviado
        await db.query(`UPDATE recordatorios SET enviado = true WHERE id = ?`, [r.id]);
        console.log(`✅ Enviado a chat_id ${r.chat_id}: "${r.mensaje}"`);
      } catch (err: any) {
        console.error(`❌ Error al enviar a ${r.chat_id}: ${err.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Error general al procesar recordatorios:', error);
  }
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

        //const passwordsMatch = await bcrypt.compare(password, usuario.password.trim());
        //if (!passwordsMatch) return null;

        await enviarRecordatoriosPendientes();

        return usuario as any;
      },
    }),
  ],
});