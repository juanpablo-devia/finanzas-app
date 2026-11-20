import type { Compromiso } from '../types'
import { proximosPagos, textoDias } from '../utils/cuotas'
import { formatearPesos } from '../utils/formato'

interface Props {
  compromisos: Compromiso[]
  onVerTodo: () => void
}

export default function ProximosPagos({ compromisos, onVerTodo }: Props) {
  const pagos = proximosPagos(compromisos).slice(0, 3)
  if (pagos.length === 0) return null

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Próximos pagos</h2>
        <button onClick={onVerTodo} className="text-sm font-medium text-emerald-600">
          Ver todo →
        </button>
      </div>
      <ul className="space-y-2">
        {pagos.map(({ compromiso, cuota, dias }) => {
          const vencida = dias < 0
          const pronto = dias >= 0 && dias <= 7
          return (
            <li key={`${compromiso.id}-${cuota.numero}`}>
              <button
                onClick={onVerTodo}
                className={`flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm transition active:scale-[0.98] dark:bg-gray-900 ${
                  vencida ? 'ring-2 ring-red-500/50' : ''
                }`}
              >
                <span className="text-2xl">{compromiso.emoji}</span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">
                    {compromiso.nombre} · cuota {cuota.numero}/{compromiso.cuotas.length}
                  </span>
                  <span
                    className={`text-xs ${
                      vencida ? 'font-semibold text-red-500' : pronto ? 'text-amber-600' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {textoDias(dias)}
                    {compromiso.acreedor && ` · a ${compromiso.acreedor}`}
                  </span>
                </span>
                <span className="font-semibold">{formatearPesos(cuota.monto)}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
