import { useState } from 'react'
import type { Abono, Meta, Movimiento, TipoMovimiento } from '../types'
import { generarId } from '../utils/id'
import { formatearPesos, hoyISO } from '../utils/formato'
import { calcularPlanMeta } from '../utils/metas'
import { guardarPlantilla, leerPlantilla } from '../utils/plantillas'
import CampoSelect from './CampoSelect'

interface Props {
  metas: Meta[]
  categorias: Record<TipoMovimiento, string[]>
  tipoInicial?: TipoMovimiento
  movimiento?: Movimiento // si viene, el formulario está en modo EDICIÓN
  valoresIniciales?: Omit<Movimiento, 'id'> // para arrancar con datos (ej. un ingreso esperado), sin ser edición
  onGuardar: (movimiento: Movimiento, abonos: Abono[]) => void
  onEliminar?: (movimiento: Movimiento) => void
  onCerrar: () => void
}

const estiloCampo =
  'mt-1 w-full rounded-xl bg-gray-100 px-4 py-3 text-base outline-none dark:bg-gray-800'

const EJEMPLOS: Record<TipoMovimiento, string> = {
  gasto: 'Ej: Cena con tu pareja',
  ingreso: 'Ej: Pago de la semana',
}

const redondearMil = (n: number) => Math.round(n / 1000) * 1000
const formatearDigitos = (digitos: string) => (digitos ? Number(digitos).toLocaleString('es-CO') : '')

export default function FormularioMovimiento({
  metas,
  categorias,
  tipoInicial = 'gasto',
  movimiento,
  valoresIniciales,
  onGuardar,
  onEliminar,
  onCerrar,
}: Props) {
  const esEdicion = movimiento !== undefined
  const inicial = movimiento ?? valoresIniciales
  const tipoArranque = inicial?.tipo ?? tipoInicial

  // Bolsillos a los que se puede apartar: los que no se han completado, más los sin fecha (colchón)
  const metasActivas = metas.filter((m) => {
    const plan = calcularPlanMeta(m)
    return !plan.completada || plan.sinFecha
  })

  const [tipo, setTipo] = useState<TipoMovimiento>(tipoArranque)
  const [monto, setMonto] = useState(inicial ? String(inicial.monto) : '') // solo dígitos
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '')
  const [categoria, setCategoria] = useState(inicial?.categoria ?? categorias[tipoArranque][0] ?? 'Otro')
  const [fecha, setFecha] = useState(inicial?.fecha ?? hoyISO())

  // Reparto: null = todavía no lo has tocado, así que usamos el plan guardado de esa fuente
  const [repartoManual, setRepartoManual] = useState<Record<string, string> | null>(null)
  const [recordar, setRecordar] = useState(true)

  const valor = Number(monto)
  const mostrarReparto = !esEdicion && tipo === 'ingreso' && valor > 0 && metasActivas.length > 0

  // ---- Cálculo del reparto ----
  const plantilla = leerPlantilla(categoria)
  const sugerido: Record<string, number> = {}
  for (const meta of metasActivas) {
    sugerido[meta.id] = redondearMil(valor * (plantilla?.[meta.id] ?? 0))
  }

  // Lo que se va a apartar en cada bolsillo, sin pasarse de lo que le falta (salvo los sin fecha)
  const apartar: Record<string, number> = {}
  for (const meta of metasActivas) {
    const pedido = repartoManual ? Number(repartoManual[meta.id] ?? 0) : sugerido[meta.id]
    const plan = calcularPlanMeta(meta)
    apartar[meta.id] = plan.sinFecha ? pedido : Math.min(pedido, plan.faltante)
  }
  const totalApartado = Object.values(apartar).reduce((t, v) => t + v, 0)
  const paraTi = valor - totalApartado
  const seExcede = mostrarReparto && paraTi < 0

  function cambiarApartado(metaId: string, digitos: string) {
    // La primera vez que tocas un valor, copiamos lo sugerido para no perderlo
    const base = repartoManual ?? Object.fromEntries(Object.entries(sugerido).map(([id, v]) => [id, String(v)]))
    setRepartoManual({ ...base, [metaId]: digitos })
  }

  function cambiarTipo(nuevo: TipoMovimiento) {
    setTipo(nuevo)
    setCategoria(categorias[nuevo][0] ?? 'Otro')
  }

  // Si editas un movimiento viejo con una categoría que ya no existe, la mostramos igual
  // para no cambiarla sin querer
  const opcionesCategoria = categorias[tipo].includes(categoria) ? categorias[tipo] : [categoria, ...categorias[tipo]]

  function guardar() {
    if (!valor || seExcede) return

    const datos: Movimiento = {
      id: movimiento?.id ?? generarId(), // al editar conservamos el mismo id
      tipo,
      monto: valor,
      descripcion: descripcion.trim() || categoria,
      categoria,
      fecha,
    }

    const abonos: Abono[] = mostrarReparto
      ? metasActivas.map((m) => ({ metaId: m.id, monto: apartar[m.id] })).filter((a) => a.monto > 0)
      : []

    // Si ajustaste el reparto a mano y quieres recordarlo, lo guardamos como plan de esta fuente
    if (mostrarReparto && repartoManual && recordar) {
      guardarPlantilla(categoria, Object.fromEntries(abonos.map((a) => [a.metaId, a.monto / valor])))
    }

    onGuardar(datos, abonos)
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
          <h2 className="text-lg font-semibold">{esEdicion ? 'Editar movimiento' : 'Nuevo movimiento'}</h2>
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
              value={formatearDigitos(monto)}
              onChange={(e) => setMonto(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-transparent px-2 py-3 text-2xl font-semibold outline-none"
            />
          </div>
        </label>

        {/* Categoría (o fuente) y fecha */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {tipo === 'ingreso' ? '¿De dónde viene?' : 'Categoría'}
            </span>
            <CampoSelect value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {opcionesCategoria.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </CampoSelect>
          </label>
          <label className="block">
            <span className="text-sm text-gray-500 dark:text-gray-400">Fecha</span>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={estiloCampo} />
          </label>
        </div>

        {/* Reparto del ingreso entre bolsillos */}
        {mostrarReparto && (
          <div className="space-y-3 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/60">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                💰 ¿Cuánto apartas para cada bolsillo?
              </p>
              {plantilla && repartoManual && (
                <button
                  type="button"
                  onClick={() => setRepartoManual(null)}
                  className="shrink-0 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                >
                  Usar mi plan ↺
                </button>
              )}
            </div>

            {plantilla && !repartoManual && (
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                ✨ Llené los valores con tu plan para ingresos de <b>{categoria}</b>. Puedes ajustarlos.
              </p>
            )}

            <ul className="space-y-2">
              {metasActivas.map((meta) => {
                const plan = calcularPlanMeta(meta)
                const pedido = repartoManual ? Number(repartoManual[meta.id] ?? 0) : sugerido[meta.id]
                const recortado = !plan.sinFecha && pedido > plan.faltante
                return (
                  <li key={meta.id} className="flex items-center gap-3">
                    <span className="text-xl">{meta.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{meta.nombre}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {plan.sinFecha
                          ? `Tienes ${formatearPesos(meta.ahorrado)}`
                          : `Le faltan ${formatearPesos(plan.faltante)}`}
                        {recortado && ' · se ajustó a lo que falta'}
                      </p>
                    </div>
                    <div className="flex w-32 items-center rounded-lg bg-white px-2 dark:bg-gray-800">
                      <span className="text-sm text-gray-400">$</span>
                      <input
                        inputMode="numeric"
                        placeholder="0"
                        aria-label={`Apartar para ${meta.nombre}`}
                        value={formatearDigitos(repartoManual ? (repartoManual[meta.id] ?? '') : String(sugerido[meta.id] || ''))}
                        onChange={(e) => cambiarApartado(meta.id, e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-transparent px-1 py-2 text-right text-base outline-none"
                      />
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="flex justify-between border-t border-emerald-200 pt-3 text-sm dark:border-emerald-900">
              <span className="text-emerald-800 dark:text-emerald-200">A bolsillos: {formatearPesos(totalApartado)}</span>
              <span className={`font-semibold ${seExcede ? 'text-red-500' : ''}`}>
                Para ti: {formatearPesos(paraTi)}
              </span>
            </div>

            {seExcede && (
              <p className="text-xs text-red-500">Estás apartando más de lo que te entró. Ajusta los valores.</p>
            )}

            {repartoManual && (
              <label className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200">
                <input
                  type="checkbox"
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                  className="h-4 w-4 accent-emerald-600"
                />
                Recordar este reparto para los próximos ingresos de {categoria}
              </label>
            )}
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

        <button
          type="submit"
          disabled={!valor || seExcede}
          className="w-full rounded-xl bg-emerald-600 py-4 font-semibold text-white transition active:scale-95 disabled:opacity-40"
        >
          {esEdicion ? 'Guardar cambios' : 'Guardar'}
        </button>

        {movimiento && onEliminar && (
          <button
            type="button"
            onClick={() => onEliminar(movimiento)}
            className="w-full py-2 text-sm font-medium text-red-500"
          >
            Eliminar movimiento
          </button>
        )}
      </form>
    </div>
  )
}
