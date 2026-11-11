import type { Meta, Movimiento } from '../types'
import { aISO, hoyISO } from './formato'

const MS_POR_DIA = 24 * 60 * 60 * 1000

export function diasEntre(desdeISO: string, hastaISO: string): number {
  const desde = new Date(desdeISO + 'T00:00')
  const hasta = new Date(hastaISO + 'T00:00')
  return Math.round((hasta.getTime() - desde.getTime()) / MS_POR_DIA)
}

export function calcularPlanMeta(meta: Meta, hoy = hoyISO()) {
  const faltante = Math.max(0, meta.montoObjetivo - meta.ahorrado)
  const diasHastaLimite = diasEntre(hoy, meta.fechaLimite)
  const diasRestantes = Math.max(1, diasHastaLimite)
  const porDia = Math.ceil(faltante / diasRestantes)

  return {
    faltante,
    diasRestantes,
    porDia,
    porSemana: Math.min(faltante, porDia * 7),
    progreso: meta.montoObjetivo > 0 ? Math.min(1, meta.ahorrado / meta.montoObjetivo) : 0,
    completada: faltante === 0,
    vencida: faltante > 0 && diasHastaLimite < 0,
  }
}

export function sumarDias(iso: string, dias: number): string {
  const fecha = new Date(iso + 'T00:00')
  fecha.setDate(fecha.getDate() + dias)
  return aISO(fecha)
}

/**
 * Cuánto sueles ganar al día, según tus ingresos recientes.
 * Usa los últimos 30 días, o desde tu primer ingreso si llevas menos tiempo
 * (mínimo 7 días, para que un solo pago no infle el promedio).
 */
export function ingresoDiarioPromedio(movimientos: Movimiento[], hoy = hoyISO()): number {
  const ingresos = movimientos.filter((m) => m.tipo === 'ingreso' && m.fecha <= hoy)
  if (ingresos.length === 0) return 0

  const primero = ingresos.reduce((min, m) => (m.fecha < min ? m.fecha : min), hoy)
  const dias = Math.min(30, Math.max(7, diasEntre(primero, hoy) + 1))
  const desde = sumarDias(hoy, -(dias - 1))

  const total = ingresos.filter((m) => m.fecha >= desde).reduce((t, m) => t + m.monto, 0)
  return total / dias
}

export type NivelMeta = 'comoda' | 'exigente' | 'dificil'

// Qué tan pesada es una meta comparada con lo que ganas
export function evaluarMeta(porDia: number, ingresoDiario: number) {
  if (ingresoDiario <= 0 || porDia <= 0) return null
  const porcentaje = Math.round((porDia / ingresoDiario) * 100)
  const nivel: NivelMeta = porcentaje <= 30 ? 'comoda' : porcentaje <= 60 ? 'exigente' : 'dificil'
  return { porcentaje, nivel }
}

// Fecha en la que cumplirías la meta si ahorras una proporción (30%) de lo que ganas
export function fechaSugerida(faltante: number, ingresoDiario: number, proporcion = 0.3, hoy = hoyISO()) {
  if (ingresoDiario <= 0 || faltante <= 0) return null
  return sumarDias(hoy, Math.ceil(faltante / (ingresoDiario * proporcion)))
}
