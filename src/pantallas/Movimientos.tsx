import { useState } from 'react'
import ItemMovimiento from '../components/ItemMovimiento'
import type { Movimiento, TipoMovimiento } from '../types'
import { formatearFechaLarga, formatearPesos, hoyISO, inicioSemanaISO } from '../utils/formato'

type Periodo = 'hoy' | 'semana' | 'mes' | 'todo'
type FiltroTipo = 'todos' | TipoMovimiento

const PERIODOS: { id: Periodo; etiqueta: string }[] = [
  { id: 'hoy', etiqueta: 'Hoy' },
  { id: 'semana', etiqueta: 'Semana' },
  { id: 'mes', etiqueta: 'Mes' },
  { id: 'todo', etiqueta: 'Todo' },
]

const TIPOS: { id: FiltroTipo; etiqueta: string }[] = [
  { id: 'todos', etiqueta: 'Todos' },
  { id: 'gasto', etiqueta: 'Gastos' },
  { id: 'ingreso', etiqueta: 'Ingresos' },
]

// Fecha desde la cual se muestran movimientos. '' = sin límite (todo string es >= '')
function fechaDesde(periodo: Periodo): string {
  const hoy = hoyISO()
  if (periodo === 'hoy') return hoy
  if (periodo === 'semana') return inicioSemanaISO()
  if (periodo === 'mes') return hoy.slice(0, 7) + '-01'
  return ''
}

const sumar = (lista: Movimiento[]) => lista.reduce((total, m) => total + m.monto, 0)

interface Props {
  movimientos: Movimiento[]
  onTocarMovimiento: (movimiento: Movimiento) => void
}

export default function Movimientos({ movimientos, onTocarMovimiento }: Props) {
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')

  // 1. Filtrar por periodo (las fechas 'YYYY-MM-DD' se pueden comparar como texto)
  const desde = fechaDesde(periodo)
  const delPeriodo = movimientos.filter((m) => m.fecha >= desde)

  // 2. Resumen del periodo
  const entro = sumar(delPeriodo.filter((m) => m.tipo === 'ingreso'))
  const salio = sumar(delPeriodo.filter((m) => m.tipo === 'gasto'))
  const balance = entro - salio

  // 3. Filtrar por tipo
  const filtrados = delPeriodo.filter((m) => filtroTipo === 'todos' || m.tipo === filtroTipo)

  // 4. Agrupar por fecha. Un Map conserva el orden en que se insertan las llaves,
  //    y como los movimientos ya vienen del más reciente al más antiguo, los grupos también.
  const grupos = new Map<string, Movimiento[]>()
  for (const m of filtrados) {
    const lista = grupos.get(m.fecha) ?? []
    lista.push(m)
    grupos.set(m.fecha, lista)
  }

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Movimientos</h1>

      {/* Filtro de periodo */}
      <div className="mb-3 grid grid-cols-4 gap-1 rounded-xl bg-gray-200/60 p-1 dark:bg-gray-800">
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriodo(p.id)}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              periodo === p.id ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500'
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      {/* Resumen del periodo */}
      <section className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-white p-4 text-center shadow-sm dark:bg-gray-900">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Entró</p>
          <p className="mt-1 text-sm font-semibold text-emerald-600">{formatearPesos(entro)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Salió</p>
          <p className="mt-1 text-sm font-semibold text-red-500">{formatearPesos(salio)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Balance</p>
          <p className={`mt-1 text-sm font-semibold ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatearPesos(balance)}
          </p>
        </div>
      </section>

      {/* Filtro de tipo */}
      <div className="mb-4 flex gap-2">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            onClick={() => setFiltroTipo(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filtroTipo === t.id
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-500 shadow-sm dark:bg-gray-900 dark:text-gray-400'
            }`}
          >
            {t.etiqueta}
          </button>
        ))}
      </div>

      {/* Lista agrupada por día */}
      {filtrados.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:bg-gray-900">
          No hay movimientos en este periodo.
        </p>
      ) : (
        <div className="space-y-5">
          {[...grupos.entries()].map(([fecha, lista]) => {
            const gastoDelDia = sumar(lista.filter((m) => m.tipo === 'gasto'))
            return (
              <section key={fecha}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {formatearFechaLarga(fecha)}
                  </h2>
                  {gastoDelDia > 0 && (
                    <span className="text-xs text-gray-400">Gastaste {formatearPesos(gastoDelDia)}</span>
                  )}
                </div>
                <ul className="space-y-2">
                  {lista.map((m) => (
                    <ItemMovimiento key={m.id} movimiento={m} onTocar={onTocarMovimiento} />
                  ))}
                </ul>
              </section>
            )
          })}
          <p className="text-center text-xs text-gray-400">Toca un movimiento para editarlo</p>
        </div>
      )}
    </>
  )
}
