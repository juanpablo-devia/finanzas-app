import { useState } from 'react'
import { CATEGORIAS, type Abono, type Meta, type Movimiento, type TipoMovimiento } from '../types'
import { generarId } from '../utils/id'
import { formatearPesos, hoyISO } from '../utils/formato'
import { calcularPlanMeta } from '../utils/metas'

interface Props {
  metas: Meta[]
  onGuardar: (movimiento: Movimiento, abono: Abono | null) => void
  onCerrar: () => void
}

const estiloCampo =
  'mt-1 w-full rounded-xl bg-gray-100 px-4 py-3 text-base outline-none dark:bg-gray-800'

const EJEMPLOS: Record<TipoMovimiento, string> = {
  gasto: 'Ej: Cena con tu pareja',
  ingreso: 'Ej: Pago de la semana',
}

const PORCENTAJES = [10, 20, 30, 50]

export default function FormularioMovimiento({ metas, onGuardar, onCerrar }: Props) {
  const metasActivas = metas.filter((m) => !calcularPlanMeta(m).completada)

  const [tipo, setTipo] = useState<TipoMovimiento>('gasto')
  const [monto, setMonto] = useState('') // solo dígitos
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS.gasto[0])
  const [fecha, setFecha] = useState(hoyISO())
  const [metaId, setMetaId] = useState(metasActivas[0]?.id ?? '')
  const [abono, setAbono] = useState('') // solo dígitos

  const valor = Number(monto)
  const metaElegida = metasActivas.find((m) => m.id === metaId)
  const planMeta = metaElegida ? calcularPlanMeta(metaElegida) : null

  // El abono no puede ser mayor que el ingreso ni que lo que le falta a la meta
  const valorAbono = Math.min(Number(abono), valor, planMeta?.faltante ?? 0)
  const mostrarReparto = tipo === 'ingreso' && valor > 0

  function cambiarTipo(nuevo: TipoMovimiento) {
    setTipo(nuevo)
    setCategoria(CATEGORIAS[nuevo][0])
  }

  function guardar() {
    if (!valor) return
    const movimiento: Movimiento = {
      id: generarId(),
      tipo,
      monto: valor,
      descripcion: descripcion.trim() || categoria,
      categoria,
      fecha,
    }
    const abonoFinal =
      mostrarReparto && metaElegida && valorAbono > 0 ? { metaId: metaElegida.id, monto: valorAbono } : null

    onGuardar(movimiento, abonoFinal)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onCerrar}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          guardar()
        }}
        className="max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] dark:bg-gray-900"
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
                tipo === t ? (t === 'gasto' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white') : 'text-gray-500'
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

        {/* Reparto del ingreso */}
        {mostrarReparto && metaElegida && planMeta && (
          <div className="space-y-3 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/60">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              🎯 ¿Cuánto apartas para tu meta?
            </p>

            {metasActivas.length > 1 && (
              <select value={metaId} onChange={(e) => setMetaId(e.target.value)} className={estiloCampo}>
                {metasActivas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.emoji} {m.nombre}
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-2">
              {PORCENTAJES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAbono(String(Math.round((valor * p) / 100)))}
                  className="flex-1 rounded-lg bg-white py-2 text-sm font-medium transition active:scale-95 dark:bg-gray-800"
                >
                  {p}%
                </button>
              ))}
            </div>

            <input
              inputMode="numeric"
              placeholder="O escribe un valor"
              value={abono ? '$ ' + Number(abono).toLocaleString('es-CO') : ''}
              onChange={(e) => setAbono(e.target.value.replace(/\D/g, ''))}
              className={estiloCampo}
            />

            <div className="flex justify-between text-sm">
              <span className="text-emerald-800 dark:text-emerald-200">
                {metaElegida.emoji} {metaElegida.nombre}: {formatearPesos(valorAbono)}
              </span>
              <span className="font-semibold">Para ti: {formatearPesos(valor - valorAbono)}</span>
            </div>

            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Para cumplirla a tiempo necesitas {formatearPesos(planMeta.porDia)} al día.
            </p>
          </div>
        )}

        {/* Descripción */}
        <label className="block">
          <span className="text-sm text-gray-500 dark:text-gray-400">Descripción (opcional)</span>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder={EJEMPLOS[tipo]}
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
          disabled={!valor}
          className="w-full rounded-xl bg-emerald-600 py-4 font-semibold text-white transition active:scale-95 disabled:opacity-40"
        >
          Guardar
        </button>
      </form>
    </div>
  )
}