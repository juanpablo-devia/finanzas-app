import type { Compromiso, Previsto } from '../types'
import { sumarMeses } from './cuotas'
import { inicioSemanaISO } from './formato'
import { sumarDias } from './metas'

// Fechas en las que ocurre un previsto dentro de [desde, hasta], sin las ya confirmadas o descartadas
export function ocurrencias(p: Previsto, desde: string, hasta: string): string[] {
  const limite = p.frecuencia !== 'una vez' && p.hasta && p.hasta < hasta ? p.hasta : hasta
  const fechas: string[] = []

  if (p.frecuencia === 'una vez') {
    fechas.push(p.desde)
  } else {
    // Máximo 400 repeticiones, por seguridad (evita un ciclo infinito si algo sale mal)
    for (let i = 0; i < 400; i++) {
      const fecha = p.frecuencia === 'semanal' ? sumarDias(p.desde, i * 7) : sumarMeses(p.desde, i)
      if (fecha > limite) break
      fechas.push(fecha)
    }
  }

  return fechas.filter((f) => f >= desde && f <= limite && !p.confirmadas.includes(f))
}

export interface Evento {
  fecha: string
  descripcion: string
  monto: number // positivo = entra, negativo = sale
  clase: 'ingreso' | 'gasto' | 'cuota' | 'semana'
}

interface DatosProyeccion {
  previstos: Previsto[]
  compromisos: Compromiso[]
  presupuestoSemanal: number
  restanteSemana: number // lo que te queda del presupuesto de esta semana
  incluirSemana: boolean // descontar el presupuesto semanal
  hoy: string
  hasta: string
}

// Todo lo que va a entrar y salir entre hoy y la fecha final, en orden
export function eventosProyeccion(d: DatosProyeccion): Evento[] {
  const eventos: Evento[] = []

  // 1. Ingresos y gastos previstos (solo desde hoy; los atrasados se confirman aparte)
  for (const p of d.previstos) {
    for (const fecha of ocurrencias(p, d.hoy, d.hasta)) {
      eventos.push({
        fecha,
        descripcion: p.descripcion,
        monto: p.tipo === 'ingreso' ? p.monto : -p.monto,
        clase: p.tipo,
      })
    }
  }

  // 2. Cuotas sin pagar (las vencidas se cuentan para hoy, porque igual las debes)
  for (const c of d.compromisos) {
    for (const cuota of c.cuotas) {
      if (cuota.pagada || cuota.fecha > d.hasta) continue
      eventos.push({
        fecha: cuota.fecha < d.hoy ? d.hoy : cuota.fecha,
        descripcion: `${c.nombre} · cuota ${cuota.numero}/${c.cuotas.length}`,
        monto: -cuota.monto,
        clase: 'cuota',
      })
    }
  }

  // 3. Gastos del día a día: lo que queda de esta semana hoy, y el presupuesto completo cada lunes
  if (d.incluirSemana) {
    if (d.restanteSemana > 0) {
      eventos.push({ fecha: d.hoy, descripcion: 'Gastos de esta semana', monto: -d.restanteSemana, clase: 'semana' })
    }
    for (let lunes = sumarDias(inicioSemanaISO(), 7); lunes <= d.hasta; lunes = sumarDias(lunes, 7)) {
      eventos.push({ fecha: lunes, descripcion: 'Gastos de la semana', monto: -d.presupuestoSemanal, clase: 'semana' })
    }
  }

  return eventos.sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export interface Punto {
  fecha: string
  saldo: number
}

// Saldo día a día desde hoy hasta la fecha final
export function proyectar(saldoInicial: number, eventos: Evento[], hoy: string, hasta: string): Punto[] {
  const puntos: Punto[] = []
  let saldo = saldoInicial
  let i = 0
  for (let fecha = hoy; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
    while (i < eventos.length && eventos[i].fecha === fecha) {
      saldo += eventos[i].monto
      i++
    }
    puntos.push({ fecha, saldo })
  }
  return puntos
}

// Ocurrencias que ya pasaron (hasta hoy) y no has confirmado: "¿ya te llegó?"
export function pendientesPorConfirmar(previstos: Previsto[], hoy: string, diasAtras = 30) {
  return previstos
    .flatMap((p) => ocurrencias(p, sumarDias(hoy, -diasAtras), hoy).map((fecha) => ({ previsto: p, fecha })))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}
