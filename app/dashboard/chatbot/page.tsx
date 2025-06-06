'use client'

import { useState, useRef, useEffect } from 'react'
import GraficoItemPorSemanaChart from '@/app/ui/dashboard/GraficoItemPorSemanaChart'

type Message = { from: 'user' | 'bot'; text: string }

const STORAGE_KEY = 'chatbot-messages'
const TIMESTAMP_KEY = 'chatbot-last-saved'
const HISTORIAL_KEY = 'chatbot-input-historial'

export default function page() {
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const [historial, setHistorial] = useState<string[]>([])
  const [historialIndex, setHistorialIndex] = useState<number | null>(null)

  // Cargar mensajes e historial al montar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    const savedHistorial = localStorage.getItem(HISTORIAL_KEY)
    const savedAt = localStorage.getItem(TIMESTAMP_KEY)

    if (savedAt) {
      const timestamp = parseInt(savedAt, 10)
      const now = Date.now()

      const vencido = now - timestamp > 24 * 60 * 60 * 1000

      if (!vencido) {
        if (saved) setMessages(JSON.parse(saved))
        if (savedHistorial) setHistorial(JSON.parse(savedHistorial))
      } else {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(HISTORIAL_KEY)
        localStorage.removeItem(TIMESTAMP_KEY)
      }
    }
  }, [])

  // Guardar mensajes e historial cuando cambian
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
      localStorage.setItem(TIMESTAMP_KEY, Date.now().toString())
    }
  }, [messages])

  useEffect(() => {
    if (historial.length > 0) {
      localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial))
    }
  }, [historial])

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMessage = input.trim()

    setMessages(prev => [...prev, { from: 'user', text: userMessage }])
    setHistorial(prev => [userMessage, ...prev])
    setHistorialIndex(null)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chatbot-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: userMessage }),
      })

      const data = await res.json()
      setMessages(prev => [...prev, { from: 'bot', text: data.respuesta || 'No entendí tu consulta.' }])
    } catch (err) {
      setMessages(prev => [...prev, { from: 'bot', text: '❌ Error al procesar la consulta.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (historial.length === 0) return
      const nextIndex = historialIndex === null ? 0 : Math.min(historialIndex + 1, historial.length - 1)
      setHistorialIndex(nextIndex)
      setInput(historial[nextIndex])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historialIndex === null) return
      const nextIndex = historialIndex - 1
      if (nextIndex < 0) {
        setHistorialIndex(null)
        setInput('')
      } else {
        setHistorialIndex(nextIndex)
        setInput(historial[nextIndex])
      }
    }
  }

  return (
    <div className="h-full w-full flex flex-1 bg-orange-600">
      <div className="bg-white rounded-none shadow-none w-full h-full flex flex-col">
        <div className="p-4 border-b text-orange-600 font-bold text-xl">Asistente CRM 🤖</div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => {
            let parsed: any = null
            try {
              parsed = JSON.parse(msg.text)
            } catch {}

            return (
              <div key={i}>
                {parsed?.type === 'grafico_item_semana' ? (
                  <GraficoItemPorSemanaChart
                    labels={parsed.labels}
                    data={parsed.data}
                    title={parsed.title}
                  />
                ) : (
                  <div
                    className={`text-sm p-3 rounded-xl ${
                      msg.from === 'user'
                        ? 'bg-orange-100 text-right self-end'
                        : 'bg-gray-100 text-left'
                    }`}
                    dangerouslySetInnerHTML={{ __html: msg.text }}
                  />
                )}
              </div>
            )
          })}

          {loading && (
            <div className="text-sm text-gray-500 italic">Escribiendo...</div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t flex gap-2">
          <input
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:border-orange-600 focus:ring-orange-600"
            placeholder="Escribí una pregunta como: ¿quién compró más silky?"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            onClick={sendMessage}
            disabled={loading}
          >
            Enviar
          </button>
          <button
            className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300 text-sm"
            onClick={() => {
              setMessages([])
              setHistorial([])
              setHistorialIndex(null)
              localStorage.removeItem(STORAGE_KEY)
              localStorage.removeItem(HISTORIAL_KEY)
              localStorage.removeItem(TIMESTAMP_KEY)
            }}
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  )
}
