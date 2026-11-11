import { formatearPesos } from '../utils/formato'
import { evaluarMeta, fechaSugerida, type NivelMeta } from '../utils/metas'

const ESTILOS: Record<NivelMeta, { emoji: string; titulo: string; clase: string }> = {
  comoda: {
    emoji: '✅',
    titulo: 'Meta cómoda',
    clase: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
  },
  exigente: {
    emoji: '⚠️',
    titulo: 'Meta exigente',
    clase: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200',
  },
  dificil: {
    emoji: '🚨',
    titulo: 'Meta muy difícil',
    clase: 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-200',
  },
}

function formatearFechaConAnio(iso: string): string {
  return new Date(iso + 'T00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props {
  porDia: number
  faltante: number
  ingresoDiario: number
}

export default function ConsejoMeta({ porDia, faltante, ingresoDiario }: Props) {
  const evaluacion = evaluarMeta(porDia, ingresoDiario)
  if (!evaluacion) return null // sin ingresos registrados no podemos comparar

  const estilo = ESTILOS[evaluacion.nivel]
  const sugerida = evaluacion.nivel !== 'comoda' ? fechaSugerida(faltante, ingresoDiario) : null

  return (
    <p className={`rounded-xl p-3 text-xs leading-relaxed ${estilo.clase}`}>
      {estilo.emoji} <b>{estilo.titulo}:</b> te pide el {evaluacion.porcentaje}% de lo que sueles ganar al día (
      {formatearPesos(Math.round(ingresoDiario))}).
      {sugerida && (
        <>
          {' '}
          Ahorrando el 30% la cumplirías el <b>{formatearFechaConAnio(sugerida)}</b>.
        </>
      )}
    </p>
  )
}
