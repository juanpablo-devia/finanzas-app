import type { Meta } from '../types'
import { formatearPesos } from '../utils/formato'
import { calcularPlanMeta } from '../utils/metas'
import ConsejoMeta from './ConsejoMeta'

interface Props {
  meta: Meta
  ingresoDiario: number
  onAbonar: () => void
  onEditar: () => void
}

export default function TarjetaMeta({ meta, ingresoDiario, onAbonar, onEditar }: Props) {
  const plan = calcularPlanMeta(meta)
  const porcentaje = Math.round(plan.progreso * 100)

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-2xl dark:bg-emerald-950">
            {meta.emoji}
          </span>
          <div>
            <p className="font-semibold">{meta.nombre}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatearPesos(meta.ahorrado)} de {formatearPesos(meta.montoObjetivo)}
            </p>
          </div>
        </div>
        <span className="text-sm font-semibold text-emerald-600">{porcentaje}%</span>
      </div>

      {/* Barra de progreso */}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
        {plan.completada ? (
          '🎉 ¡Meta cumplida!'
        ) : plan.vencida ? (
          `⏰ Se pasó la fecha. Te faltan ${formatearPesos(plan.faltante)}`
        ) : (
          <>
            Guarda <b>{formatearPesos(plan.porDia)}</b> al día · {formatearPesos(plan.porSemana)} a la
            semana · faltan {plan.diasRestantes} días
          </>
        )}
      </p>

      {/* Aviso de meta realista */}
      {!plan.completada && !plan.vencida && (
        <div className="mt-3">
          <ConsejoMeta porDia={plan.porDia} faltante={plan.faltante} ingresoDiario={ingresoDiario} />
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={onAbonar}
          className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white transition active:scale-95"
        >
          {plan.completada ? 'Retirar' : 'Abonar'}
        </button>
        <button
          onClick={onEditar}
          className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition active:scale-95 dark:bg-gray-800 dark:text-gray-300"
        >
          Editar
        </button>
      </div>
    </article>
  )
}
