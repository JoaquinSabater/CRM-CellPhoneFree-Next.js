// lib/auth.ts
import { authConfig } from '../auth.config'; // 👈 corregido
import NextAuth from 'next-auth';

export const { auth } = NextAuth(authConfig);