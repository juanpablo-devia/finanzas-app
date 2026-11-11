import { useState } from 'react'
import BarraNavegacion, { type Pantalla } from './components/BarraNavegacion'
import Bienvenida from './components/Bienvenida'
import FormularioMeta from './components/FormularioMeta'
import FormularioMovimiento from './components/FormularioMovimiento'
import MenuAgregar, { type OpcionAgregar } from './components/MenuAgregar'
import { useFinanzas } from './hooks/useFinanzas'
import Inicio from './pantallas/Inicio'
import Metas from './pantallas/Metas'
import Movimientos from './pantallas/Movimientos'
import Resumen from './pantallas/Resumen'
import type { Abono, Meta, Movimiento, TipoMovimiento } from './types'
import { formatearPesos } from './utils/formato'

function App() {
  // ---- Hooks: siempre arriba, antes de cualquier return ----
  const finanzas = useFinanzas()
  const [pantalla, setPantalla] = useState<Pantalla>('inicio')
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [tipoNuevo, setTipoNuevo] = useState<TipoMovimiento>('gasto')
  const [formularioMetaAbierto, setFormularioMetaAbierto] = useState(false)
  const [nombre, setNombre] = useState(() => localStorage.getItem('nombre') ?? '')

  // ---- Navegación ----
  function navegar(nueva: Pantalla) {
    setPantalla(nueva)
    window.scrollTo({ top: 0 })
  }

  // ---- Menú del botón + ----
  function elegirOpcion(opcion: OpcionAgregar) {
    setMenuAbierto(false)
    if (opcion === 'meta') {
      setFormularioMetaAbierto(true)
    } else {
      setTipoNuevo(opcion) // 'gasto' o 'ingreso'
      setFormularioAbierto(true)
    }
  }

  // ---- Nombre ----
  function guardarNombre(nuevo: string) {
    localStorage.setItem('nombre', nuevo)
    setNombre(nuevo)
  }

  function cambiarNombre() {
    const nuevo = window.prompt('¿Cómo quieres que te llame?', nombre)
    if (nuevo?.trim()) guardarNombre(nuevo.trim())
  }

  // ---- Acciones con confirmación (la parte de "interfaz") ----
  async function guardarMovimiento(movimiento: Movimiento, abono: Abono | null) {
    await finanzas.agregarMovimiento(movimiento, abono)
    setFormularioAbierto(false)
  }

  async function pedirEliminarMovimiento(m: Movimiento) {
    if (window.confirm(`¿Eliminar "${m.descripcion}" por ${formatearPesos(m.monto)}?`)) {
      await finanzas.eliminarMovimiento(m.id)
    }
  }

  async function guardarMeta(meta: Meta) {
    await finanzas.agregarMeta(meta)
    setFormularioMetaAbierto(false)
  }

  async function pedirAbono(meta: Meta) {
    const texto = window.prompt(`¿Cuánto vas a abonar a "${meta.nombre}"?`)
    const valor = Number(texto?.replace(/\D/g, '') ?? 0)
    if (!valor) return

    if (
      valor > finanzas.saldo &&
      !window.confirm('Ese abono es mayor que tu saldo disponible. ¿Abonar de todas formas?')
    ) {
      return
    }
    await finanzas.abonarMeta(meta.id, valor)
  }

  async function pedirEliminarMeta(meta: Meta) {
    const ok = window.confirm(
      `¿Eliminar la meta "${meta.nombre}"? Lo ahorrado (${formatearPesos(meta.ahorrado)}) vuelve a tu saldo.`,
    )
    if (ok) await finanzas.eliminarMeta(meta.id)
  }

  // ---- Pantalla de bienvenida si no hay nombre ----
  if (!nombre) {
    return <Bienvenida onListo={guardarNombre} />
  }

  return (
    <>
      {/* key={pantalla} hace que React "remonte" el main al cambiar de pestaña y se repita la animación */}
      <main
        key={pantalla}
        className="mx-auto min-h-dvh max-w-md animate-aparecer px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(7rem+env(safe-area-inset-bottom))]"
      >
        {pantalla === 'inicio' && (
          <Inicio
            finanzas={finanzas}
            nombre={nombre}
            onCambiarNombre={cambiarNombre}
            onNavegar={navegar}
            onTocarMovimiento={pedirEliminarMovimiento}
          />
        )}
        {pantalla === 'movimientos' && (
          <Movimientos movimientos={finanzas.movimientos} onTocarMovimiento={pedirEliminarMovimiento} />
        )}
        {pantalla === 'metas' && (
          <Metas
            metas={finanzas.metas}
            totalAhorrado={finanzas.totalAhorrado}
            onNuevaMeta={() => setFormularioMetaAbierto(true)}
            onAbonar={pedirAbono}
            onEliminar={pedirEliminarMeta}
          />
        )}
        {pantalla === 'resumen' && <Resumen />}
      </main>

      {menuAbierto && <MenuAgregar onElegir={elegirOpcion} onCerrar={() => setMenuAbierto(false)} />}

      <BarraNavegacion
        actual={pantalla}
        menuAbierto={menuAbierto}
        onCambiar={(nueva) => {
          setMenuAbierto(false)
          navegar(nueva)
        }}
        onAgregar={() => setMenuAbierto((abierto) => !abierto)}
      />

      {/* Hojas inferiores */}
      {formularioAbierto && (
        <FormularioMovimiento
          metas={finanzas.metas}
          tipoInicial={tipoNuevo}
          onGuardar={guardarMovimiento}
          onCerrar={() => setFormularioAbierto(false)}
        />
      )}
      {formularioMetaAbierto && (
        <FormularioMeta onGuardar={guardarMeta} onCerrar={() => setFormularioMetaAbierto(false)} />
      )}
    </>
  )
}

export default App
