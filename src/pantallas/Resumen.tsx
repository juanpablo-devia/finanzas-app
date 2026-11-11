import { useState } from 'react'
import GraficoBarrasDiarias from '../components/GraficoBarrasDiarias'
import GraficoDona, { type Porcion } from '../components/GraficoDona'
import ItemMovimiento from '../components/ItemMovimiento'
import type { Movimiento } from '../types'
import { formatearPesos, hoyISO, moverMes, nombreMes } from '../utils/formato'

const sumar = (lista: Movimiento[]) => lista.reduce((total, m) => total + m.monto, 0)
const diaDe = (fecha: string) => Number(fecha.slice(8)) // '2026-11-09' → 9

const tarjeta = 'rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900'

interface Props {
  movimientos: Movimiento[]
  onTocarMovimiento: (movimiento: Movimiento) => void
}

export default function Resumen({ movimientos, onTocarMovimiento }: Props) {
  const mesActual = hoyISO().slice(0, 7)
  const [mes, setMes] = useState(mesActual)
  const esMesActual = mes === mesActual
  const diaHoy = new Date().getDate()

  // ---- Totales del mes ----
  const delMes = movimientos.filter((m) => m.fecha.startsWith(mes))
  const listaGastos = delMes.filter((m) => m.tipo === 'gasto')
  const ingresos = sumar(delMes.filter((m) => m.tipo === 'ingreso'))
  const gastos = sumar(listaGastos)
  const balance = ingresos - gastos
  const tasaAhorro = ingresos > 0 ? Math.round((balance / ingresos) * 100) : null

  // ---- Comparación justa con el mes anterior: hasta el mismo día del mes ----
  const mesAnterior = moverMes(mes, -1)
  const nombreMesAnterior = nombreMes(mesAnterior).split(' ')[0].toLowerCase()
  const limiteDia = esMesActual ? diaHoy : 31
  const gastosAnterior = sumar(
    movimientos.filter((m) => m.tipo === 'gasto' && m.fecha.startsWith(mesAnterior) && diaDe(m.fecha) <= limiteDia),
  )
  const cambio = gastosAnterior > 0 ? Math.round(((gastos - gastosAnterior) / gastosAnterior) * 100) : null

  // ---- Gastos por categoría (para la dona) ----
  const porCategoria = new Map<string, number>()
  for (const g of listaGastos) {
    porCategoria.set(g.categoria, (porCategoria.get(g.categoria) ?? 0) + g.monto)
  }
  const porciones: Porcion[] = [...porCategoria.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total)

  // ---- Gastos por día (para las barras) ----
  const [anio, numeroMes] = mes.split('-').map(Number)
  const diasDelMes = new Date(anio, numeroMes, 0).getDate() // día 0 del mes siguiente = último día de este
  const porDia = Array.from({ length: diasDelMes }, () => 0)
  for (const g of listaGastos) porDia[diaDe(g.fecha) - 1] += g.monto

  // ---- Top 3 gastos ----
  const masGrandes = [...listaGastos].sort((a, b) => b.monto - a.monto).slice(0, 3)

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Resumen</h1>

      {/* Selector de mes */}
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-white p-2 shadow-sm dark:bg-gray-900">
        <button
          onClick={() => setMes(moverMes(mes, -1))}
          aria-label="Mes anterior"
          className="h-10 w-10 rounded-xl text-xl transition active:scale-90"
        >
          ‹
        </button>
        <span className="font-semibold">{nombreMes(mes)}</span>
        <button
          onClick={() => setMes(moverMes(mes, 1))}
          disabled={esMesActual}
          aria-label="Mes siguiente"
          className="h-10 w-10 rounded-xl text-xl transition active:scale-90 disabled:opacity-20"
        >
          ›
        </button>
      </div>

      {delMes.length === 0 ? (
        <div className={`${tarjeta} p-8 text-center`}>
          <p className="text-4xl">📭</p>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            No hay movimientos en {nombreMes(mes).toLowerCase()}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Totales */}
          <section className={tarjeta}>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ingresos</p>
                <p className="mt-1 text-sm font-semibold text-emerald-600">{formatearPesos(ingresos)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Gastos</p>
                <p className="mt-1 text-sm font-semibold text-red-500">{formatearPesos(gastos)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Balance</p>
                <p className={`mt-1 text-sm font-semibold ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formatearPesos(balance)}
                </p>
              </div>
            </div>
            {tasaAhorro !== null && (
              <p className="mt-4 border-t border-gray-100 pt-3 text-center text-sm dark:border-gray-800">
                {tasaAhorro >= 0 ? (
                  <>
                    💪 Te sobró el <b className="text-emerald-600">{tasaAhorro}%</b> de lo que ganaste
                  </>
                ) : (
                  <>😬 Gastaste más de lo que ganaste este mes</>
                )}
              </p>
            )}
          </section>

          {/* Comparación con el mes anterior */}
          {cambio !== null && (
            <section className={`${tarjeta} flex items-center gap-3`}>
              <span className="text-3xl">{cambio <= 0 ? '📉' : '📈'}</span>
              <p className="text-sm">
                {cambio === 0 ? (
                  <>Llevas lo mismo en gastos que en {nombreMesAnterior}</>
                ) : (
                  <>
                    Llevas{' '}
                    <b className={cambio < 0 ? 'text-emerald-600' : 'text-red-500'}>
                      {Math.abs(cambio)}% {cambio < 0 ? 'menos' : 'más'}
                    </b>{' '}
                    en gastos que en {nombreMesAnterior}
                  </>
                )}
                {esMesActual && ' a esta altura del mes'}.
              </p>
            </section>
          )}

          {/* Dona por categoría */}
          {gastos > 0 && (
            <section className={tarjeta}>
              <h2 className="mb-4 font-semibold">¿En qué se te va la plata?</h2>
              <GraficoDona porciones={porciones} total={gastos} />
            </section>
          )}

          {/* Barras por día */}
          <section className={tarjeta}>
            <h2 className="mb-4 font-semibold">Gasto por día</h2>
            <GraficoBarrasDiarias valores={porDia} diaActual={esMesActual ? diaHoy : null} />
          </section>

          {/* Top 3 */}
          {masGrandes.length > 0 && (
            <section>
              <h2 className="mb-3 px-1 font-semibold">Tus gastos más grandes</h2>
              <ul className="space-y-2">
                {masGrandes.map((m) => (
                  <ItemMovimiento key={m.id} movimiento={m} onTocar={onTocarMovimiento} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  )
}
