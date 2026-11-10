import { useState } from 'react'
import FormularioMovimiento from './components/FormularioMovimiento'
import type { Movimiento } from './types'
import { formatearFecha, formatearPesos, hoyISO } from './utils/formato'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'

const sumar = (lista: Movimiento[]) => lista.reduce((total, m) => total + m.monto, 0)

function App() {
  const movimientos = useLiveQuery(() => db.movimientos.toArray(), []) ?? []
  const [formularioAbierto, setFormularioAbierto] = useState(false)

  // ---- Valores derivados: se calculan en cada render, no se guardan ----
  const ingresos = movimientos.filter((m) => m.tipo === 'ingreso')
  const gastos = movimientos.filter((m) => m.tipo === 'gasto')
  const saldo = sumar(ingresos) - sumar(gastos)

  const mesActual = hoyISO().slice(0, 7) // 'YYYY-MM'
  const ingresosMes = sumar(ingresos.filter((m) => m.fecha.startsWith(mesActual)))
  const gastosMes = sumar(gastos.filter((m) => m.fecha.startsWith(mesActual)))

  const hoy = new Date()
  const diasDelMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
  const diasRestantes = diasDelMes - hoy.getDate() + 1
  const puedoGastarHoy = Math.max(0, Math.floor((ingresosMes - gastosMes) / diasRestantes))

  const ordenados = [...movimientos].sort((a, b) => b.fecha.localeCompare(a.fecha))

  async function agregarMovimiento(nuevo: Movimiento) {
  await db.movimientos.add(nuevo)
  setFormularioAbierto(false)
}

async function eliminarMovimiento(m: Movimiento) {
  const ok = window.confirm(`¿Eliminar "${m.descripcion}" por ${formatearPesos(m.monto)}?`)
  if (ok) await db.movimientos.delete(m.id)
}
  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pt-6 pb-32">
      <header className="mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">Hola 👋</p>
        <h1 className="text-2xl font-bold">Mis Finanzas</h1>
      </header>

      <section className="rounded-3xl bg-emerald-600 p-6 text-white shadow-lg">
        <p className="text-sm opacity-80">Saldo disponible</p>
        <p className="mt-1 text-4xl font-bold">{formatearPesos(saldo)}</p>
        <p className="mt-4 text-sm opacity-90">
          Hoy puedes gastar <span className="font-semibold">{formatearPesos(puedoGastarHoy)}</span>
        </p>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Ingresos del mes</p>
          <p className="mt-1 text-lg font-semibold text-emerald-600">{formatearPesos(ingresosMes)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Gastos del mes</p>
          <p className="mt-1 text-lg font-semibold text-red-500">{formatearPesos(gastosMes)}</p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Últimos movimientos</h2>

        {ordenados.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500 dark:bg-gray-900">
            Aún no tienes movimientos. Toca <b>+</b> para agregar el primero.
          </p>
        ) : (
          <ul className="space-y-2">
            {ordenados.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900"
              >
                <div>
                  <p className="font-medium">{m.descripcion}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {m.categoria} · {formatearFecha(m.fecha)}
                  </p>
                </div>
                <p className={`font-semibold ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {m.tipo === 'ingreso' ? '+' : '-'}
                  {formatearPesos(m.monto)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        aria-label="Agregar movimiento"
        onClick={() => setFormularioAbierto(true)}
        className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 h-16 w-16 -translate-x-1/2 rounded-full bg-emerald-600 text-3xl text-white shadow-xl transition active:scale-90"
      >
        +
      </button>

      {formularioAbierto && (
        <FormularioMovimiento onGuardar={agregarMovimiento} onCerrar={() => setFormularioAbierto(false)} />
      )}
    </main>
  )
}

export default App