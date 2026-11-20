import { formatearPesos } from '../utils/formato'

type Estado = 'bien' | 'rapido' | 'pasado'

const COLORES: Record<Estado, { barra: string; texto: string }> = {
  bien: { barra: 'bg-emerald-500', texto: 'text-emerald-600' },
  rapido: { barra: 'bg-amber-500', texto: 'text-amber-600' },
  pasado: { barra: 'bg-red-500', texto: 'text-red-500' },
}

interface Props {
  presupuesto: number
  gastado: number
  diasTranscurridos: number // lunes = 1 ... domingo = 7
  diasQuedan: number // incluye hoy
  onEditar: () => void
}

export default function TarjetaPresupuesto({ presupuesto, gastado, diasTranscurridos, diasQuedan, onEditar }: Props) {
  const restante = presupuesto - gastado
  const porcentaje = presupuesto > 0 ? Math.round((gastado / presupuesto) * 100) : 0

  // Si el gasto fuera parejo, a esta altura de la semana "deberías" llevar este %
  const ritmoEsperado = Math.round((diasTranscurridos / 7) * 100)

  const estado: Estado = porcentaje >= 100 ? 'pasado' : porcentaje > ritmoEsperado + 15 ? 'rapido' : 'bien'
  const colores = COLORES[estado]
  const porDia = Math.max(0, Math.floor(restante / diasQuedan))

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Esta semana</h2>
        <button onClick={onEditar} className="text-xs font-medium text-gray-400">
          Presupuesto: {formatearPesos(presupuesto)} ✏️
        </button>
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Llevas <b className={colores.texto}>{formatearPesos(gastado)}</b>
        </p>
        <span className={`text-sm font-semibold ${colores.texto}`}>{porcentaje}%</span>
      </div>

      {/* Barra con una marca de dónde "deberías" ir */}
      <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colores.barra}`}
          style={{ width: `${Math.min(100, porcentaje)}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-gray-400/70"
          style={{ left: `${ritmoEsperado}%` }}
          title="Ritmo esperado"
        />
      </div>

      <p className="mt-3 text-sm">
        {estado === 'bien' && (
          <>
            👌 Vas bien. Te quedan <b>{formatearPesos(restante)}</b> para {diasQuedan}{' '}
            {diasQuedan === 1 ? 'día' : 'días'} ({formatearPesos(porDia)} al día).
          </>
        )}
        {estado === 'rapido' && (
          <>
            ⚠️ Vas más rápido de lo planeado: llevas el {porcentaje}% y va el {ritmoEsperado}% de la semana. Te
            quedan <b>{formatearPesos(restante)}</b> ({formatearPesos(porDia)} al día).
          </>
        )}
        {estado === 'pasado' && (
          <>
            🚨 Te pasaste <b className="text-red-500">{formatearPesos(-restante)}</b>. Recorta primero de lo libre o
            del colchón, nunca de las cuotas ni de los regalos.
          </>
        )}
      </p>
    </section>
  )
}
