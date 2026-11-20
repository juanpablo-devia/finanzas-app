import type { Finanzas } from '../hooks/useFinanzas'
import { resumenCompromiso, sumarMeses } from './cuotas'
import { formatearFecha, formatearPesos, hoyISO } from './formato'
import { calcularPlanMeta } from './metas'
import { eventosProyeccion, ocurrencias, proyectar } from './proyeccion'

const fecha = (iso: string) =>
  new Date(iso + 'T00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

interface Opciones {
  nombre: string
  pregunta: string
  notas: string // tus reglas y contexto
  incluirMovimientos: boolean
}

/**
 * Arma un texto con todo lo importante de tus finanzas, listo para pegar en un chat con Claude.
 * Usa solo resúmenes (no todo tu historial) para mandar lo justo y necesario.
 */
export function generarResumenParaClaude(f: Finanzas, o: Opciones): string {
  const hoy = hoyISO()
  const mes = hoy.slice(0, 7)
  const lineas: string[] = []
  const agregar = (...l: string[]) => lineas.push(...l)

  agregar(
    `Hola Claude. Soy ${o.nombre} y uso una app personal para manejar mis finanzas (pesos colombianos, COP).`,
    `Abajo está el resumen que generó la app hoy, ${fecha(hoy)}. Ayúdame a entender cómo voy y dame consejos concretos y realistas, en español.`,
    '',
  )

  if (o.notas.trim()) {
    agregar('## Mis reglas y contexto', o.notas.trim(), '')
  }

  // ---- Estado actual ----
  agregar(
    '## Cómo estoy hoy',
    `- Saldo libre (sin contar bolsillos): ${formatearPesos(f.saldo)}`,
    `- Guardado en bolsillos: ${formatearPesos(f.totalAhorrado)}`,
    `- Total: ${formatearPesos(f.saldo + f.totalAhorrado)}`,
    `- Promedio de ingresos: ${formatearPesos(Math.round(f.ingresoDiario))} al día`,
    '',
    '## Esta semana',
    `- Presupuesto semanal (gasolina, salidas, aseo, comida…): ${formatearPesos(f.presupuestoSemanal)}`,
    `- Llevo gastado: ${formatearPesos(f.gastadoSemana)} (día ${f.diasTranscurridosSemana} de 7)`,
    `- Me queda: ${formatearPesos(f.restanteSemana)}`,
    '',
  )

  // ---- Este mes por categoría ----
  const delMes = f.movimientos.filter((m) => m.fecha.startsWith(mes))
  const agrupar = (tipo: 'ingreso' | 'gasto') => {
    const mapa = new Map<string, number>()
    for (const m of delMes.filter((m) => m.tipo === tipo)) mapa.set(m.categoria, (mapa.get(m.categoria) ?? 0) + m.monto)
    return [...mapa.entries()].sort((a, b) => b[1] - a[1])
  }
  agregar(`## Este mes`, `- Ingresos: ${formatearPesos(f.ingresosMes)}`)
  for (const [cat, total] of agrupar('ingreso')) agregar(`  - ${cat}: ${formatearPesos(total)}`)
  agregar(`- Gastos: ${formatearPesos(f.gastosMes)}`)
  for (const [cat, total] of agrupar('gasto')) agregar(`  - ${cat}: ${formatearPesos(total)}`)
  agregar('')

  // ---- Bolsillos ----
  if (f.metas.length > 0) {
    agregar('## Mis bolsillos y metas')
    for (const m of f.metas) {
      const plan = calcularPlanMeta(m)
      const detalle = plan.sinFecha
        ? `mínimo a mantener ${formatearPesos(m.montoObjetivo)}`
        : `meta ${formatearPesos(m.montoObjetivo)} para el ${fecha(m.fechaLimite)}` +
          (plan.completada ? ' (cumplida)' : `, faltan ${formatearPesos(plan.faltante)} (${formatearPesos(plan.porDia)} al día)`)
      agregar(`- ${m.emoji} ${m.nombre}: tengo ${formatearPesos(m.ahorrado)} · ${detalle}`)
    }
    agregar('')
  }

  // ---- Cuotas ----
  if (f.compromisos.length > 0) {
    agregar('## Compras a cuotas')
    for (const c of f.compromisos) {
      const r = resumenCompromiso(c)
      const proxima = r.proxima ? ` · próxima: cuota ${r.proxima.numero} de ${formatearPesos(r.proxima.monto)} el ${fecha(r.proxima.fecha)}` : ''
      agregar(
        `- ${c.emoji} ${c.nombre}${c.acreedor ? ` (a ${c.acreedor})` : ''}: ${r.pagadas}/${r.cantidad} cuotas pagadas, ` +
          `faltan ${formatearPesos(r.pendiente)} de ${formatearPesos(r.total)}${proxima}` +
          (r.vencidas > 0 ? ` · ⚠️ ${r.vencidas} vencida(s)` : ''),
      )
    }
    if (f.ingresoFijoMensual > 0 && f.cuotasDelMes > 0) {
      agregar(
        `- Cuotas de este mes: ${formatearPesos(f.cuotasDelMes)} = ${Math.round((f.cuotasDelMes / f.ingresoFijoMensual) * 100)}% ` +
          `de mis ingresos fijos (~${formatearPesos(f.ingresoFijoMensual)}/mes)`,
      )
    }
    agregar('')
  }

  // ---- Lo que espero ----
  const hasta = sumarMeses(hoy, 3)
  const esperados = f.previstos
    .flatMap((p) => ocurrencias(p, hoy, hasta).map((fecha) => ({ p, fecha })))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 25)
  if (esperados.length > 0) {
    agregar('## Lo que espero (próximos 3 meses)')
    for (const { p, fecha: f2 } of esperados) {
      agregar(`- ${fecha(f2)}: ${p.tipo === 'ingreso' ? '+' : '-'}${formatearPesos(p.monto)} · ${p.descripcion} (${p.categoria})`)
    }
    agregar('')
  }

  // ---- Proyección ----
  const puntos = proyectar(
    f.saldo + f.totalAhorrado,
    eventosProyeccion({
      previstos: f.previstos,
      compromisos: f.compromisos,
      presupuestoSemanal: f.presupuestoSemanal,
      restanteSemana: f.restanteSemana,
      incluirSemana: true,
      hoy,
      hasta,
    }),
    hoy,
    hasta,
  )
  if (puntos.length > 1) {
    const enDias = (dias: number) => puntos[Math.min(dias, puntos.length - 1)]
    const minimo = puntos.reduce((menor, p) => (p.saldo < menor.saldo ? p : menor), puntos[0])
    agregar(
      '## Proyección (contando lo que espero, mis cuotas y mi presupuesto semanal)',
      `- En 30 días (${fecha(enDias(30).fecha)}): ${formatearPesos(enDias(30).saldo)}`,
      `- En 60 días (${fecha(enDias(60).fecha)}): ${formatearPesos(enDias(60).saldo)}`,
      `- En 3 meses (${fecha(enDias(puntos.length - 1).fecha)}): ${formatearPesos(enDias(puntos.length - 1).saldo)}`,
      `- Punto más bajo: ${formatearPesos(minimo.saldo)} el ${fecha(minimo.fecha)}`,
      '',
    )
  }

  // ---- Últimos movimientos ----
  if (o.incluirMovimientos && f.movimientos.length > 0) {
    agregar('## Últimos movimientos')
    for (const m of f.movimientos.slice(0, 20)) {
      agregar(`- ${formatearFecha(m.fecha)}: ${m.tipo === 'ingreso' ? '+' : '-'}${formatearPesos(m.monto)} · ${m.descripcion} (${m.categoria})`)
    }
    agregar('')
  }

  agregar('## Mi pregunta', o.pregunta.trim() || '¿Cómo voy? ¿Qué debería ajustar?')

  return lineas.join('\n')
}
