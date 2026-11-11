import type { Meta } from '../types'

const CONFETI = ['🎉', '✨', '💚', '🎊', '⭐', '💰']

interface Props {
  meta: Meta
  onCerrar: () => void
}

export default function Celebracion({ meta, onCerrar }: Props) {
  return (
    <div
      onClick={onCerrar}
      className="fixed inset-0 z-[60] flex animate-aparecer flex-col items-center justify-center overflow-hidden bg-black/70 px-8 text-center text-white backdrop-blur-sm"
    >
      {/* Confeti: posiciones y retrasos calculados con el índice para que se vea "aleatorio" */}
      {Array.from({ length: 24 }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 animate-caer text-2xl"
          style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 8) * 0.18}s` }}
        >
          {CONFETI[i % CONFETI.length]}
        </span>
      ))}

      <p className="animate-bounce text-7xl">{meta.emoji}</p>
      <h2 className="mt-6 text-3xl font-bold">¡Lo lograste!</h2>
      <p className="mt-2 text-lg opacity-90">Completaste tu meta "{meta.nombre}"</p>
      <p className="mt-8 text-sm opacity-60">Toca para continuar</p>
    </div>
  )
}
