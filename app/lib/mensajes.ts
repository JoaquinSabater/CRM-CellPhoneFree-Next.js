import { db } from '@/app/lib/mysql';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// 'vendedor' es el turno "Humano:" del transcript: lo que respondio un empleado desde el CRM.
export type RemitenteTipo = 'prospecto' | 'bot' | 'vendedor';

export const MODOS_ATENCION = ['bot', 'humano'] as const;
export type ModoAtencion = (typeof MODOS_ATENCION)[number];

export type Mensaje = {
  id: string;
  conversacion_id: string;
  remitente_tipo: RemitenteTipo;
  contenido: string;
  // La tabla no guarda la fecha de cada mensaje: se reconstruye desde respuesta_json
  // y queda en null cuando no se puede datar con certeza.
  timestamp: string | null;
};

export type Conversacion = {
  id: string; // el telefono es la clave primaria de chatbot_whatsapp
  telefono: string;
  nombre: string;
  estado: string;
  modo_atencion: ModoAtencion;
  localidad: string | null;
  observaciones: string | null;
  prospecto_id: number | null;
  sin_responder: boolean;
  ultima_actividad: string;
  mensajes: Mensaje[];
};

type ChatbotRow = RowDataPacket & {
  phone: string;
  name: string | null;
  mensaje: string | null;
  estado: string | null;
  modo_atencion: string | null;
  respuesta_json: unknown;
  created_at: Date;
  updated_at: Date;
  prospecto_id: number | null;
};

type Turno = { remitente_tipo: RemitenteTipo; contenido: string };

const MARCA_TURNO = /^(Cliente|Bot|Humano)\s*:\s?(.*)$/;
const REMITENTE_POR_MARCA: Record<string, RemitenteTipo> = {
  Cliente: 'prospecto',
  Bot: 'bot',
  Humano: 'vendedor',
};
const MAX_SNAPSHOTS = 50;

// El bot acumula toda la charla en la columna `mensaje`: arranca con el mensaje con el que
// escribió el prospecto y despues agrega bloques "Cliente: ... / Bot: ... / Humano: ...".
function parsearTranscripcion(texto: string): Turno[] {
  const turnos: { remitente_tipo: RemitenteTipo; lineas: string[] }[] = [];

  for (const linea of texto.split('\n')) {
    const marca = MARCA_TURNO.exec(linea);
    if (marca) {
      turnos.push({ remitente_tipo: REMITENTE_POR_MARCA[marca[1]], lineas: [marca[2]] });
      continue;
    }
    // Lo que viene antes del primer "Cliente:" es el mensaje inicial del prospecto.
    if (turnos.length === 0) turnos.push({ remitente_tipo: 'prospecto', lineas: [] });
    turnos[turnos.length - 1].lineas.push(linea);
  }

  return turnos
    .map(({ remitente_tipo, lineas }) => ({ remitente_tipo, contenido: lineas.join('\n').trim() }))
    .filter(({ contenido }) => contenido !== '');
}

function parsearJson(valor: unknown): Record<string, any> | null {
  if (valor && typeof valor === 'object') return valor as Record<string, any>;
  if (typeof valor !== 'string') return null;
  try {
    const parseado = JSON.parse(valor);
    return parseado && typeof parseado === 'object' ? parseado : null;
  } catch {
    return null;
  }
}

// Las fechas dentro del JSON vienen como "2026-08-19 11:35:02".
function parsearFechaJson(valor: unknown): number | null {
  if (typeof valor !== 'string') return null;
  const ms = Date.parse(`${valor.trim().replace(' ', 'T')}Z`);
  return Number.isNaN(ms) ? null : ms;
}

// Cada respuesta_json guarda una copia del estado anterior anidada dentro de si misma, con el
// transcript tal como estaba en ese momento. La cantidad de turnos de cada copia indica hasta
// donde habia llegado la charla en su updated_at, y eso permite fechar cada mensaje.
function construirLineaDeTiempo(row: ChatbotRow, cantidadTurnos: number): (string | null)[] {
  const creado = row.created_at?.getTime() ?? null;
  const actualizado = row.updated_at?.getTime() ?? null;
  const json = parsearJson(row.respuesta_json);

  // Las fechas del JSON estan en hora local y las columnas en UTC: created_at es el mismo dato
  // en los dos lados, asi que su diferencia da el desfasaje a aplicar sobre el resto.
  const creadoJson = parsearFechaJson(json?.created_at);
  const desfasaje = creado !== null && creadoJson !== null ? creado - creadoJson : 0;

  const snapshots: { turnos: number; ms: number }[] = [];
  let nivel = json;
  for (let i = 0; nivel && i < MAX_SNAPSHOTS; i++) {
    const ms = parsearFechaJson(nivel.updated_at);
    if (ms !== null && typeof nivel.mensaje === 'string') {
      snapshots.push({ turnos: parsearTranscripcion(nivel.mensaje).length, ms: ms + desfasaje });
    }
    nivel = parsearJson(nivel.respuesta_json);
  }
  snapshots.sort((a, b) => a.ms - b.ms);

  return Array.from({ length: cantidadTurnos }, (_, indice) => {
    if (indice === 0) return creado !== null ? new Date(creado).toISOString() : null;
    const snapshot = snapshots.find((s) => s.turnos > indice);
    if (snapshot) return new Date(snapshot.ms).toISOString();
    // Mas nuevo que cualquier copia guardada: pertenece a la ultima actualizacion de la fila.
    return actualizado !== null ? new Date(actualizado).toISOString() : null;
  });
}

function textoONull(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : null;
}

function mapearConversacion(row: ChatbotRow): Conversacion {
  const json = parsearJson(row.respuesta_json);
  const turnos = parsearTranscripcion(row.mensaje ?? '');
  const fechas = construirLineaDeTiempo(row, turnos.length);

  const mensajes: Mensaje[] = turnos.map((turno, indice) => ({
    id: `${row.phone}-${indice}`,
    conversacion_id: row.phone,
    remitente_tipo: turno.remitente_tipo,
    contenido: turno.contenido,
    timestamp: fechas[indice],
  }));

  return {
    id: row.phone,
    telefono: row.phone,
    nombre: textoONull(row.name) ?? row.phone,
    estado: textoONull(row.estado) ?? 'nuevo',
    modo_atencion: row.modo_atencion === 'humano' ? 'humano' : 'bot',
    localidad: textoONull(json?.localidad),
    observaciones: textoONull(json?.observaciones),
    prospecto_id: row.prospecto_id ?? null,
    sin_responder: mensajes.at(-1)?.remitente_tipo === 'prospecto',
    ultima_actividad: (row.updated_at ?? row.created_at)?.toISOString() ?? new Date().toISOString(),
    mensajes,
  };
}

const SELECT_CONVERSACIONES = `
  SELECT
    c.phone,
    c.name,
    c.mensaje,
    c.estado,
    c.modo_atencion,
    c.respuesta_json,
    c.created_at,
    c.updated_at,
    (
      SELECT p.id
      FROM prospectos p
      WHERE REGEXP_REPLACE(p.telefono, '[^0-9]', '') = c.phone
      ORDER BY p.id DESC
      LIMIT 1
    ) AS prospecto_id
  FROM chatbot_whatsapp c
`;

export async function getConversaciones(): Promise<Conversacion[]> {
  const [rows] = await db.query<ChatbotRow[]>(`${SELECT_CONVERSACIONES} ORDER BY c.updated_at DESC`);

  return rows.map(mapearConversacion);
}

export async function getConversacion(phone: string): Promise<Conversacion | null> {
  const [rows] = await db.query<ChatbotRow[]>(`${SELECT_CONVERSACIONES} WHERE c.phone = ? LIMIT 1`, [phone]);

  return rows[0] ? mapearConversacion(rows[0]) : null;
}

export async function getModoAtencion(phone: string): Promise<ModoAtencion | null> {
  const [rows] = await db.query<(RowDataPacket & { modo_atencion: string })[]>(
    'SELECT modo_atencion FROM chatbot_whatsapp WHERE phone = ? LIMIT 1',
    [phone],
  );

  if (!rows[0]) return null;
  return rows[0].modo_atencion === 'humano' ? 'humano' : 'bot';
}

// Devuelve false cuando no existe una conversacion con ese telefono.
// updated_at tiene ON UPDATE CURRENT_TIMESTAMP y se usa para ordenar y fechar los mensajes:
// se reasigna a si mismo para que cambiar de modo no cuente como actividad de la charla.
export async function actualizarModoAtencion(phone: string, modo: ModoAtencion): Promise<boolean> {
  const [resultado] = await db.query<ResultSetHeader>(
    'UPDATE chatbot_whatsapp SET modo_atencion = ?, updated_at = updated_at WHERE phone = ?',
    [modo, phone],
  );

  return resultado.affectedRows > 0;
}
