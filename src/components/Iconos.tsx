import type { ReactNode } from 'react'

function Icono({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function IconoInicio() {
  return (
    <Icono>
      <path d="M5 12H3l9-9 9 9h-2" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
      <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
    </Icono>
  )
}

export function IconoLista() {
  return (
    <Icono>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M5 6v.01M5 12v.01M5 18v.01" />
    </Icono>
  )
}

export function IconoMeta() {
  return (
    <Icono>
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="9" />
    </Icono>
  )
}

export function IconoGrafica() {
  return (
    <Icono>
      <path d="M3 13a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M9 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z" />
      <path d="M15 9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z" />
    </Icono>
  )
}

export function IconoMas() {
  return (
    <Icono>
      <path d="M12 5v14M5 12h14" />
    </Icono>
  )
}
