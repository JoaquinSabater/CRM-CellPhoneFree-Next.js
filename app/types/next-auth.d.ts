// types/next-auth.d.ts

import { JWT } from "next-auth/jwt";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      vendedor_id: number | null;
      captador_id: number | null;
      rol: string;
    };
  }

  interface User {
    id: string;
    email: string;
    password: string;
    vendedor_id: number | null;
    captador_id: number | null;
  }

  interface Cliente {
    id: number;
    razon_social: string;
    provincia_nombre: string;
    localidad_nombre: string;
  }
  
  interface FiltroCliente {
    cliente_id: number;
    nombre: string;
    valor: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    vendedor_id: number | null;
    captador_id: number | null;
    rol: string;
  }
}
