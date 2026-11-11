import { useState } from 'react'
import BarraNavegacion, { type Pantalla } from './components/BarraNavegacion'
import Bienvenida from './components/Bienvenida'
import Celebracion from './components/Celebracion'
import FormularioMeta from './components/FormularioMeta'
import FormularioMovimiento from './components/FormularioMovimiento'
import HojaAbono from './components/HojaAbono'
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
  const [movimientoEditando, setMovimientoEditando] = useState<Movimiento | null>(null)
  const [formularioMetaAbierto, setFormularioMetaAbierto] = useState(false)
  const [metaEditando, setMetaEditando] = useState<Meta | null>(null)
  const [metaAbonando, setMetaAbonando] = useState<Meta | null>(null)
  const [metaCelebrada, setMetaCelebrada] = useState<Meta | null>(null)
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
      abrirNuevaMeta()
    } else {
      setTipoNuevo(opcion) // 'gasto' o 'ingreso'
      setMovimientoEditando(null)
      setFormularioAbierto(true)
    }
  }

  // ---- Celebración ----
  function celebrar(meta: Meta) {
    setMetaCelebrada(meta)
    setTimeout(() => setMetaCelebrada(null), 4500) // se cierra sola a los 4,5 s
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
  function abrirEdicion(m: Movimiento) {
    setMovimientoEditando(m)
    setFormularioAbierto(true)
  }

  async function guardarMovimiento(movimiento: Movimiento, abono: Abono | null) {
    if (movimientoEditando) {
      await finanzas.actualizarMovimiento(movimiento)
    } else {
      await finanzas.agregarMovimiento(movimiento, abono)
    }
    setFormularioAbierto(false)

    // ¿El abono del ingreso completó una meta?
    const meta = abono && finanzas.metas.find((m) => m.id === abono.metaId)
    if (abono && meta && meta.ahorrado + abono.monto >= meta.montoObjetivo) celebrar(meta)
  }

  async function pedirEliminarMovimiento(m: Movimiento) {
    if (window.confirm(`¿Eliminar "${m.descripcion}" por ${formatearPesos(m.monto)}?`)) {
      await finanzas.eliminarMovimiento(m.id)
      setFormularioAbierto(false)
    }
  }

  function abrirNuevaMeta() {
    setMetaEditando(null)
    setFormularioMetaAbierto(true)
  }

  function abrirEdicionMeta(meta: Meta) {
    setMetaEditando(meta)
    setFormularioMetaAbierto(true)
  }

  async function guardarMeta(meta: Meta) {
    if (metaEditando) {
      await finanzas.actualizarMeta(meta)
    } else {
      await finanzas.agregarMeta(meta)
    }
    setFormularioMetaAbierto(false)
  }

  async function confirmarAbono(valor: number) {
    if (!metaAbonando) return
    const meta = metaAbonando
    await finanzas.abonarMeta(meta.id, valor)
    setMetaAbonando(null)

    // Si con este abono llegó al 100%, ¡a celebrar!
    if (valor > 0 && meta.ahorrado + valor >= meta.montoObjetivo) celebrar(meta)
  }

  async function pedirEliminarMeta(meta: Meta) {
    const ok = window.confirm(
      `¿Eliminar la meta "${meta.nombre}"? Lo ahorrado (${formatearPesos(meta.ahorrado)}) vuelve a tu saldo.`,
    )
    if (ok) {
      await finanzas.eliminarMeta(meta.id)
      setFormularioMetaAbierto(false)
    }
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
            onTocarMovimiento={abrirEdicion}
          />
        )}
        {pantalla === 'movimientos' && (
          <Movimientos movimientos={finanzas.movimientos} onTocarMovimiento={abrirEdicion} />
        )}
        {pantalla === 'metas' && (
          <Metas
            metas={finanzas.metas}
            totalAhorrado={finanzas.totalAhorrado}
            ingresoDiario={finanzas.ingresoDiario}
            onNuevaMeta={abrirNuevaMeta}
            onAbonar={setMetaAbonando}
            onEditar={abrirEdicionMeta}
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
          movimiento={movimientoEditando ?? undefined}
          onEliminar={pedirEliminarMovimiento}
          onGuardar={guardarMovimiento}
          onCerrar={() => setFormularioAbierto(false)}
        />
      )}
      {formularioMetaAbierto && (
        <FormularioMeta
          meta={metaEditando ?? undefined}
          ingresoDiario={finanzas.ingresoDiario}
          onGuardar={guardarMeta}
          onEliminar={pedirEliminarMeta}
          onCerrar={() => setFormularioMetaAbierto(false)}
        />
      )}
      {metaAbonando && (
        <HojaAbono
          meta={metaAbonando}
          saldo={finanzas.saldo}
          onConfirmar={confirmarAbono}
          onCerrar={() => setMetaAbonando(null)}
        />
      )}
      {metaCelebrada && <Celebracion meta={metaCelebrada} onCerrar={() => setMetaCelebrada(null)} />}
    </>
  )
}

export default App
