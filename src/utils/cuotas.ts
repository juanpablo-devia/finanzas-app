import type { Compromiso, Cuota } from '../types'
import { aISO, hoyISO } from './formato'
import { diasEntre } from './metas'

const sumarMontos = (cuotas: Cuota[]) => cuotas.reduce((t, c) => t + c.monto, 0)

// La misma fecha N meses después. Si ese mes es más corto (ej. 31 → febrero), usa el último día.
export function sumarMeses(iso: string, meses: number): string {
  const [anio, mes, dia] = iso.split('-').map(Number)
  const ultimoDia = new Date(anio, mes - 1 + meses + 1, 0).getDate()
  return aISO(new Date(anio, mes - 1 + meses, Math.min(dia, ultimoDia)))
}

// Divide el total en cuotas mensuales iguales (redondeadas a mil). La última absorbe la diferencia.
export function generarCuotas(total: number, cantidad: number, primeraFecha: string): Cuota[] {
  const base = Math.floor(total / cantidad / 1000) * 1000
  return Array.from({ length: cantidad }, (_, i) => ({
    numero: i + 1,
    monto: i === cantidad - 1 ? total - base * (cantidad - 1) : base,
    fecha: sumarMeses(primeraFecha, i),
    pagada: false,
  }))
}

// Reparte una diferencia por igual entre ciertas cuotas (la última se lleva el sobrante del redondeo)
function repartirDiferencia(cuotas: Cuota[], numeros: number[], diferencia: number): Cuota[] {
  if (numeros.length === 0) return cuotas
  const porCuota = Math.trunc(diferencia / numeros.length)
  const sobrante = diferencia - porCuota * numeros.length
  const ultima = numeros[numeros.length - 1]
  return cuotas.map((c) =>
    numeros.includes(c.numero)
      ? { ...c, monto: Math.max(0, c.monto + porCuota + (c.numero === ultima ? sobrante : 0)) }
      : c,
  )
}

// Cambia el total (ej. el regalo salió más barato): la diferencia se reparte entre las cuotas PENDIENTES
export function cambiarTotal(cuotas: Cuota[], nuevoTotal: number): Cuota[] {
  const pendientes = cuotas.filter((c) => !c.pagada).map((c) => c.numero)
  return repartirDiferencia(cuotas, pendientes, nuevoTotal - sumarMontos(cuotas))
}

// Cambia el monto de una cuota y reajusta las pendientes que vienen DESPUÉS para mantener el total.
// Si es la última, el total cambia.
export function cambiarMontoCuota(cuotas: Cuota[], numero: number, nuevoMonto: number): Cuota[] {
  const actual = cuotas.find((c) => c.numero === numero)
  if (!actual) return cuotas
  const conCambio = cuotas.map((c) => (c.numero === numero ? { ...c, monto: nuevoMonto } : c))
  const siguientes = cuotas.filter((c) => c.numero > numero && !c.pagada).map((c) => c.numero)
  return repartirDiferencia(conCambio, siguientes, actual.monto - nuevoMonto)
}

export function resumenCompromiso(compromiso: Compromiso, hoy = hoyISO()) {
  const cuotas = [...compromiso.cuotas].sort((a, b) => a.numero - b.numero)
  const total = sumarMontos(cuotas)
  const pagado = sumarMontos(cuotas.filter((c) => c.pagada))
  const pagadas = cuotas.filter((c) => c.pagada).length
  return {
    total,
    pagado,
    pendiente: total - pagado,
    pagadas,
    cantidad: cuotas.length,
    proxima: cuotas.find((c) => !c.pagada) ?? null,
    vencidas: cuotas.filter((c) => !c.pagada && c.fecha < hoy).length,
    terminado: pagadas === cuotas.length,
  }
}

export interface PagoProximo {
  compromiso: Compromiso
  cuota: Cuota
  dias: number // negativo = vencida
}

// Cuotas sin pagar que vencen en los próximos N días (incluye las vencidas)
export function proximosPagos(compromisos: Compromiso[], horizonteDias = 45, hoy = hoyISO()): PagoProximo[] {
  return compromisos
    .flatMap((compromiso) =>
      compromiso.cuotas
        .filter((cuota) => !cuota.pagada)
        .map((cuota) => ({ compromiso, cuota, dias: diasEntre(hoy, cuota.fecha) })),
    )
    .filter((p) => p.dias <= horizonteDias)
    .sort((a, b) => a.dias - b.dias)
}

// Suma de las cuotas que vencen en un mes ('YYYY-MM')
export function totalCuotasDelMes(compromisos: Compromiso[], mes: string): number {
  return compromisos.reduce(
    (total, c) => total + sumarMontos(c.cuotas.filter((cuota) => cuota.fecha.startsWith(mes))),
    0,
  )
}

// "Hoy", "Mañana", "En 5 días", "Vencida hace 2 días"
export function textoDias(dias: number): string {
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Mañana'
  if (dias > 1) return `En ${dias} días`
  return dias === -1 ? 'Vencida ayer' : `Vencida hace ${-dias} días`
}
