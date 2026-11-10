import { useState } from 'react'
import { EMOJIS_META, type Meta } from '../types'
import { generarId } from '../utils/id'
import { aISO, formatearPesos } from '../utils/formato'
import { calcularPlanMeta } from '../utils/metas'

interface Props {
  onGuardar: (meta: Meta) => void
  onCerrar: () => void
}

const estiloCampo =
  'mt-1 w-full rounded-xl bg-gray-100 px-4 py-3 text-base outline-none dark:bg-gray-800'

function mananaISO(): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + 1)
  return aISO(fecha)
}

export default function FormularioMeta({ onGuardar, onCerrar }: Props) {
  const [nombre, setNombre] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS_META[0])
  const [monto, setMonto] = useState('')
  const [fechaLimite, setFechaLimite] = useState('')

  const valida = nombre.trim() !== '' && Number(monto) > 0 && fechaLimite !== ''

  const nuevaMeta: Meta = {
    id: generarId(),
    nombre: nombre.trim(),
    emoji,
    montoObjetivo: Number(monto),
    ahorrado: 0,
    fechaLimite,
  }

  // Vista previa en vivo de cuánto tendría que guardar
  const vistaPrevia = valida ? calcularPlanMeta(nuevaMeta) : null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onCerrar}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          if (valida) onGuardar(nuevaMeta)
        }}
        className="w-full max-w-md space-y-4 rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] dark:bg-gray-900"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nueva meta</h2>
          <button type="button" onClick={onCerrar} className="text-gray-500">
            Cancelar
          </button>
        </div>

        {/* Emoji */}
        <div className="grid grid-cols-8 gap-1">
          {EMOJIS_META.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`rounded-xl py-2 text-2xl transition ${
                emoji === e ? 'bg-emerald-100 ring-2 ring-emerald-500 dark:bg-emerald-950' : ''
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="text-sm text-gray-500 dark:text-gray-400">¿Para qué estás ahorrando?</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Regalos de Navidad"
            className={estiloCampo}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-gray-500 dark:text-gray-400">¿Cuánto necesitas?</span>
            <input
              inputMode="numeric"
              placeholder="$ 0"
              value={monto ? '$ ' + Number(monto).toLocaleString('es-CO') : ''}
              onChange={(e) => setMonto(e.target.value.replace(/\D/g, ''))}
              className={estiloCampo}
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-500 dark:text-gray-400">¿Para cuándo?</span>
            <input
              type="date"
              min={mananaISO()}
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
              className={estiloCampo}
            />
          </label>
        </div>

        {vistaPrevia && (
          <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            Tendrías que guardar <b>{formatearPesos(vistaPrevia.porDia)}</b> al día durante{' '}
            {vistaPrevia.diasRestantes} días.
          </p>
        )}

        <button
          type="submit"
          disabled={!valida}
          className="w-full rounded-xl bg-emerald-600 py-4 font-semibold text-white transition active:scale-95 disabled:opacity-40"
        >
          Crear meta
        </button>
      </form>
    </div>
  )
}