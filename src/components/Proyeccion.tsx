import { useState } from 'react'
import type { Finanzas } from '../hooks/useFinanzas'
import type { Previsto } from '../types'
import { sumarMeses } from '../utils/cuotas'
import { formatearPesos, hoyISO } from '../utils/formato'
import { calcularPlanMeta } from '../utils/metas'
import { eventosProyeccion, proyectar } from '../utils/proyeccion'
import GraficoLinea from './GraficoLinea'

const tarjeta = 'rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900'

const fechaCorta = (iso: string) =>
  new Date(iso + 'T00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })

const fechaLarga = (iso: string) =>
  new Date(iso + 'T00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })

const TEXTO_FRECUENCIA = { 'una vez': '', semanal: ' · cada semana', mensual: ' · cada mes' } as const

interface Props {
  finanzas: Finanzas
  onNuevoPrevisto: () => void
  onEditarPrevisto: (previsto: Previsto) => void
}

export default function Proyeccion({ finanzas, onNuevoPrevisto, onEditarPrevisto }: Props) {
  const hoy = hoyISO()
  const [hasta, setHasta] = useState(sumarMeses(hoy, 3))
  const [incluirSemana, setIncluirSemana] = useState(true)

  // Toda tu plata: lo libre + lo que tienes en bolsillos
  const saldoInicial = finanzas.saldo + finanzas.totalAhorrado

  // Tu colchón: la suma de los mínimos de los bolsillos sin fecha
  const colchon = finanzas.metas
    .filter((m) => calcularPlanMeta(m).sinFecha)
    .reduce((t, m) => t + m.montoObjetivo, 0)

  const eventos = eventosProyeccion({
    previstos: finanzas.previstos,
    compromisos: finanzas.compromisos,
    presupuestoSemanal: finanzas.presupuestoSemanal,
    restanteSemana: finanzas.restanteSemana,
    incluirSemana,
    hoy,
    hasta,
  })
  const puntos = proyectar(saldoInicial, eventos, hoy, hasta)
  const saldoPorFecha = new Map(puntos.map((p) => [p.fecha, p.saldo]))

  const final = puntos[puntos.length - 1]?.saldo ?? saldoInicial
  const minimo = puntos.reduce((menor, p) => (p.saldo < menor.saldo ? p : menor), puntos[0] ?? { fecha: hoy, saldo: saldoInicial })

  // En la lista de fechas clave no mostramos el presupuesto de cada semana (sería mucho ruido)
  const fechasClave = eventos.filter((e) => e.clase !== 'semana')

  const PRESETS = [
    { etiqueta: '1 mes', fecha: sumarMeses(hoy, 1) },
    { etiqueta: '2 meses', fecha: sumarMeses(hoy, 2) },
    { etiqueta: '3 meses', fecha: sumarMeses(hoy, 3) },
  ]

  return (
    <div className="space-y-4">
      {/* Hasta cuándo */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.etiqueta}
            onClick={() => setHasta(p.fecha)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              hasta === p.fecha ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 shadow-sm dark:bg-gray-900'
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
        <input
          type="date"
          value={hasta}
          min={hoy}
          onChange={(e) => e.target.value && setHasta(e.target.value)}
          aria-label="Proyectar hasta"
          className="rounded-full bg-white px-3 py-1.5 text-sm shadow-sm outline-none dark:bg-gray-900"
        />
      </div>

      {/* Resultado */}
      <section className={tarjeta}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Hoy tienes</p>
            <p className="mt-1 font-semibold">{formatearPesos(saldoInicial)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">El {fechaLarga(hasta)}</p>
            <p className={`mt-1 text-lg font-bold ${final < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {formatearPesos(final)}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <GraficoLinea puntos={puntos} minimoDeseado={colchon} />
          <div className="mt-1 flex justify-between text-[10px] text-gray-400">
            <span>Hoy</span>
            <span>{fechaCorta(hasta)}</span>
          </div>
        </div>

        <p
          className={`mt-3 rounded-xl p-3 text-xs ${
            minimo.saldo < 0
              ? 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-200'
              : minimo.saldo < colchon
                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200'
                : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
          }`}
        >
          {minimo.saldo < 0
            ? `🚨 Te quedarías sin plata: el ${fechaLarga(minimo.fecha)} llegarías a ${formatearPesos(minimo.saldo)}.`
            : minimo.saldo < colchon
              ? `⚠️ Tu punto más bajo es ${formatearPesos(minimo.saldo)} el ${fechaLarga(minimo.fecha)}, por debajo de tu colchón de ${formatearPesos(colchon)}.`
              : `✅ Tu punto más bajo es ${formatearPesos(minimo.saldo)} el ${fechaLarga(minimo.fecha)}. Nunca bajas de tu colchón.`}
        </p>

        <label className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <input
            type="checkbox"
            checked={incluirSemana}
            onChange={(e) => setIncluirSemana(e.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
          Descontar mi presupuesto semanal ({formatearPesos(finanzas.presupuestoSemanal)})
        </label>
      </section>

      {/* Fechas clave */}
      {fechasClave.length > 0 && (
        <section className={tarjeta}>
          <h2 className="mb-3 font-semibold">Fechas clave</h2>
          <ul className="space-y-3">
            {fechasClave.map((e, i) => (
              <li key={`${e.fecha}-${i}`} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.descripcion}</p>
                  <p className="text-xs text-gray-400">
                    {fechaCorta(e.fecha)} · quedas con {formatearPesos(saldoPorFecha.get(e.fecha) ?? 0)}
                  </p>
                </div>
                <span className={`shrink-0 font-semibold ${e.monto >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {e.monto >= 0 ? '+' : ''}
                  {formatearPesos(e.monto)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tu plan: lo que esperas que entre o salga */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Lo que esperas</h2>
          <button
            onClick={onNuevoPrevisto}
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white transition active:scale-95"
          >
            + Agregar
          </button>
        </div>
        {finanzas.previstos.length === 0 ? (
          <p className={`${tarjeta} text-center text-sm text-gray-500 dark:text-gray-400`}>
            Agrega la plata que sabes que te va a llegar (o que vas a gastar) para ver cómo te va a ir.
          </p>
        ) : (
          <ul className="space-y-2">
            {finanzas.previstos.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => onEditarPrevisto(p)}
                  className={`${tarjeta} flex w-full items-center justify-between gap-3 text-left transition active:scale-[0.98]`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.descripcion}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {p.frecuencia === 'una vez' ? fechaCorta(p.desde) : `Desde ${fechaCorta(p.desde)}`}
                      {p.hasta && ` hasta ${fechaCorta(p.hasta)}`}
                      {TEXTO_FRECUENCIA[p.frecuencia]}
                    </p>
                  </div>
                  <span className={`shrink-0 font-semibold ${p.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {p.tipo === 'ingreso' ? '+' : '-'}
                    {formatearPesos(p.monto)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
