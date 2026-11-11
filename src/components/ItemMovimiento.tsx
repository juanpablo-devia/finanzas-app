import type { Movimiento } from '../types'
import { formatearFecha, formatearPesos } from '../utils/formato'

interface Props {
  movimiento: Movimiento
  onTocar: (movimiento: Movimiento) => void
}

export default function ItemMovimiento({ movimiento: m, onTocar }: Props) {
  const esIngreso = m.tipo === 'ingreso'

  return (
    <li
      onClick={() => onTocar(m)}
      className="flex cursor-pointer items-center justify-between rounded-2xl bg-white p-4 shadow-sm transition active:scale-[0.98] dark:bg-gray-900"
    >
      <div>
        <p className="font-medium">{m.descripcion}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {m.categoria} · {formatearFecha(m.fecha)}
        </p>
      </div>
      <p className={`font-semibold ${esIngreso ? 'text-emerald-600' : 'text-red-500'}`}>
        {esIngreso ? '+' : '-'}
        {formatearPesos(m.monto)}
      </p>
    </li>
  )
}
