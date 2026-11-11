import ItemMovimiento from '../components/ItemMovimiento'
import type { Movimiento } from '../types'

interface Props {
  movimientos: Movimiento[]
  onTocarMovimiento: (movimiento: Movimiento) => void
}

export default function Movimientos({ movimientos, onTocarMovimiento }: Props) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Movimientos</h1>

      {movimientos.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:bg-gray-900">
          Aún no tienes movimientos. Toca <b>+</b> para agregar el primero.
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {movimientos.map((m) => (
              <ItemMovimiento key={m.id} movimiento={m} onTocar={onTocarMovimiento} />
            ))}
          </ul>
          <p className="mt-4 text-center text-xs text-gray-400">Toca un movimiento para eliminarlo</p>
        </>
      )}
    </>
  )
}
