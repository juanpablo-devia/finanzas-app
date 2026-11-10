import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import Bienvenida from './components/Bienvenida'
import FormularioMeta from './components/FormularioMeta'
import FormularioMovimiento from './components/FormularioMovimiento'
import TarjetaMeta from './components/TarjetaMeta'
import { db } from './db'
import type { Abono, Meta, Movimiento } from './types'
import { formatearFecha, formatearPesos, hoyISO } from './utils/formato'
import { obtenerIniciales, saludoSegunHora } from './utils/saludo'

const sumar = (lista: Movimiento[]) => lista.reduce((total, m) => total + m.monto, 0)

function App() {
  // ---- Hooks: siempre arriba, antes de cualquier return ----
  const movimientos = useLiveQuery(() => db.movimientos.toArray(), []) ?? []
  const metas = useLiveQuery(() => db.metas.orderBy('fechaLimite').toArray(), []) ?? []
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [formularioMetaAbierto, setFormularioMetaAbierto] = useState(false)
  const [nombre, setNombre] = useState(() => localStorage.getItem('nombre') ?? '')

  // ---- Valores derivados ----
  const ingresos = movimientos.filter((m) => m.tipo === 'ingreso')
  const gastos = movimientos.filter((m) => m.tipo === 'gasto')
  const totalAhorrado = metas.reduce((total, meta) => total + meta.ahorrado, 0)

  // Plata libre = lo que entró - lo gastado - lo apartado en metas
  const saldo = sumar(ingresos) - sumar(gastos) - totalAhorrado

  const mesActual = hoyISO().slice(0, 7) // 'YYYY-MM'
  const ingresosMes = sumar(ingresos.filter((m) => m.fecha.startsWith(mesActual)))
  const gastosMes = sumar(gastos.filter((m) => m.fecha.startsWith(mesActual)))

  const hoy = new Date()
  const diasDelMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
  const diasRestantes = diasDelMes - hoy.getDate() + 1

  // Lo de las metas ya está apartado, así que solo repartimos lo que es tuyo
  const puedoGastarHoy = Math.max(0, Math.floor(saldo / diasRestantes))

  const ordenados = [...movimientos].sort((a, b) => b.fecha.localeCompare(a.fecha))

  // ---- Acciones ----
  function guardarNombre(nuevo: string) {
    localStorage.setItem('nombre', nuevo)
    setNombre(nuevo)
  }

  function cambiarNombre() {
    const nuevo = window.prompt('¿Cómo quieres que te llame?', nombre)
    if (nuevo?.trim()) guardarNombre(nuevo.trim())
  }

  async function agregarMovimiento(nuevo: Movimiento, abono: Abono | null) {
    // Transacción: o se guardan las dos cosas, o ninguna
    await db.transaction('rw', db.movimientos, db.metas, async () => {
      await db.movimientos.add(nuevo)
      if (abono) {
        const meta = await db.metas.get(abono.metaId)
        if (meta) await db.metas.update(meta.id, { ahorrado: meta.ahorrado + abono.monto })
      }
    })
    setFormularioAbierto(false)
  }

  async function eliminarMovimiento(m: Movimiento) {
    const ok = window.confirm(`¿Eliminar "${m.descripcion}" por ${formatearPesos(m.monto)}?`)
    if (ok) await db.movimientos.delete(m.id)
  }

  async function agregarMeta(meta: Meta) {
    await db.metas.add(meta)
    setFormularioMetaAbierto(false)
  }

  async function abonarMeta(meta: Meta) {
    const texto = window.prompt(`¿Cuánto vas a abonar a "${meta.nombre}"?`)
    const valor = Number(texto?.replace(/\D/g, '') ?? 0)
    if (!valor) return

    if (valor > saldo && !window.confirm('Ese abono es mayor que tu saldo disponible. ¿Abonar de todas formas?')) {
      return
    }
    await db.metas.update(meta.id, { ahorrado: meta.ahorrado + valor })
  }

  async function eliminarMeta(meta: Meta) {
    const ok = window.confirm(
      `¿Eliminar la meta "${meta.nombre}"? Lo ahorrado (${formatearPesos(meta.ahorrado)}) vuelve a tu saldo.`,
    )
    if (ok) await db.metas.delete(meta.id)
  }

  // ---- Pantalla de bienvenida si no hay nombre ----
  if (!nombre) {
    return <Bienvenida onListo={guardarNombre} />
  }

  // ---- Pantalla principal ----
  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-32">
      {/* Encabezado */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{saludoSegunHora()} 👋</p>
          <h1 className="text-2xl font-bold">{nombre}</h1>
        </div>
        <button
          onClick={cambiarNombre}
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

      {/* Metas */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mis metas</h2>
          <button onClick={() => setFormularioMetaAbierto(true)} className="text-sm font-medium text-emerald-600">
            + Nueva meta
          </button>
        </div>

        {metas.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500 dark:bg-gray-900">
            Crea una meta y te digo cuánto guardar cada día 🎯
          </p>
        ) : (
          <div className="space-y-3">
            {metas.map((meta) => (
              <TarjetaMeta
                key={meta.id}
                meta={meta}
                onAbonar={() => abonarMeta(meta)}
                onEliminar={() => eliminarMeta(meta)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Últimos movimientos */}
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
                onClick={() => eliminarMovimiento(m)}
                className="flex cursor-pointer items-center justify-between rounded-2xl bg-white p-4 shadow-sm transition active:scale-[0.98] dark:bg-gray-900"
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

      {/* Botón flotante */}
      <button
        aria-label="Agregar movimiento"
        onClick={() => setFormularioAbierto(true)}
        className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 h-16 w-16 -translate-x-1/2 rounded-full bg-emerald-600 text-3xl text-white shadow-xl transition active:scale-90"
      >
        +
      </button>

      {/* Hojas inferiores */}
      {formularioAbierto && (
        <FormularioMovimiento
          metas={metas}
          onGuardar={agregarMovimiento}
          onCerrar={() => setFormularioAbierto(false)}
        />
      )}
      {formularioMetaAbierto && (
        <FormularioMeta onGuardar={agregarMeta} onCerrar={() => setFormularioMetaAbierto(false)} />
      )}
    </main>
  )
}

export default App