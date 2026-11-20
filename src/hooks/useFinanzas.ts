import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import {
  FUENTES_FIJAS,
  FUERA_DEL_PRESUPUESTO,
  PRESUPUESTO_SEMANAL_INICIAL,
  type Abono,
  type Compromiso,
  type Meta,
  type Movimiento,
  type Previsto,
} from '../types'
import { totalCuotasDelMes } from '../utils/cuotas'
import { generarId } from '../utils/id'
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
  const metasGuardadas = useLiveQuery(() => db.metas.orderBy('fechaLimite').toArray(), []) ?? []
  // Por fecha límite, y las que no tienen fecha (como el colchón) al final
  const metas = [...metasGuardadas].sort((a, b) =>
    (a.fechaLimite || '9999').localeCompare(b.fechaLimite || '9999'),
  )
  const compromisos = useLiveQuery(() => db.compromisos.toArray(), []) ?? []
  const previstos = useLiveQuery(() => db.previstos.orderBy('id').toArray(), []) ?? []
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

  // ---- Regla de cuotas: cuánto pesan frente a tus ingresos FIJOS del mes ----
  // Se estima con el promedio diario de Trabajo + Mensualidad × 30 (más preciso entre más datos tengas)
  const ingresoFijoMensual = Math.round(
    ingresoDiarioPromedio(movimientos.filter((m) => FUENTES_FIJAS.includes(m.categoria))) * 30,
  )
  const cuotasDelMes = totalCuotasDelMes(compromisos, mesActual)

  // Más recientes primero
  const ordenados = [...movimientos].sort((a, b) => b.fecha.localeCompare(a.fecha))

  // ---- Acciones ----
  function cambiarPresupuestoSemanal(valor: number) {
    localStorage.setItem('presupuestoSemanal', String(valor))
    setPresupuestoSemanal(valor)
  }

  async function agregarMovimiento(nuevo: Movimiento, abonos: Abono[]) {
    // Transacción: o se guarda todo (el ingreso y cada abono), o nada
    await db.transaction('rw', db.movimientos, db.metas, async () => {
      await db.movimientos.add(nuevo)
      for (const abono of abonos) {
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

  async function guardarCompromiso(compromiso: Compromiso) {
    await db.compromisos.put(compromiso)
  }

  async function eliminarCompromiso(id: string) {
    await db.compromisos.delete(id)
  }

  // Pagar una cuota = registrar el gasto + sacar la plata del bolsillo vinculado (si hay) + marcarla
  async function pagarCuota(compromisoId: string, numero: number) {
    await db.transaction('rw', db.compromisos, db.movimientos, db.metas, async () => {
      const compromiso = await db.compromisos.get(compromisoId)
      const cuota = compromiso?.cuotas.find((c) => c.numero === numero)
      if (!compromiso || !cuota || cuota.pagada) return

      const movimientoId = generarId()
      await db.movimientos.add({
        id: movimientoId,
        tipo: 'gasto',
        monto: cuota.monto,
        descripcion: `${compromiso.nombre} · cuota ${numero}/${compromiso.cuotas.length}`,
        categoria: 'Cuotas',
        fecha: hoyISO(),
      })

      // Si hay bolsillo vinculado, la plata sale de ahí (hasta lo que tenga; el resto, de tu saldo)
      let delBolsillo = 0
      const meta = compromiso.metaId ? await db.metas.get(compromiso.metaId) : undefined
      if (meta) {
        delBolsillo = Math.min(meta.ahorrado, cuota.monto)
        await db.metas.update(meta.id, { ahorrado: meta.ahorrado - delBolsillo })
      }

      await db.compromisos.update(compromisoId, {
        cuotas: compromiso.cuotas.map((c) => (c.numero === numero ? { ...c, pagada: true, movimientoId, delBolsillo } : c)),
      })
    })
  }

  // Deshacer el pago: borra el gasto, devuelve la plata al bolsillo y la marca como pendiente
  async function deshacerPagoCuota(compromisoId: string, numero: number) {
    await db.transaction('rw', db.compromisos, db.movimientos, db.metas, async () => {
      const compromiso = await db.compromisos.get(compromisoId)
      const cuota = compromiso?.cuotas.find((c) => c.numero === numero)
      if (!compromiso || !cuota || !cuota.pagada) return

      if (cuota.movimientoId) await db.movimientos.delete(cuota.movimientoId)
      const meta = compromiso.metaId ? await db.metas.get(compromiso.metaId) : undefined
      if (meta && cuota.delBolsillo) {
        await db.metas.update(meta.id, { ahorrado: meta.ahorrado + cuota.delBolsillo })
      }

      await db.compromisos.update(compromisoId, {
        cuotas: compromiso.cuotas.map((c) =>
          c.numero === numero ? { numero: c.numero, monto: c.monto, fecha: c.fecha, pagada: false } : c,
        ),
      })
    })
  }

  async function guardarPrevisto(previsto: Previsto) {
    await db.previstos.put(previsto)
  }

  async function eliminarPrevisto(id: string) {
    await db.previstos.delete(id)
  }

  // Marca una fecha de un previsto como ya registrada (o descartada si no llegó)
  async function confirmarPrevisto(id: string, fecha: string) {
    await db.transaction('rw', db.previstos, async () => {
      const previsto = await db.previstos.get(id)
      if (previsto && !previsto.confirmadas.includes(fecha)) {
        await db.previstos.update(id, { confirmadas: [...previsto.confirmadas, fecha] })
      }
    })
  }

  async function eliminarMeta(id: string) {
    await db.metas.delete(id)
  }

  return {
    movimientos: ordenados,
    metas,
    compromisos,
    previstos,
    restanteSemana,
    ingresoFijoMensual,
    cuotasDelMes,
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
    guardarCompromiso,
    eliminarCompromiso,
    pagarCuota,
    deshacerPagoCuota,
    guardarPrevisto,
    eliminarPrevisto,
    confirmarPrevisto,
  }
}

// El tipo se deduce automáticamente de lo que retorna el hook
export type Finanzas = ReturnType<typeof useFinanzas>
