import ItemMovimiento from '../components/ItemMovimiento'
import TarjetaPresupuesto from '../components/TarjetaPresupuesto'
import type { Pantalla } from '../components/BarraNavegacion'
import type { Finanzas } from '../hooks/useFinanzas'
import type { Movimiento } from '../types'
import { formatearPesos } from '../utils/formato'
import { calcularPlanMeta } from '../utils/metas'
import { obtenerIniciales, saludoSegunHora } from '../utils/saludo'

interface Props {
  finanzas: Finanzas
  nombre: string
  onCambiarNombre: () => void
  onEditarPresupuesto: () => void
  onNavegar: (pantalla: Pantalla) => void
  onTocarMovimiento: (movimiento: Movimiento) => void
}

function TituloSeccion({ titulo, onVerTodo }: { titulo: string; onVerTodo: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <button onClick={onVerTodo} className="text-sm font-medium text-emerald-600">
        Ver todo →
      </button>
    </div>
  )
}

export default function Inicio({
  finanzas,
  nombre,
  onCambiarNombre,
  onEditarPresupuesto,
  onNavegar,
  onTocarMovimiento,
}: Props) {
  const { saldo, puedoGastarHoy, totalAhorrado, ingresosMes, gastosMes, metas, movimientos } = finanzas
  const ultimos = movimientos.slice(0, 5)

  return (
    <>
      {/* Encabezado */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{saludoSegunHora()} 👋</p>
          <h1 className="text-2xl font-bold">{nombre}</h1>
        </div>
        <button
          onClick={onCambiarNombre}
          aria-label="Cambiar nombre"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 font-semibold text-white transition active:scale-90"
        >
          {obtenerIniciales(nombre)}
        </button>
      </header>

      {/* Tarjeta de saldo */}
      <section className="rounded-3xl bg-emerald-600 p-6 text-white shadow-lg">
        <p className="text-sm opacity-80">Saldo disponible</p>
        <p className="mt-1 text-4xl font-bold">{formatearPesos(saldo)}</p>
        <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm opacity-90">
          <p>
            Hoy puedes gastar <span className="font-semibold">{formatearPesos(puedoGastarHoy)}</span>
          </p>
          {totalAhorrado > 0 && <p>En metas: {formatearPesos(totalAhorrado)}</p>}
        </div>
      </section>

      {/* Presupuesto de la semana */}
      <div className="mt-4">
        <TarjetaPresupuesto
          presupuesto={finanzas.presupuestoSemanal}
          gastado={finanzas.gastadoSemana}
          diasTranscurridos={finanzas.diasTranscurridosSemana}
          diasQuedan={finanzas.diasQuedanSemana}
          onEditar={onEditarPresupuesto}
        />
      </div>

      {/* Ingresos y gastos del mes */}
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

      {/* Metas (versión resumida) */}
      <section className="mt-6">
        <TituloSeccion titulo="Mis metas" onVerTodo={() => onNavegar('metas')} />

        {metas.length === 0 ? (
          <button
            onClick={() => onNavegar('metas')}
            className="w-full rounded-2xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:bg-gray-900"
          >
            Crea tu primera meta y te digo cuánto guardar cada día 🎯
          </button>
        ) : (
          <div className="space-y-2">
            {metas.slice(0, 3).map((meta) => {
              const porcentaje = Math.round(calcularPlanMeta(meta).progreso * 100)
              return (
                <button
                  key={meta.id}
                  onClick={() => onNavegar('metas')}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm transition active:scale-[0.98] dark:bg-gray-900"
                >
                  <span className="text-2xl">{meta.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{meta.nombre}</span>
                      <span className="font-semibold text-emerald-600">{porcentaje}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Últimos movimientos */}
      <section className="mt-6">
        <TituloSeccion titulo="Últimos movimientos" onVerTodo={() => onNavegar('movimientos')} />

        {ultimos.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:bg-gray-900">
            Aún no tienes movimientos. Toca <b>+</b> para agregar el primero.
          </p>
        ) : (
          <ul className="space-y-2">
            {ultimos.map((m) => (
              <ItemMovimiento key={m.id} movimiento={m} onTocar={onTocarMovimiento} />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
