import type { Previsto } from '../types'
import { formatearFecha, formatearPesos, hoyISO } from '../utils/formato'
import { pendientesPorConfirmar } from '../utils/proyeccion'

interface Props {
  previstos: Previsto[]
  onRegistrar: (previsto: Previsto, fecha: string) => void
  onDescartar: (previsto: Previsto, fecha: string) => void
}

// "¿Ya te llegó?": ingresos y gastos previstos cuya fecha ya llegó y no has registrado
export default function PorConfirmar({ previstos, onRegistrar, onDescartar }: Props) {
  const pendientes = pendientesPorConfirmar(previstos, hoyISO())
  if (pendientes.length === 0) return null

  return (
    <section className="mt-4 space-y-2">
      {pendientes.map(({ previsto, fecha }) => {
        const esIngreso = previsto.tipo === 'ingreso'
        return (
          <div
            key={`${previsto.id}-${fecha}`}
            className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/50"
          >
            <span className="text-2xl">{esIngreso ? '💰' : '🧾'}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                {esIngreso ? '¿Ya te llegó?' : '¿Ya lo pagaste?'}
              </p>
              <p className="truncate text-xs text-amber-800 dark:text-amber-200">
                {previsto.descripcion} · {formatearPesos(previsto.monto)} · {formatearFecha(fecha)}
              </p>
            </div>
            <button
              onClick={() => onDescartar(previsto, fecha)}
              aria-label="No llegó"
              className="rounded-lg px-2 py-1 text-xs text-amber-700 dark:text-amber-300"
            >
              No
            </button>
            <button
              onClick={() => onRegistrar(previsto, fecha)}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95"
            >
              Sí, registrar
            </button>
          </div>
        )
      })}
    </section>
  )
}
