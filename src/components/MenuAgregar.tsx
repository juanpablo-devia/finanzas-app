export type OpcionAgregar = 'gasto' | 'ingreso' | 'meta'

interface Opcion {
  id: OpcionAgregar
  etiqueta: string
  descripcion: string
  emoji: string
  color: string
}

const OPCIONES: Opcion[] = [
  { id: 'gasto', etiqueta: 'Gasto', descripcion: 'Algo que pagaste', emoji: '💸', color: 'bg-red-500/15' },
  { id: 'ingreso', etiqueta: 'Ingreso', descripcion: 'Plata que te entró', emoji: '💰', color: 'bg-emerald-500/15' },
  { id: 'meta', etiqueta: 'Nueva meta', descripcion: 'Algo para lo que quieres ahorrar', emoji: '🎯', color: 'bg-amber-500/15' },
]

interface Props {
  onElegir: (opcion: OpcionAgregar) => void
  onCerrar: () => void
}

export default function MenuAgregar({ onElegir, onCerrar }: Props) {
  return (
    // z-30: queda DEBAJO de la barra (z-40), así el botón + sigue visible y sirve para cerrar
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onCerrar}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="mb-[calc(6rem+env(safe-area-inset-bottom))] w-full max-w-md animate-aparecer space-y-2 px-6"
      >
        {OPCIONES.map((o) => (
          <button
            key={o.id}
            onClick={() => onElegir(o.id)}
            className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-lg transition active:scale-[0.98] dark:bg-gray-900"
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${o.color}`}>
              {o.emoji}
            </span>
            <div>
              <p className="font-semibold">{o.etiqueta}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{o.descripcion}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
