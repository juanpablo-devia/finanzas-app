import { formatearPesos } from '../utils/formato'

interface Props {
  valores: number[] // gasto de cada día: índice 0 = día 1
  diaActual: number | null // para resaltar hoy (null si es un mes pasado)
}

export default function GraficoBarrasDiarias({ valores, diaActual }: Props) {
  const maximo = Math.max(...valores, 1) // el 1 evita dividir entre 0
  const diasConDatos = diaActual ?? valores.length
  const promedio = valores.slice(0, diasConDatos).reduce((t, v) => t + v, 0) / diasConDatos

  return (
    <div>
      <div className="flex h-36 items-end gap-[2px]">
        {valores.map((valor, i) => {
          const dia = i + 1
          const esHoy = dia === diaActual
          const esFuturo = diaActual !== null && dia > diaActual
          return (
            <div
              key={dia}
              title={`Día ${dia}: ${formatearPesos(valor)}`}
              className={`flex-1 rounded-t transition-all duration-500 ${
                esHoy ? 'bg-emerald-500' : esFuturo ? 'bg-gray-100 dark:bg-gray-800' : 'bg-red-400/80'
              }`}
              // Altura mínima de 2px para que se vean los días en 0
              style={{ height: esFuturo ? '2px' : `max(2px, ${(valor / maximo) * 100}%)` }}
            />
          )
        })}
      </div>

      {/* Etiquetas cada 5 días */}
      <div className="mt-1 flex gap-[2px] text-[10px] text-gray-400">
        {valores.map((_, i) => (
          <span key={i} className="flex-1 text-center">
            {(i + 1) % 5 === 0 || i === 0 ? i + 1 : ''}
          </span>
        ))}
      </div>

      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
        Promedio: <b className="text-gray-900 dark:text-gray-100">{formatearPesos(Math.round(promedio))}</b> al día
      </p>
    </div>
  )
}
