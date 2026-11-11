import { useState } from 'react'
import type { Meta } from '../types'
import { formatearPesos } from '../utils/formato'
import { calcularPlanMeta } from '../utils/metas'

type Modo = 'abonar' | 'retirar'

interface Props {
  meta: Meta
  saldo: number
  // valor positivo = abonar, negativo = retirar
  onConfirmar: (valor: number) => void
  onCerrar: () => void
}

export default function HojaAbono({ meta, saldo, onConfirmar, onCerrar }: Props) {
  const plan = calcularPlanMeta(meta)
  const [modo, setModo] = useState<Modo>(plan.completada ? 'retirar' : 'abonar')
  const [monto, setMonto] = useState('') // solo dígitos

  // Lo máximo que tiene sentido mover
  const maximo = modo === 'abonar' ? plan.faltante : meta.ahorrado
  const valor = Math.min(Number(monto), maximo)

  const atajos =
    modo === 'abonar'
      ? [
          { etiqueta: 'Lo de hoy', valor: plan.porDia },
          { etiqueta: 'Lo de la semana', valor: plan.porSemana },
          { etiqueta: 'Lo que falta', valor: plan.faltante },
        ]
      : [
          { etiqueta: 'La mitad', valor: Math.round(meta.ahorrado / 2) },
          { etiqueta: 'Todo', valor: meta.ahorrado },
        ]

  // Vista previa de cómo quedaría todo
  const nuevoAhorrado = meta.ahorrado + (modo === 'abonar' ? valor : -valor)
  const nuevoPorcentaje = Math.min(100, Math.round((nuevoAhorrado / meta.montoObjetivo) * 100))
  const nuevoSaldo = saldo + (modo === 'abonar' ? -valor : valor)

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo)
    setMonto('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onCerrar}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          if (valor > 0) onConfirmar(modo === 'abonar' ? valor : -valor)
        }}
        className="w-full max-w-md animate-aparecer space-y-4 rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] dark:bg-gray-900"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{meta.emoji}</span>
            <div>
              <h2 className="text-lg font-semibold">{meta.nombre}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatearPesos(meta.ahorrado)} de {formatearPesos(meta.montoObjetivo)}
              </p>
            </div>
          </div>
          <button type="button" onClick={onCerrar} className="text-gray-500">
            Cancelar
          </button>
        </div>

        {/* Abonar / Retirar (retirar solo si hay algo ahorrado) */}
        {meta.ahorrado > 0 && (
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            {(['abonar', 'retirar'] as const).map((m) => (
              <button
                key={m}
                type="button"
                disabled={m === 'abonar' && plan.completada}
                onClick={() => cambiarModo(m)}
                className={`rounded-lg py-2 text-sm font-medium capitalize transition disabled:opacity-30 ${
                  modo === m ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {/* Monto */}
        <div className="flex items-center rounded-xl bg-gray-100 px-4 dark:bg-gray-800">
          <span className="text-2xl font-semibold text-gray-400">$</span>
          <input
            inputMode="numeric"
            placeholder="0"
            value={monto ? Number(monto).toLocaleString('es-CO') : ''}
            onChange={(e) => setMonto(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-transparent px-2 py-3 text-2xl font-semibold outline-none"
          />
        </div>

        {/* Atajos */}
        <div className="flex flex-wrap gap-2">
          {atajos
            .filter((a) => a.valor > 0)
            .map((a) => (
              <button
                key={a.etiqueta}
                type="button"
                onClick={() => setMonto(String(a.valor))}
                className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition active:scale-95 dark:bg-emerald-950 dark:text-emerald-300"
              >
                {a.etiqueta} · {formatearPesos(a.valor)}
              </button>
            ))}
        </div>

        {/* Vista previa */}
        {valor > 0 && (
          <div className="space-y-2 rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-800/60">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">La meta quedaría en</span>
              <span className="font-semibold text-emerald-600">{nuevoPorcentaje}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Tu saldo quedaría en</span>
              <span className={`font-semibold ${nuevoSaldo < 0 ? 'text-red-500' : ''}`}>
                {formatearPesos(nuevoSaldo)}
              </span>
            </div>
            {nuevoSaldo < 0 && (
              <p className="text-xs text-red-500">Ojo: estás apartando más plata de la que tienes disponible.</p>
            )}
            {Number(monto) > maximo && (
              <p className="text-xs text-gray-500">Se ajustó al máximo posible: {formatearPesos(maximo)}.</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={valor <= 0}
          className="w-full rounded-xl bg-emerald-600 py-4 font-semibold text-white transition active:scale-95 disabled:opacity-40"
        >
          {modo === 'abonar' ? 'Abonar' : 'Retirar'} {valor > 0 && formatearPesos(valor)}
        </button>
      </form>
    </div>
  )
}
