import { useState } from 'react'
import { CATEGORIAS, type Movimiento, type TipoMovimiento } from '../types'
import { generarId } from '../utils/id'
import { hoyISO } from '../utils/formato'

interface Props {
  onGuardar: (movimiento: Movimiento) => void
  onCerrar: () => void
}

const estiloCampo =
  'mt-1 w-full rounded-xl bg-gray-100 px-4 py-3 text-base outline-none dark:bg-gray-800'

export default function FormularioMovimiento({ onGuardar, onCerrar }: Props) {
  const [tipo, setTipo] = useState<TipoMovimiento>('gasto')
  const [monto, setMonto] = useState('') // solo dígitos: "15000"
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS.gasto[0])
  const [fecha, setFecha] = useState(hoyISO())

  function cambiarTipo(nuevo: TipoMovimiento) {
    setTipo(nuevo)
    setCategoria(CATEGORIAS[nuevo][0])
  }

  function guardar() {
    const valor = Number(monto)
    if (!valor) return
    onGuardar({
      id: generarId(),
      tipo,
      monto: valor,
      descripcion: descripcion.trim() || categoria,
      categoria,
      fecha,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onCerrar}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          guardar()
        }}
        className="w-full max-w-md space-y-4 rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] dark:bg-gray-900"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nuevo movimiento</h2>
          <button type="button" onClick={onCerrar} className="text-gray-500">
            Cancelar
          </button>
        </div>

        {/* Selector gasto / ingreso */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          {(['gasto', 'ingreso'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => cambiarTipo(t)}
              className={`rounded-lg py-2 text-sm font-medium capitalize transition ${
                tipo === t
                  ? t === 'gasto'
                    ? 'bg-red-500 text-white'
                    : 'bg-emerald-600 text-white'
                  : 'text-gray-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Monto */}
        <label className="block">
          <span className="text-sm text-gray-500 dark:text-gray-400">Monto</span>
          <div className="mt-1 flex items-center rounded-xl bg-gray-100 px-4 dark:bg-gray-800">
            <span className="text-2xl font-semibold text-gray-400">$</span>
            <input
              inputMode="numeric"
              placeholder="0"
              value={monto ? Number(monto).toLocaleString('es-CO') : ''}
              onChange={(e) => setMonto(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-transparent px-2 py-3 text-2xl font-semibold outline-none"
            />
          </div>
        </label>

        {/* Descripción */}
        <label className="block">
          <span className="text-sm text-gray-500 dark:text-gray-400">Descripción (opcional)</span>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Almuerzo con la novia"
            className={estiloCampo}
          />
        </label>

        {/* Categoría y fecha */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-gray-500 dark:text-gray-400">Categoría</span>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={estiloCampo}>
              {CATEGORIAS[tipo].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-gray-500 dark:text-gray-400">Fecha</span>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={estiloCampo} />
          </label>
        </div>

        <button
          type="submit"
          disabled={!monto}
          className="w-full rounded-xl bg-emerald-600 py-4 font-semibold text-white transition active:scale-95 disabled:opacity-40"
        >
          Guardar
        </button>
      </form>
    </div>
  )
}