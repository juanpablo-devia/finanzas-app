import { colorCategoria } from '../utils/categorias'
import { formatearPesos } from '../utils/formato'

export interface Porcion {
  categoria: string
  total: number
}

interface Props {
  porciones: Porcion[] // ordenadas de mayor a menor
  total: number
}

/**
 * Dona hecha con SVG puro.
 * Truco: un círculo de radio 15.915 tiene un perímetro de ~100,
 * así cada porción se dibuja con stroke-dasharray="porcentaje resto".
 */
export default function GraficoDona({ porciones, total }: Props) {
  let acumulado = 0

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-48 w-48">
        <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
          {/* Fondo gris */}
          <circle cx="21" cy="21" r="15.915" fill="none" strokeWidth="6" className="stroke-gray-100 dark:stroke-gray-800" />
          {porciones.map((p) => {
            const porcentaje = (p.total / total) * 100
            const desplazamiento = -acumulado
            acumulado += porcentaje
            return (
              <circle
                key={p.categoria}
                cx="21"
                cy="21"
                r="15.915"
                fill="none"
                stroke={colorCategoria(p.categoria)}
                strokeWidth="6"
                strokeDasharray={`${porcentaje} ${100 - porcentaje}`}
                strokeDashoffset={desplazamiento}
              />
            )
          })}
        </svg>
        {/* Texto del centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">Gastaste</span>
          <span className="text-lg font-bold">{formatearPesos(total)}</span>
        </div>
      </div>

      {/* Leyenda */}
      <ul className="w-full space-y-3">
        {porciones.map((p) => {
          const porcentaje = Math.round((p.total / total) * 100)
          return (
            <li key={p.categoria}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colorCategoria(p.categoria) }} />
                  {p.categoria}
                </span>
                <span>
                  <b>{formatearPesos(p.total)}</b>{' '}
                  <span className="text-gray-400">· {porcentaje}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${porcentaje}%`, backgroundColor: colorCategoria(p.categoria) }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
