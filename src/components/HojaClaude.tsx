import { useState } from 'react'
import type { Finanzas } from '../hooks/useFinanzas'
import { generarResumenParaClaude } from '../utils/resumenParaClaude'

const PREGUNTAS = [
  '¿Cómo voy esta semana?',
  '¿En qué estoy gastando de más?',
  'Revisa mi plan hasta enero',
  '¿Me alcanza para lo que quiero comprar?',
  '¿Cómo puedo ahorrar más?',
]

const CLAVE_NOTAS = 'notasParaClaude'

function leerNotas(): string {
  try {
    return localStorage.getItem(CLAVE_NOTAS) ?? ''
  } catch {
    return ''
  }
}

// Copia texto al portapapeles. navigator.clipboard solo existe en HTTPS (o localhost);
// si no está, usamos el método antiguo con un <textarea> temporal.
async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = texto
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  }
}

interface Props {
  finanzas: Finanzas
  nombre: string
  onCerrar: () => void
}

export default function HojaClaude({ finanzas, nombre, onCerrar }: Props) {
  const [pregunta, setPregunta] = useState('')
  const [notas, setNotas] = useState(leerNotas)
  const [verNotas, setVerNotas] = useState(false)
  const [verResumen, setVerResumen] = useState(false)
  const [incluirMovimientos, setIncluirMovimientos] = useState(true)
  const [aviso, setAviso] = useState('')

  const texto = generarResumenParaClaude(finanzas, { nombre, pregunta, notas, incluirMovimientos })
  const puedeCompartir = typeof navigator.share === 'function'

  function guardarNotas(valor: string) {
    setNotas(valor)
    try {
      localStorage.setItem(CLAVE_NOTAS, valor)
    } catch {
      // sin almacenamiento: se usan igual en este resumen, solo no se recuerdan
    }
  }

  async function copiarYAbrir() {
    const ok = await copiar(texto)
    setAviso(ok ? '✅ Copiado. Pégalo en el chat de Claude.' : 'No se pudo copiar. Abre "Ver lo que se va a enviar" y cópialo a mano.')
    if (ok) window.open('https://claude.ai/new', '_blank')
  }

  async function compartir() {
    try {
      await navigator.share({ text: texto })
    } catch {
      // el usuario canceló el menú de compartir: no pasa nada
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onCerrar}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-md animate-aparecer space-y-4 overflow-y-auto rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] dark:bg-gray-900"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">✨ Contarle a Claude</h2>
          <button onClick={onCerrar} className="text-gray-500">
            Cerrar
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Armo un resumen de tus finanzas con tu pregunta, y lo pegas en un chat con Claude.
        </p>

        {/* Preguntas rápidas */}
        <div className="flex flex-wrap gap-2">
          {PREGUNTAS.map((p) => (
            <button
              key={p}
              onClick={() => setPregunta(p)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                pregunta === p
                  ? 'bg-orange-500 text-white'
                  : 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <textarea
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          placeholder="O escribe tu pregunta…"
          rows={3}
          className="w-full rounded-xl bg-gray-100 px-4 py-3 text-base outline-none dark:bg-gray-800"
        />

        {/* Reglas y contexto */}
        <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
          <button onClick={() => setVerNotas(!verNotas)} className="flex w-full justify-between text-sm font-medium">
            <span>📌 Mis reglas y contexto {notas.trim() && '· guardado'}</span>
            <span className="text-gray-400">{verNotas ? '▲' : '▼'}</span>
          </button>
          {verNotas && (
            <textarea
              value={notas}
              onChange={(e) => guardarNotas(e.target.value)}
              placeholder="Ej: Pago o aparto cada cosa el mismo día que me llega. No sumo otra deuda hasta terminar de pagarle a mi primo. Las cuotas no deben pasar del 20% de mis ingresos fijos…"
              rows={6}
              className="mt-2 w-full rounded-lg bg-white px-3 py-2 text-sm outline-none dark:bg-gray-900"
            />
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <input
            type="checkbox"
            checked={incluirMovimientos}
            onChange={(e) => setIncluirMovimientos(e.target.checked)}
            className="h-4 w-4 accent-orange-500"
          />
          Incluir mis últimos 20 movimientos
        </label>

        {/* Vista previa */}
        <div>
          <button onClick={() => setVerResumen(!verResumen)} className="text-xs font-medium text-gray-500">
            {verResumen ? '▲ Ocultar' : '▼ Ver lo que se va a enviar'}
          </button>
          {verResumen && (
            <pre className="mt-2 max-h-60 overflow-auto rounded-lg bg-gray-50 p-3 text-[11px] whitespace-pre-wrap dark:bg-gray-800/60">
              {texto}
            </pre>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {puedeCompartir && (
            <button
              onClick={compartir}
              className="rounded-xl bg-gray-100 py-4 font-semibold transition active:scale-95 dark:bg-gray-800"
            >
              Compartir
            </button>
          )}
          <button
            onClick={copiarYAbrir}
            className={`rounded-xl bg-orange-500 py-4 font-semibold text-white transition active:scale-95 ${
              puedeCompartir ? '' : 'col-span-2'
            }`}
          >
            Copiar y abrir Claude
          </button>
        </div>

        {aviso && <p className="text-center text-sm">{aviso}</p>}

        <p className="text-center text-[11px] text-gray-400">
          Tus datos solo salen del teléfono cuando tú los pegas o compartes.
        </p>
      </div>
    </div>
  )
}
