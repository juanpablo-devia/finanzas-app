import { formatearPesos } from './utils/formato'

// Datos de prueba (en el próximo paso los volvemos reales)
const resumen = {
  saldo: 850000,
  ingresosMes: 1200000,
  gastosMes: 350000,
  puedoGastarHoy: 28000,
}

const movimientos = [
  { id: '1', tipo: 'ingreso', descripcion: 'Pago semana', categoria: 'Trabajo', monto: 300000, fecha: 'Hoy' },
  { id: '2', tipo: 'gasto', descripcion: 'Almuerzo', categoria: 'Comida', monto: 15000, fecha: 'Hoy' },
  { id: '3', tipo: 'gasto', descripcion: 'Gasolina', categoria: 'Transporte', monto: 60000, fecha: 'Ayer' },
]

function App() {
  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pt-6 pb-32">
      <header className="mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">Hola 👋</p>
        <h1 className="text-2xl font-bold">Mis Finanzas</h1>
      </header>

      {/* Tarjeta de saldo */}
      <section className="rounded-3xl bg-emerald-600 p-6 text-white shadow-lg">
        <p className="text-sm opacity-80">Saldo disponible</p>
        <p className="mt-1 text-4xl font-bold">{formatearPesos(resumen.saldo)}</p>
        <p className="mt-4 text-sm opacity-90">
          Hoy puedes gastar{' '}
          <span className="font-semibold">{formatearPesos(resumen.puedoGastarHoy)}</span>
        </p>
      </section>

      {/* Ingresos y gastos del mes */}
      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Ingresos del mes</p>
          <p className="mt-1 text-lg font-semibold text-emerald-600">
            {formatearPesos(resumen.ingresosMes)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Gastos del mes</p>
          <p className="mt-1 text-lg font-semibold text-red-500">
            {formatearPesos(resumen.gastosMes)}
          </p>
        </div>
      </section>

      {/* Últimos movimientos */}
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Últimos movimientos</h2>
        <ul className="space-y-2">
          {movimientos.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900"
            >
              <div>
                <p className="font-medium">{m.descripcion}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {m.categoria} · {m.fecha}
                </p>
              </div>
              <p className={`font-semibold ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-500'}`}>
                {m.tipo === 'ingreso' ? '+' : '-'}
                {formatearPesos(m.monto)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Botón flotante para agregar */}
      <button
        aria-label="Agregar movimiento"
        className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 h-16 w-16 -translate-x-1/2 rounded-full bg-emerald-600 text-3xl text-white shadow-xl transition active:scale-90"
      >
        +
      </button>
    </main>
  )
}

export default App