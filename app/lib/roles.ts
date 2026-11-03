// app/lib/roles.ts
// Roles del CRM y helpers de permisos.
// 'admin' es el super usuario: entra con credenciales del entorno y ve todo.

export const ROL_ADMIN = 'admin';
export const ROL_ADMINISTRACION = 'administracion';
export const ROL_VENDEDOR = 'vendedor';
export const ROL_CAPTADOR = 'captador';
export const ROL_DEPOSITO = 'deposito';

/** Super usuario hardcodeado (entra sin pasar por la tabla usuarios). */
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

/** Líder de ventas: aprueba las cuentas corrientes que piden los demás vendedores. */
export const LIDER_VENTAS_USUARIO_ID = 2;

export function esLiderVentas(userId?: string | number | null, rol?: string | null): boolean {
  return Number(userId) === LIDER_VENTAS_USUARIO_ID || esSuperAdmin(rol);
}

/** Fila de la tabla usuarios que representa al super usuario (saldo y aprobaciones). */
export const SUPER_ADMIN_USUARIO_ID = 1;
export const LIDER_ADMINISTRACION_USUARIO_ID = 14;
export const LIDER_DEPOSITO_USUARIO_ID = 3;

/** Líderes de área y el propio admin: sus vacaciones las aprueba el super usuario. */
const VACACIONES_APROBADAS_POR_ADMIN = [
  SUPER_ADMIN_USUARIO_ID,
  LIDER_VENTAS_USUARIO_ID,
  LIDER_DEPOSITO_USUARIO_ID,
  LIDER_ADMINISTRACION_USUARIO_ID,
  20,
  24,
  29,
];

const APROBADOR_VACACIONES_POR_ROL: Record<string, number> = {
  [ROL_VENDEDOR]: LIDER_VENTAS_USUARIO_ID,
  [ROL_CAPTADOR]: LIDER_VENTAS_USUARIO_ID,
  [ROL_ADMINISTRACION]: LIDER_ADMINISTRACION_USUARIO_ID,
  [ROL_DEPOSITO]: LIDER_DEPOSITO_USUARIO_ID,
};

/** Id de la tabla usuarios de quien inició sesión. El super usuario tiene id 'admin' en la sesión. */
export function getUsuarioIdSesion(userId?: string | number | null, rol?: string | null): number {
  return esSuperAdmin(rol) ? SUPER_ADMIN_USUARIO_ID : Number(userId);
}

/** Quién aprueba las vacaciones de un usuario. Sin área asignada, las aprueba el super usuario. */
export function getAprobadorVacaciones(usuarioId: number, rolUsuario?: string | null): number {
  if (VACACIONES_APROBADAS_POR_ADMIN.includes(usuarioId)) {
    return SUPER_ADMIN_USUARIO_ID;
  }

  return APROBADOR_VACACIONES_POR_ROL[rolUsuario ?? ''] ?? SUPER_ADMIN_USUARIO_ID;
}

/** Puede entrar al panel de administración: quienes administran y quienes aprueban vacaciones. */
export function puedeVerPanelAdministracion(userId?: string | number | null, rol?: string | null): boolean {
  return (
    puedeAdministrar(rol) ||
    Object.values(APROBADOR_VACACIONES_POR_ROL).includes(getUsuarioIdSesion(userId, rol))
  );
}

/** Ve la cartera completa, sin filtrar por vendedor ni captador. */
export function veTodaLaCartera(rol?: string | null): boolean {
  return esSuperAdmin(rol);
}
