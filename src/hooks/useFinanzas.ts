import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { FUERA_DEL_PRESUPUESTO, PRESUPUESTO_SEMANAL_INICIAL, type Abono, type Meta, type Movimiento } from '../types'
import { hoyISO, inicioSemanaISO } from '../utils/formato'
import { diasEntre, ingresoDiarioPromedio } from '../utils/metas'

const sumar = (lista: Movimiento[]) => lista.reduce((total, m) => total + m.monto, 0)

/**
 * Custom hook con TODA la lógica de datos de la app:
 * consultas a la base de datos, cálculos y acciones.
 * Las pantallas solo se encargan de mostrar.
 */
export function useFinanzas() {
  const movimientos = useLiveQuery(() => db.movimientos.toArray(), []) ?? []
  const metas = useLiveQuery(() => db.metas.orderBy('fechaLimite').toArray(), []) ?? []
  const [presupuestoSemanal, setPresupuestoSemanal] = useState(
    () => Number(localStorage.getItem('presupuestoSemanal')) || PRESUPUESTO_SEMANAL_INICIAL,
  )

  // ---- Valores derivados ----
  const ingresos = movimientos.filter((m) => m.tipo === 'ingreso')
  const gastos = movimientos.filter((m) => m.tipo === 'gasto')
  const totalAhorrado = metas.reduce((total, meta) => total + meta.ahorrado, 0)

  // Plata libre = lo que entró - lo gastado - lo apartado en metas
  const saldo = sumar(ingresos) - sumar(gastos) - totalAhorrado

  const mesActual = hoyISO().slice(0, 7) // 'YYYY-MM'
  const ingresosMes = sumar(ingresos.filter((m) => m.fecha.startsWith(mesActual)))
  const gastosMes = sumar(gastos.filter((m) => m.fecha.startsWith(mesActual)))

  // ---- Presupuesto de la semana (lunes a domingo) ----
  const hoy = hoyISO()
  const inicioSemana = inicioSemanaISO()
  const gastadoSemana = sumar(
    gastos.filter(
      (m) => m.fecha >= inicioSemana && m.fecha <= hoy && !FUERA_DEL_PRESUPUESTO.includes(m.categoria),
    ),
  )
  const diasTranscurridosSemana = diasEntre(inicioSemana, hoy) + 1 // lunes = 1 ... domingo = 7
  const diasQuedanSemana = 8 - diasTranscurridosSemana // incluye hoy
  const restanteSemana = presupuestoSemanal - gastadoSemana

  // Lo que te queda de la semana repartido en los días que faltan,
  // pero nunca más de lo que realmente tienes libre
  const puedoGastarHoy = Math.max(0, Math.min(saldo, Math.floor(restanteSemana / diasQuedanSemana)))

  // Promedio de lo que ganas al día (para saber si una meta es realista)
  const ingresoDiario = ingresoDiarioPromedio(movimientos)

  // Más recientes primero
  const ordenados = [...movimientos].sort((a, b) => b.fecha.localeCompare(a.fecha))

  // ---- Acciones ----
  function cambiarPresupuestoSemanal(valor: number) {
    localStorage.setItem('presupuestoSemanal', String(valor))
    setPresupuestoSemanal(valor)
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
  }

  async function actualizarMovimiento(movimiento: Movimiento) {
    await db.movimientos.put(movimiento) // put = reemplaza el registro con el mismo id
  }

  async function eliminarMovimiento(id: string) {
    await db.movimientos.delete(id)
  }

  async function agregarMeta(meta: Meta) {
    await db.metas.add(meta)
  }

  async function actualizarMeta(meta: Meta) {
    await db.metas.put(meta)
  }

  // valor positivo = abonar, valor negativo = retirar (nunca queda por debajo de 0)
  async function abonarMeta(metaId: string, valor: number) {
    await db.transaction('rw', db.metas, async () => {
      const meta = await db.metas.get(metaId)
      if (meta) await db.metas.update(metaId, { ahorrado: Math.max(0, meta.ahorrado + valor) })
    })
  }

  async function eliminarMeta(id: string) {
    await db.metas.delete(id)
  }

  return {
    movimientos: ordenados,
    metas,
    saldo,
    totalAhorrado,
    ingresosMes,
    gastosMes,
    puedoGastarHoy,
    presupuestoSemanal,
    gastadoSemana,
    diasTranscurridosSemana,
    diasQuedanSemana,
    cambiarPresupuestoSemanal,
    ingresoDiario,
    agregarMovimiento,
    actualizarMovimiento,
    eliminarMovimiento,
    agregarMeta,
    actualizarMeta,
    abonarMeta,
    eliminarMeta,
  }
}

// El tipo se deduce automáticamente de lo que retorna el hook
export type Finanzas = ReturnType<typeof useFinanzas>
