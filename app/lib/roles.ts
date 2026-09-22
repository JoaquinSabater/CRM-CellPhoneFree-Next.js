// app/lib/roles.ts
// Roles del CRM y helpers de permisos.
// 'admin' es el super usuario: no existe en la tabla usuarios y ve todo.

export const ROL_ADMIN = 'admin';
export const ROL_ADMINISTRACION = 'administracion';
export const ROL_VENDEDOR = 'vendedor';
export const ROL_CAPTADOR = 'captador';

/** Super usuario hardcodeado (no está en la base de datos). */
export function esSuperAdmin(rol?: string | null): boolean {
  return rol === ROL_ADMIN;
}

/** Puede ver clientes, prospectos, mapa, chatbot y mensajes. */
export function puedeVerComercial(rol?: string | null): boolean {
  return rol === ROL_VENDEDOR || rol === ROL_CAPTADOR || esSuperAdmin(rol);
}

/** Puede entrar al panel de administración (vacaciones, etc). */
export function puedeAdministrar(rol?: string | null): boolean {
  return rol === ROL_ADMINISTRACION || esSuperAdmin(rol);
}

/** Ve la cartera completa, sin filtrar por vendedor ni captador. */
export function veTodaLaCartera(rol?: string | null): boolean {
  return esSuperAdmin(rol);
}
