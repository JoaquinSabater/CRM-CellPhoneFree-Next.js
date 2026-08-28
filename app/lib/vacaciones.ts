import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

export type VacationStatus = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';

export interface VacationBalance extends RowDataPacket {
  id: number;
  usuario_id: number;
  anio: number;
  dias_totales: number;
  dias_usados: number;
  dias_pendientes: number;
  dias_restantes: number;
}

export interface VacationRequest extends RowDataPacket {
  id: number;
  usuario_id: number;
  fecha_desde: string;
  fecha_hasta: string;
  cantidad_dias: number;
  comentario: string | null;
  estado: VacationStatus;
  aprobado_por: number | null;
  fecha_aprobacion: string | null;
  motivo_rechazo: string | null;
  fecha_solicitud: string;
  fecha_actualizacion: string;
  username?: string;
  email?: string;
  rol?: string | null;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function countVacationDays(fechaDesde: string, fechaHasta: string) {
  const start = new Date(`${fechaDesde}T00:00:00`);
  const end = new Date(`${fechaHasta}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

export function getVacationYear(fechaDesde: string) {
  return Number(fechaDesde.slice(0, 4));
}

export function mapBalance(balance?: VacationBalance) {
  return {
    dias_totales: balance?.dias_totales ?? 0,
    dias_usados: balance?.dias_usados ?? 0,
    dias_pendientes: balance?.dias_pendientes ?? 0,
    dias_restantes: balance?.dias_restantes ?? 0,
  };
}

export function mapRequest(request: VacationRequest) {
  return {
    id: request.id,
    usuario_id: request.usuario_id,
    fecha_desde: request.fecha_desde,
    fecha_hasta: request.fecha_hasta,
    cantidad_dias: request.cantidad_dias,
    comentario: request.comentario ?? '',
    estado: request.estado,
    aprobado_por: request.aprobado_por,
    fecha_aprobacion: request.fecha_aprobacion,
    motivo_rechazo: request.motivo_rechazo ?? '',
    fecha_solicitud: request.fecha_solicitud,
    fecha_actualizacion: request.fecha_actualizacion,
    usuario: request.username || request.email
      ? {
          username: request.username ?? '',
          email: request.email ?? '',
          rol: request.rol ?? '',
        }
      : undefined,
  };
}
