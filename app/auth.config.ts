import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },

  callbacks: {
    // ✅ Middleware: proteger rutas
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');

      if (isOnDashboard && !isLoggedIn) return false;
      if (!isOnDashboard && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },

    // ✅ Agregar vendedor_id al JWT
    async jwt({ token, user }) {
      if (user) {
        token.vendedor_id = (user as any).vendedor_id;
        token.rol = (user as any).rol; // <- Asegurate que venga del proveedor
      }
      return token;
    },

    // ✅ Agregar vendedor_id a session.user
    async session({ session, token }) {
      session.user.vendedor_id = token.vendedor_id;
      session.user.rol = token.rol; // <- Esto es clave
      return session;
    },
  },

  providers: [], // 👈 esto lo llenás en auth.ts (como ya hacés)
} satisfies NextAuthConfig;
