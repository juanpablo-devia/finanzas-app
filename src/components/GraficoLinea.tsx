import type { Punto } from '../utils/proyeccion'

interface Props {
  puntos: Punto[]
  minimoDeseado?: number // ej. tu colchón: se dibuja como línea punteada
}

/**
 * Gráfica de línea en SVG puro.
 * Convierte cada punto (día, saldo) a coordenadas (x, y) dentro de un lienzo de 300 × 120.
 */
export default function GraficoLinea({ puntos, minimoDeseado }: Props) {
  if (puntos.length < 2) return null

  const ANCHO = 300
  const ALTO = 120
  const valores = puntos.map((p) => p.saldo)
  const max = Math.max(...valores, minimoDeseado ?? 0, 0)
  const min = Math.min(...valores, 0)
  const rango = max - min || 1

  // En SVG la y crece hacia ABAJO, por eso se invierte
  const x = (i: number) => (i / (puntos.length - 1)) * ANCHO
  const y = (valor: number) => ALTO - ((valor - min) / rango) * ALTO

  const linea = puntos.map((p, i) => `${x(i)},${y(p.saldo)}`).join(' ')
  // Área bajo la línea: la misma línea + las dos esquinas de abajo
  const area = `0,${ALTO} ${linea} ${ANCHO},${ALTO}`

  const indiceMinimo = valores.indexOf(Math.min(...valores))

  return (
    <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="none" className="h-40 w-full overflow-visible">
      <polygon points={area} className="fill-emerald-500/10" />
      {/* Línea del cero (solo si el saldo baja de cero) */}
      {min < 0 && (
        <line x1="0" x2={ANCHO} y1={y(0)} y2={y(0)} className="stroke-red-400" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      )}
      {/* Línea del mínimo deseado (tu colchón) */}
      {minimoDeseado !== undefined && minimoDeseado > 0 && (
        <line
          x1="0"
          x2={ANCHO}
          y1={y(minimoDeseado)}
          y2={y(minimoDeseado)}
          className="stroke-amber-500"
          strokeWidth="1"
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <polyline
        points={linea}
        fill="none"
        className="stroke-emerald-500"
        strokeWidth="2.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Punto más bajo */}
      <circle cx={x(indiceMinimo)} cy={y(valores[indiceMinimo])} r="3" className="fill-red-500" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
