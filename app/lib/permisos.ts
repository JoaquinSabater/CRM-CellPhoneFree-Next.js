import type { RowDataPacket } from 'mysql2';

// Permisos de salida (estilo "tiempo libre" de Microsoft Shifts):
// un día puntual, completo o en un rango horario, que aprueba administración.

export type PermisoStatus = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';

export const TIPOS_PERMISO = {
  personal: 'Personal',
  medico: 'Médico',
  tramite: 'Trámite',
  familiar: 'Familiar',
  estudio: 'Estudio',
  otro: 'Otro',
} as const;

export type TipoPermiso = keyof typeof TIPOS_PERMISO;

export interface PermisoRequest extends RowDataPacket {
  id: number;
  usuario_id: number;
  tipo: TipoPermiso;
  fecha: string;
  dia_completo: number;
  hora_desde: string | null;
  hora_hasta: string | null;
  comentario: string | null;
  estado: PermisoStatus;
  aprobado_por: number | null;
  fecha_aprobacion: string | null;
  motivo_rechazo: string | null;
  fecha_solicitud: string;
  username?: string;
  email?: string;
  rol?: string | null;
}

/** Columnas comunes, con fecha y horas ya formateadas para el front. */
export const PERMISO_COLUMNS = `
  s.id, s.usuario_id, s.tipo,
  DATE_FORMAT(s.fecha, '%Y-%m-%d') AS fecha,
  s.dia_completo,
  TIME_FORMAT(s.hora_desde, '%H:%i') AS hora_desde,
  TIME_FORMAT(s.hora_hasta, '%H:%i') AS hora_hasta,
  s.comentario, s.estado, s.aprobado_por, s.fecha_aprobacion,
  s.motivo_rechazo, s.fecha_solicitud
`;

export function esTipoPermiso(value: unknown): value is TipoPermiso {
  return typeof value === 'string' && value in TIPOS_PERMISO;
}

export function isValidTimeString(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function mapPermiso(request: PermisoRequest) {
  return {
    id: request.id,
    usuario_id: request.usuario_id,
    tipo: request.tipo,
    fecha: request.fecha,
    dia_completo: Boolean(request.dia_completo),
    hora_desde: request.hora_desde,
    hora_hasta: request.hora_hasta,
    comentario: request.comentario ?? '',
    estado: request.estado,
    aprobado_por: request.aprobado_por,
    fecha_aprobacion: request.fecha_aprobacion,
    motivo_rechazo: request.motivo_rechazo ?? '',
    fecha_solicitud: request.fecha_solicitud,
    usuario: request.username || request.email
      ? {
          username: request.username ?? '',
          email: request.email ?? '',
          rol: request.rol ?? '',
        }
      : undefined,
  };
}
