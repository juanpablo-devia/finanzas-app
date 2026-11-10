import type { Meta } from '../types'
import { hoyISO } from './formato'

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