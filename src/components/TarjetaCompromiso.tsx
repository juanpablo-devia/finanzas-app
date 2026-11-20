import { useState } from 'react'
import type { Compromiso, Cuota } from '../types'
import { resumenCompromiso, textoDias } from '../utils/cuotas'
import { formatearPesos, hoyISO } from '../utils/formato'
import { diasEntre } from '../utils/metas'

interface Props {
  compromiso: Compromiso
  nombreBolsillo?: string
  onTocarCuota: (cuota: Cuota) => void // pagar o deshacer
  onEditar: () => void
}

const formatearFechaCorta = (iso: string) =>
  new Date(iso + 'T00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: '2-digit' })

export default function TarjetaCompromiso({ compromiso, nombreBolsillo, onTocarCuota, onEditar }: Props) {
  const [verTodas, setVerTodas] = useState(false)
  const r = resumenCompromiso(compromiso)
  const porcentaje = r.total > 0 ? Math.round((r.pagado / r.total) * 100) : 0
  const hoy = hoyISO()

  const ordenadas = [...compromiso.cuotas].sort((a, b) => a.numero - b.numero)
  // Por defecto: las pendientes más cercanas (máx. 3). "Ver todas" muestra también las pagadas.
  const visibles = verTodas ? ordenadas : ordenadas.filter((c) => !c.pagada).slice(0, 3)

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-2xl dark:bg-indigo-950">
            {compromiso.emoji}
          </span>
          <div>
            <p className="font-semibold">{compromiso.nombre}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {compromiso.acreedor ? `A ${compromiso.acreedor} · ` : ''}
              {r.pagadas} de {r.cantidad} cuotas
            </p>
          </div>
        </div>
        <button onClick={onEditar} className="text-xs font-medium text-gray-400">
          Editar
        </button>
      </div>

      {/* Progreso de pago */}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Pagado {formatearPesos(r.pagado)}</span>
        <span>Falta {formatearPesos(r.pendiente)}</span>
      </div>

      {r.terminado ? (
        <p className="mt-3 text-sm">🎉 ¡Terminaste de pagar!</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {visibles.map((c) => {
            const dias = diasEntre(hoy, c.fecha)
            const vencida = !c.pagada && dias < 0
            const pronto = !c.pagada && dias >= 0 && dias <= 7
            return (
              <li key={c.numero}>
                <button
                  onClick={() => onTocarCuota(c)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition active:scale-[0.98] active:bg-gray-50 dark:active:bg-gray-800"
                >
                  {/* Círculo de check */}
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs text-white ${
                      c.pagada ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {c.pagada && '✓'}
                  </span>
                  <span className="flex-1">
                    <span className={`block text-sm ${c.pagada ? 'text-gray-400 line-through' : ''}`}>
                      Cuota {c.numero} · {formatearFechaCorta(c.fecha)}
                    </span>
                    {!c.pagada && (
                      <span
                        className={`text-[11px] ${
                          vencida ? 'font-semibold text-red-500' : pronto ? 'text-amber-600' : 'text-gray-400'
                        }`}
                      >
                        {textoDias(dias)}
                      </span>
                    )}
                  </span>
                  <span className={`text-sm font-semibold ${c.pagada ? 'text-gray-400' : ''}`}>
                    {formatearPesos(c.monto)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>{nombreBolsillo ? `Sale del bolsillo ${nombreBolsillo}` : 'Sale de tu saldo disponible'}</span>
        <button onClick={() => setVerTodas(!verTodas)} className="font-medium text-indigo-500">
          {verTodas ? 'Ver menos' : `Ver las ${r.cantidad}`}
        </button>
      </div>
    </article>
  )
}
