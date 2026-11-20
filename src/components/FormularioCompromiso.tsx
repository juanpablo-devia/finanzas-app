import { useState } from 'react'
import { EMOJIS_META, type Compromiso, type Cuota, type Meta } from '../types'
import { cambiarMontoCuota, cambiarTotal, generarCuotas, sumarMeses } from '../utils/cuotas'
import { formatearPesos, hoyISO } from '../utils/formato'
import { generarId } from '../utils/id'
import CampoSelect from './CampoSelect'

interface Props {
  compromiso?: Compromiso // si viene, el formulario está en modo EDICIÓN
  metas: Meta[]
  onGuardar: (compromiso: Compromiso) => void
  onEliminar?: (compromiso: Compromiso) => void
  onCerrar: () => void
}

const estiloCampo =
  'mt-1 w-full rounded-xl bg-gray-100 px-4 py-3 text-base outline-none dark:bg-gray-800'

const formatearDigitos = (digitos: string) => (digitos ? Number(digitos).toLocaleString('es-CO') : '')
const sumar = (cuotas: Cuota[]) => cuotas.reduce((t, c) => t + c.monto, 0)

export default function FormularioCompromiso({ compromiso, metas, onGuardar, onEliminar, onCerrar }: Props) {
  const esEdicion = compromiso !== undefined

  const [nombre, setNombre] = useState(compromiso?.nombre ?? '')
  const [emoji, setEmoji] = useState(compromiso?.emoji ?? '🎁')
  const [acreedor, setAcreedor] = useState(compromiso?.acreedor ?? '')
  const [metaId, setMetaId] = useState(compromiso?.metaId ?? '')
  const [total, setTotal] = useState(compromiso ? String(sumar(compromiso.cuotas)) : '') // solo dígitos
  const [cantidad, setCantidad] = useState(compromiso ? String(compromiso.cuotas.length) : '3')
  const [primeraFecha, setPrimeraFecha] = useState(compromiso?.cuotas[0]?.fecha ?? sumarMeses(hoyISO(), 1))

  // null = cuotas calculadas automáticamente; si editas una cuota, pasan a ser "manuales"
  const [cuotasManual, setCuotasManual] = useState<Cuota[] | null>(null)

  const valorTotal = Number(total)
  const numCuotas = Math.min(60, Math.max(1, Number(cantidad) || 1))

  // Cuotas automáticas: al crear, se generan; al editar, se ajustan al nuevo total
  const cuotasAuto: Cuota[] = compromiso
    ? cambiarTotal(compromiso.cuotas, valorTotal)
    : valorTotal > 0 && primeraFecha
      ? generarCuotas(valorTotal, numCuotas, primeraFecha)
      : []
  const cuotas = cuotasManual ?? cuotasAuto

  const valido =
    nombre.trim() !== '' && cuotas.length > 0 && cuotas.every((c) => c.monto > 0 && c.fecha !== '')

  // Cambiar el total, la cantidad o la fecha recalcula todo desde cero
  function cambiarBase(accion: () => void) {
    accion()
    setCuotasManual(null)
  }

  function editarMonto(numero: number, digitos: string) {
    const nuevas = cambiarMontoCuota(cuotas, numero, Number(digitos))
    setCuotasManual(nuevas)
    setTotal(String(sumar(nuevas))) // si cambiaste la última cuota, el total cambia
  }

  function editarFecha(numero: number, fecha: string) {
    setCuotasManual(cuotas.map((c) => (c.numero === numero ? { ...c, fecha } : c)))
  }

  function guardar() {
    if (!valido) return
    onGuardar({
      id: compromiso?.id ?? generarId(),
      nombre: nombre.trim(),
      emoji,
      acreedor: acreedor.trim(),
      metaId,
      cuotas,
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
          <h2 className="text-lg font-semibold">{esEdicion ? 'Editar compra a cuotas' : 'Nueva compra a cuotas'}</h2>
          <button type="button" onClick={onCerrar} className="text-gray-500">
            Cancelar
          </button>
        </div>

        {/* Emoji */}
        <div className="grid grid-cols-8 gap-1">
          {EMOJIS_META.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`rounded-xl py-2 text-2xl transition ${
                emoji === e ? 'bg-emerald-100 ring-2 ring-emerald-500 dark:bg-emerald-950' : ''
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-gray-500 dark:text-gray-400">¿Qué compraste?</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: PS5"
              className={estiloCampo}
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-500 dark:text-gray-400">¿A quién le pagas?</span>
            <input
              value={acreedor}
              onChange={(e) => setAcreedor(e.target.value)}
              placeholder="Ej: Mi primo"
              className={estiloCampo}
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <label className="col-span-2 block">
            <span className="text-sm text-gray-500 dark:text-gray-400">Valor total</span>
            <input
              inputMode="numeric"
              placeholder="$ 0"
              value={total ? '$ ' + formatearDigitos(total) : ''}
              onChange={(e) => cambiarBase(() => setTotal(e.target.value.replace(/\D/g, '')))}
              className={estiloCampo}
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-500 dark:text-gray-400">Cuotas</span>
            <input
              inputMode="numeric"
              value={cantidad}
              disabled={esEdicion}
              onChange={(e) => cambiarBase(() => setCantidad(e.target.value.replace(/\D/g, '')))}
              className={`${estiloCampo} disabled:opacity-40`}
            />
          </label>
        </div>

        {!esEdicion && (
          <label className="block">
            <span className="text-sm text-gray-500 dark:text-gray-400">Fecha de la primera cuota</span>
            <input
              type="date"
              value={primeraFecha}
              onChange={(e) => cambiarBase(() => setPrimeraFecha(e.target.value))}
              className={estiloCampo}
            />
          </label>
        )}

        <label className="block">
          <span className="text-sm text-gray-500 dark:text-gray-400">¿De qué bolsillo salen las cuotas?</span>
          <CampoSelect value={metaId} onChange={(e) => setMetaId(e.target.value)}>
            <option value="">De mi saldo disponible</option>
            {metas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.nombre}
              </option>
            ))}
          </CampoSelect>
        </label>

        {/* Lista de cuotas editable */}
        {cuotas.length > 0 && (
          <div className="space-y-2 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60">
            <p className="text-sm font-semibold">Cuotas</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Si cambias el valor de una cuota, las siguientes se reajustan para mantener el total.
            </p>
            <ul className="space-y-2">
              {cuotas.map((c) => (
                <li key={c.numero} className={`flex items-center gap-2 ${c.pagada ? 'opacity-50' : ''}`}>
                  <span className="w-6 text-sm font-medium text-gray-500">{c.numero}</span>
                  <input
                    type="date"
                    value={c.fecha}
                    disabled={c.pagada}
                    onChange={(e) => editarFecha(c.numero, e.target.value)}
                    aria-label={`Fecha de la cuota ${c.numero}`}
                    className="min-w-0 flex-1 rounded-lg bg-white px-2 py-2 text-sm outline-none dark:bg-gray-900"
                  />
                  <div className="flex w-32 items-center rounded-lg bg-white px-2 dark:bg-gray-900">
                    <span className="text-sm text-gray-400">$</span>
                    <input
                      inputMode="numeric"
                      value={formatearDigitos(String(c.monto))}
                      disabled={c.pagada}
                      onChange={(e) => editarMonto(c.numero, e.target.value.replace(/\D/g, ''))}
                      aria-label={`Valor de la cuota ${c.numero}`}
                      className="w-full bg-transparent px-1 py-2 text-right text-base outline-none"
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="pt-1 text-right text-sm">
              Total: <b>{formatearPesos(sumar(cuotas))}</b>
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!valido}
          className="w-full rounded-xl bg-emerald-600 py-4 font-semibold text-white transition active:scale-95 disabled:opacity-40"
        >
          {esEdicion ? 'Guardar cambios' : 'Crear'}
        </button>

        {compromiso && onEliminar && (
          <button
            type="button"
            onClick={() => onEliminar(compromiso)}
            className="w-full py-2 text-sm font-medium text-red-500"
          >
            Eliminar compra a cuotas
          </button>
        )}
      </form>
    </div>
  )
}
