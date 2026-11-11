import TarjetaMeta from '../components/TarjetaMeta'
import type { Meta } from '../types'
import { formatearPesos } from '../utils/formato'

interface Props {
  metas: Meta[]
  totalAhorrado: number
  ingresoDiario: number
  onNuevaMeta: () => void
  onAbonar: (meta: Meta) => void
  onEditar: (meta: Meta) => void
}

export default function Metas({ metas, totalAhorrado, ingresoDiario, onNuevaMeta, onAbonar, onEditar }: Props) {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Metas</h1>
        <button
          onClick={onNuevaMeta}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-95"
        >
          + Nueva meta
        </button>
      </div>

      {metas.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-900">
          <p className="text-4xl">🎯</p>
          <p className="mt-3 font-semibold">Aún no tienes metas</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Crea una y te digo cuánto guardar cada día para cumplirla.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Llevas <b className="text-emerald-600">{formatearPesos(totalAhorrado)}</b> ahorrados en{' '}
            {metas.length} {metas.length === 1 ? 'meta' : 'metas'}.
          </p>
          <div className="space-y-3">
            {metas.map((meta) => (
              <TarjetaMeta
                key={meta.id}
                meta={meta}
                ingresoDiario={ingresoDiario}
                onAbonar={() => onAbonar(meta)}
                onEditar={() => onEditar(meta)}
              />
            ))}
          </div>
        </>
      )}
    </>
  )
}
