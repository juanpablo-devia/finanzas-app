import { useState } from 'react'
import { EMOJIS_META, type Meta } from '../types'
import { generarId } from '../utils/id'
import { aISO, formatearPesos } from '../utils/formato'
import { calcularPlanMeta } from '../utils/metas'
import ConsejoMeta from './ConsejoMeta'

interface Props {
  meta?: Meta // si viene, el formulario está en modo EDICIÓN
  ingresoDiario: number
  onGuardar: (meta: Meta) => void
  onEliminar?: (meta: Meta) => void
  onCerrar: () => void
}

const estiloCampo =
  'mt-1 w-full rounded-xl bg-gray-100 px-4 py-3 text-base outline-none dark:bg-gray-800'

function mananaISO(): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + 1)
  return aISO(fecha)
}

export default function FormularioMeta({ meta, ingresoDiario, onGuardar, onEliminar, onCerrar }: Props) {
  const esEdicion = meta !== undefined
  const [nombre, setNombre] = useState(meta?.nombre ?? '')
  const [emoji, setEmoji] = useState(meta?.emoji ?? EMOJIS_META[0])
  const [monto, setMonto] = useState(meta ? String(meta.montoObjetivo) : '')
  const [fechaLimite, setFechaLimite] = useState(meta?.fechaLimite ?? '')

  const valida = nombre.trim() !== '' && Number(monto) > 0 && fechaLimite !== ''

  const nuevaMeta: Meta = {
    id: meta?.id ?? generarId(), // al editar conservamos el id
    nombre: nombre.trim(),
    emoji,
    montoObjetivo: Number(monto),
    ahorrado: meta?.ahorrado ?? 0, // al editar conservamos lo ahorrado
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
        className="max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] dark:bg-gray-900"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{esEdicion ? 'Editar meta' : 'Nueva meta'}</h2>
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
              min={esEdicion ? undefined : mananaISO()}
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
              className={estiloCampo}
            />
          </label>
        </div>

        {vistaPrevia && !vistaPrevia.completada && (
          <div className="space-y-2">
            <p className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-800/60">
              Tendrías que guardar <b>{formatearPesos(vistaPrevia.porDia)}</b> al día durante{' '}
              {vistaPrevia.diasRestantes} días.
            </p>
            <ConsejoMeta
              porDia={vistaPrevia.porDia}
              faltante={vistaPrevia.faltante}
              ingresoDiario={ingresoDiario}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={!valida}
          className="w-full rounded-xl bg-emerald-600 py-4 font-semibold text-white transition active:scale-95 disabled:opacity-40"
        >
          {esEdicion ? 'Guardar cambios' : 'Crear meta'}
        </button>

        {meta && onEliminar && (
          <button type="button" onClick={() => onEliminar(meta)} className="w-full py-2 text-sm font-medium text-red-500">
            Eliminar meta
          </button>
        )}
      </form>
    </div>
  )
}