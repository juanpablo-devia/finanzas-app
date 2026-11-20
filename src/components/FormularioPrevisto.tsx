import { useState } from 'react'
import type { Frecuencia, Previsto, TipoMovimiento } from '../types'
import { hoyISO } from '../utils/formato'
import { generarId } from '../utils/id'
import CampoSelect from './CampoSelect'

interface Props {
  categorias: Record<TipoMovimiento, string[]>
  previsto?: Previsto // si viene, el formulario está en modo EDICIÓN
  onGuardar: (previsto: Previsto) => void
  onEliminar?: (previsto: Previsto) => void
  onCerrar: () => void
}

const estiloCampo =
  'mt-1 w-full rounded-xl bg-gray-100 px-4 py-3 text-base outline-none dark:bg-gray-800'

const FRECUENCIAS: { id: Frecuencia; etiqueta: string }[] = [
  { id: 'una vez', etiqueta: 'Una vez' },
  { id: 'semanal', etiqueta: 'Cada semana' },
  { id: 'mensual', etiqueta: 'Cada mes' },
]

export default function FormularioPrevisto({ categorias, previsto, onGuardar, onEliminar, onCerrar }: Props) {
  const esEdicion = previsto !== undefined
  const [tipo, setTipo] = useState<TipoMovimiento>(previsto?.tipo ?? 'ingreso')
  const [monto, setMonto] = useState(previsto ? String(previsto.monto) : '')
  const [descripcion, setDescripcion] = useState(previsto?.descripcion ?? '')
  const [categoria, setCategoria] = useState(previsto?.categoria ?? categorias.ingreso[0] ?? 'Otro')
  const [frecuencia, setFrecuencia] = useState<Frecuencia>(previsto?.frecuencia ?? 'una vez')
  const [desde, setDesde] = useState(previsto?.desde ?? hoyISO())
  const [hasta, setHasta] = useState(previsto?.hasta ?? '')

  const valido = Number(monto) > 0 && desde !== '' && (frecuencia === 'una vez' || !hasta || hasta >= desde)

  function cambiarTipo(nuevo: TipoMovimiento) {
    setTipo(nuevo)
    setCategoria(categorias[nuevo][0] ?? 'Otro')
  }

  function guardar() {
    if (!valido) return
    onGuardar({
      id: previsto?.id ?? generarId(),
      tipo,
      descripcion: descripcion.trim() || categoria,
      categoria,
      monto: Number(monto),
      desde,
      frecuencia,
      hasta: frecuencia === 'una vez' ? '' : hasta,
      confirmadas: previsto?.confirmadas ?? [],
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
        className="max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] dark:bg-gray-900"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{esEdicion ? 'Editar plan' : '¿Qué esperas?'}</h2>
          <button type="button" onClick={onCerrar} className="text-gray-500">
            Cancelar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          {(['ingreso', 'gasto'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => cambiarTipo(t)}
              className={`rounded-lg py-2 text-sm font-medium transition ${
                tipo === t ? (t === 'gasto' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white') : 'text-gray-500'
              }`}
            >
              {t === 'ingreso' ? 'Me va a entrar' : 'Voy a gastar'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-gray-500 dark:text-gray-400">Monto</span>
            <input
              inputMode="numeric"
              placeholder="$ 0"
              value={monto ? '$ ' + Number(monto).toLocaleString('es-CO') : ''}
              onChange={(e) => setMonto(e.target.value.replace(/\D/g, ''))}
              className={estiloCampo}
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {tipo === 'ingreso' ? '¿De dónde?' : 'Categoría'}
            </span>
            <CampoSelect value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {categorias[tipo].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </CampoSelect>
          </label>
        </div>

        <label className="block">
          <span className="text-sm text-gray-500 dark:text-gray-400">Descripción</span>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder={tipo === 'ingreso' ? 'Ej: Pago de fin de mes' : 'Ej: Regalos familia'}
            className={estiloCampo}
          />
        </label>

        {/* Frecuencia */}
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          {FRECUENCIAS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFrecuencia(f.id)}
              className={`rounded-lg py-2 text-sm font-medium transition ${
                frecuencia === f.id ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500'
              }`}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {frecuencia === 'una vez' ? 'Fecha' : 'Desde'}
            </span>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={estiloCampo} />
          </label>
          {frecuencia !== 'una vez' && (
            <label className="block">
              <span className="text-sm text-gray-500 dark:text-gray-400">Hasta (opcional)</span>
              <input
                type="date"
                value={hasta}
                min={desde}
                onChange={(e) => setHasta(e.target.value)}
                className={estiloCampo}
              />
            </label>
          )}
        </div>

        <button
          type="submit"
          disabled={!valido}
          className="w-full rounded-xl bg-emerald-600 py-4 font-semibold text-white transition active:scale-95 disabled:opacity-40"
        >
          {esEdicion ? 'Guardar cambios' : 'Agregar al plan'}
        </button>

        {previsto && onEliminar && (
          <button type="button" onClick={() => onEliminar(previsto)} className="w-full py-2 text-sm font-medium text-red-500">
            Eliminar del plan
          </button>
        )}
      </form>
    </div>
  )
}
