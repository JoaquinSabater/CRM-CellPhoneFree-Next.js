'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PaperAirplaneIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import type { Conversacion, ModoAtencion } from '@/app/lib/mensajes';
import { EstadoChatBadge } from '@/app/ui/mensajes/EstadoChatBadge';
import { MessageBubble, Spinner } from '@/app/ui/mensajes/MessageBubble';
import { ModoAtencionToggle } from '@/app/ui/mensajes/ModoAtencionToggle';
import { Button } from '@/app/ui/button';

// Distancia al final del hilo dentro de la cual se sigue acompañando a los mensajes nuevos.
const MARGEN_FONDO_PX = 80;

// Las dos acciones devuelven el error a mostrar, o null si salieron bien.
export function ChatThread({
  conversacion,
  onSend,
  onCambiarModo,
  onBack,
}: {
  conversacion: Conversacion;
  onSend: (contenido: string) => Promise<string | null>;
  onCambiarModo: (modo: ModoAtencion) => Promise<string | null>;
  onBack?: () => void;
}) {
  const [texto, setTexto] = useState('');
  // Mensaje que ya salio del input y esta viajando a WhatsApp: se muestra como burbuja con
  // ruedita hasta que n8n confirma. No es parte del historial, que solo sale de chatbot_whatsapp.
  const [pendiente, setPendiente] = useState<string | null>(null);
  const enviandoRef = useRef(false);
  const [cambiandoModo, setCambiandoModo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pegadoAlFondo = useRef(true);
  const primerScroll = useRef(true);

  const modoHumano = conversacion.modo_atencion === 'humano';

  // El polling trae mensajes nuevos todo el tiempo: solo se baja si el usuario ya estaba al final,
  // para no sacarlo de donde esta leyendo.
  useEffect(() => {
    const lista = listaRef.current;
    if (!lista) return;
    if (primerScroll.current || pegadoAlFondo.current) {
      lista.scrollTo({ top: lista.scrollHeight, behavior: primerScroll.current ? 'auto' : 'smooth' });
    }
    primerScroll.current = false;
  }, [conversacion.mensajes.length, pendiente]);

  const handleScroll = () => {
    const lista = listaRef.current;
    if (!lista) return;
    pegadoAlFondo.current = lista.scrollHeight - lista.scrollTop - lista.clientHeight < MARGEN_FONDO_PX;
  };

  const handleCambiarModo = async (modo: ModoAtencion) => {
    if (cambiandoModo) return;
    setCambiandoModo(true);
    setError(null);
    setError(await onCambiarModo(modo));
    setCambiandoModo(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const contenido = texto.trim();
    if (!contenido || !modoHumano || enviandoRef.current) return;

    enviandoRef.current = true;
    pegadoAlFondo.current = true;
    setError(null);
    setPendiente(contenido);
    setTexto('');

    const errorEnvio = await onSend(contenido);

    enviandoRef.current = false;
    setPendiente(null);

    if (errorEnvio) {
      // El texto vuelve al input para poder reintentar, sin pisar lo que se haya escrito mientras tanto.
      setError(errorEnvio);
      setTexto((actual) => (actual.trim() ? actual : contenido));
      inputRef.current?.focus();
    }
  };

  const enviando = pendiente !== null;
  const envioDeshabilitado = !modoHumano || enviando || !texto.trim();

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
        {onBack && (
          <button onClick={onBack} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 md:hidden">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{conversacion.nombre}</p>
          <p className="truncate text-xs text-slate-500">
            {conversacion.telefono}
            {conversacion.localidad && ` · ${conversacion.localidad}`}
          </p>
        </div>
        <EstadoChatBadge estado={conversacion.estado} />
        <ModoAtencionToggle
          modo={conversacion.modo_atencion}
          disabled={cambiandoModo}
          onChange={handleCambiarModo}
        />
        {conversacion.prospecto_id && (
          <Link
            href={`/dashboard/prospects/${conversacion.prospecto_id}/edit`}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
            title="Ver ficha del prospecto"
          >
            <PencilSquareIcon className="h-5 w-5" />
          </Link>
        )}
      </div>

      {conversacion.observaciones && (
        <p className="border-b border-slate-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          {conversacion.observaciones}
        </p>
      )}

      <div ref={listaRef} onScroll={handleScroll} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
        {conversacion.mensajes.map((m) => (
          <MessageBubble key={m.id} mensaje={m} />
        ))}
        {pendiente !== null && (
          <MessageBubble
            enviando
            mensaje={{
              id: 'pendiente',
              conversacion_id: conversacion.id,
              remitente_tipo: 'vendedor',
              contenido: pendiente,
              timestamp: null,
            }}
          />
        )}
      </div>

      {error && (
        <p role="alert" className="border-t border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
          {error}
        </p>
      )}

      {!modoHumano && (
        <p className="border-t border-slate-200 bg-slate-100 px-4 py-2 text-xs text-slate-600">
          El bot está atendiendo esta conversación. Cambiá a modo humano para responder.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-200 p-3">
        <input
          ref={inputRef}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          disabled={!modoHumano}
          maxLength={4096}
          placeholder="Escribí un mensaje..."
          className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        />
        <Button
          type="submit"
          disabled={envioDeshabilitado}
          aria-disabled={envioDeshabilitado}
          className="!h-10 !w-10 !px-0 justify-center"
        >
          {enviando ? <Spinner className="h-5 w-5" /> : <PaperAirplaneIcon className="h-5 w-5" />}
          <span className="sr-only">{enviando ? 'Enviando...' : 'Enviar'}</span>
        </Button>
      </form>
    </div>
  );
}
