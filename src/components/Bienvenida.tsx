import { useState } from 'react'

interface Props {
  onListo: (nombre: string) => void
}

export default function Bienvenida({ onListo }: Props) {
  const [nombre, setNombre] = useState('')

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
            <img src={`${import.meta.env.BASE_URL}pwa-192x192.png`} alt="" className="mb-8 h-20 w-20 rounded-3xl shadow-lg" />

      <h1 className="text-3xl font-bold">Bienvenido a Mis Finanzas</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">
        Controla lo que ganas, lo que gastas y cumple tus metas de ahorro.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (nombre.trim()) onListo(nombre.trim())
        }}
        className="mt-10 space-y-4"
      >
        <label className="block">
          <span className="text-sm text-gray-500 dark:text-gray-400">¿Cómo te llamas?</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            autoComplete="given-name"
            className="mt-1 w-full rounded-xl bg-white px-4 py-4 text-lg shadow-sm outline-none dark:bg-gray-900"
          />
        </label>

        <button
          type="submit"
          disabled={!nombre.trim()}
          className="w-full rounded-xl bg-emerald-600 py-4 font-semibold text-white transition active:scale-95 disabled:opacity-40"
        >
          Empezar
        </button>
      </form>
    </main>
  )
}