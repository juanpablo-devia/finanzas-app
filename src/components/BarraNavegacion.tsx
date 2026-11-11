import type { ReactNode } from 'react'
import { IconoGrafica, IconoInicio, IconoLista, IconoMas, IconoMeta } from './Iconos'

export type Pantalla = 'inicio' | 'movimientos' | 'metas' | 'resumen'

interface Pestana {
  id: Pantalla
  etiqueta: string
  icono: ReactNode
}

const PESTANAS: Pestana[] = [
  { id: 'inicio', etiqueta: 'Inicio', icono: <IconoInicio /> },
  { id: 'movimientos', etiqueta: 'Movimientos', icono: <IconoLista /> },
  { id: 'metas', etiqueta: 'Metas', icono: <IconoMeta /> },
  { id: 'resumen', etiqueta: 'Resumen', icono: <IconoGrafica /> },
]

interface Props {
  actual: Pantalla
  onCambiar: (pantalla: Pantalla) => void
  menuAbierto: boolean
  onAgregar: () => void
}

export default function BarraNavegacion({ actual, menuAbierto, onCambiar, onAgregar }: Props) {
  function renderPestana(p: Pestana) {
    const activa = p.id === actual
    return (
      <button
        key={p.id}
        onClick={() => onCambiar(p.id)}
        aria-current={activa ? 'page' : undefined}
        className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition ${
          activa ? 'text-emerald-600' : 'text-gray-400'
        }`}
      >
        {p.icono}
        {p.etiqueta}
      </button>
    )
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2">
        {PESTANAS.slice(0, 2).map(renderPestana)}

        {/* Botón central para agregar */}
        <div className="flex justify-center">
          <button
            onClick={onAgregar}
            aria-label={menuAbierto ? 'Cerrar menú' : 'Agregar'}
            aria-expanded={menuAbierto}
            className="-mt-6 mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 transition active:scale-90"
          >
            {/* El + gira 45° y se convierte en ✕ */}
            <span className={`transition-transform duration-200 ${menuAbierto ? 'rotate-45' : ''}`}>
              <IconoMas />
            </span>
          </button>
        </div>

        {PESTANAS.slice(2).map(renderPestana)}
      </div>
    </nav>
  )
}
