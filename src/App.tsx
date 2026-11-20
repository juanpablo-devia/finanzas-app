import { useState } from 'react'
import BarraNavegacion, { type Pantalla } from './components/BarraNavegacion'
import Bienvenida from './components/Bienvenida'
import Celebracion from './components/Celebracion'
import FormularioCompromiso from './components/FormularioCompromiso'
import FormularioPrevisto from './components/FormularioPrevisto'
import FormularioMeta from './components/FormularioMeta'
import FormularioMovimiento from './components/FormularioMovimiento'
import HojaAbono from './components/HojaAbono'
import HojaClaude from './components/HojaClaude'
import MenuAgregar, { type OpcionAgregar } from './components/MenuAgregar'
import { useFinanzas } from './hooks/useFinanzas'
import Ajustes from './pantallas/Ajustes'
import Inicio from './pantallas/Inicio'
import Metas from './pantallas/Metas'
import Movimientos from './pantallas/Movimientos'
import Resumen from './pantallas/Resumen'
import type { Abono, Compromiso, Cuota, Meta, Movimiento, Previsto, TipoMovimiento } from './types'
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
  const [celebracion, setCelebracion] = useState<{ emoji: string; mensaje: string } | null>(null)
  const [formularioCompromisoAbierto, setFormularioCompromisoAbierto] = useState(false)
  const [compromisoEditando, setCompromisoEditando] = useState<Compromiso | null>(null)
  const [formularioPrevistoAbierto, setFormularioPrevistoAbierto] = useState(false)
  const [hojaClaudeAbierta, setHojaClaudeAbierta] = useState(false)
  const [previstoEditando, setPrevistoEditando] = useState<Previsto | null>(null)
  // Cuando registras un ingreso esperado desde "¿Ya te llegó?"
  const [previstoEnCurso, setPrevistoEnCurso] = useState<{ previsto: Previsto; fecha: string } | null>(null)
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
    } else if (opcion === 'cuotas') {
      abrirNuevoCompromiso()
    } else {
      setTipoNuevo(opcion) // 'gasto' o 'ingreso'
      setMovimientoEditando(null)
      setPrevistoEnCurso(null)
      setFormularioAbierto(true)
    }
  }

  // ---- Celebración ----
  function celebrar(emoji: string, mensaje: string) {
    setCelebracion({ emoji, mensaje })
    setTimeout(() => setCelebracion(null), 4500) // se cierra sola a los 4,5 s
  }

  // ---- Nombre ----
  function guardarNombre(nuevo: string) {
    localStorage.setItem('nombre', nuevo)
    setNombre(nuevo)
  }

  // ---- Acciones con confirmación (la parte de "interfaz") ----
  function abrirEdicion(m: Movimiento) {
    setMovimientoEditando(m)
    setPrevistoEnCurso(null)
    setFormularioAbierto(true)
  }

  async function guardarMovimiento(movimiento: Movimiento, abonos: Abono[]) {
    if (movimientoEditando) {
      await finanzas.actualizarMovimiento(movimiento)
    } else {
      await finanzas.agregarMovimiento(movimiento, abonos)
    }
    setFormularioAbierto(false)

    // Si venía de un ingreso esperado, esa fecha queda confirmada
    if (previstoEnCurso) {
      await finanzas.confirmarPrevisto(previstoEnCurso.previsto.id, previstoEnCurso.fecha)
      setPrevistoEnCurso(null)
    }

    // ¿Algún abono completó una meta? (solo celebramos si ANTES no estaba completa)
    const completada = abonos
      .map((a) => ({ abono: a, meta: finanzas.metas.find((m) => m.id === a.metaId) }))
      .find(
        ({ abono, meta }) =>
          meta && meta.ahorrado < meta.montoObjetivo && meta.ahorrado + abono.monto >= meta.montoObjetivo,
      )
    if (completada?.meta) celebrar(completada.meta.emoji, `Completaste tu meta "${completada.meta.nombre}"`)
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
    if (valor > 0 && meta.ahorrado < meta.montoObjetivo && meta.ahorrado + valor >= meta.montoObjetivo) {
      celebrar(meta.emoji, `Completaste tu meta "${meta.nombre}"`)
    }
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

  // ---- Compras a cuotas ----
  function abrirNuevoCompromiso() {
    setCompromisoEditando(null)
    setFormularioCompromisoAbierto(true)
  }

  function abrirEdicionCompromiso(compromiso: Compromiso) {
    setCompromisoEditando(compromiso)
    setFormularioCompromisoAbierto(true)
  }

  async function guardarCompromiso(compromiso: Compromiso) {
    await finanzas.guardarCompromiso(compromiso)
    setFormularioCompromisoAbierto(false)
  }

  async function pedirEliminarCompromiso(compromiso: Compromiso) {
    const ok = window.confirm(
      `¿Eliminar "${compromiso.nombre}"? Las cuotas que ya pagaste siguen registradas como gastos.`,
    )
    if (ok) {
      await finanzas.eliminarCompromiso(compromiso.id)
      setFormularioCompromisoAbierto(false)
    }
  }

  async function tocarCuota(compromiso: Compromiso, cuota: Cuota) {
    const etiqueta = `cuota ${cuota.numero}/${compromiso.cuotas.length} de "${compromiso.nombre}"`

    if (cuota.pagada) {
      if (window.confirm(`¿Marcar la ${etiqueta} como NO pagada? Se borra el gasto que se registró.`)) {
        await finanzas.deshacerPagoCuota(compromiso.id, cuota.numero)
      }
      return
    }

    const bolsillo = finanzas.metas.find((m) => m.id === compromiso.metaId)
    const origen = bolsillo ? `del bolsillo ${bolsillo.nombre}` : 'de tu saldo disponible'
    if (!window.confirm(`¿Pagaste la ${etiqueta} por ${formatearPesos(cuota.monto)}? Se registra como gasto y sale ${origen}.`)) {
      return
    }
    await finanzas.pagarCuota(compromiso.id, cuota.numero)

    // ¿Era la última que faltaba?
    const pendientes = compromiso.cuotas.filter((c) => !c.pagada).length
    if (pendientes === 1) celebrar(compromiso.emoji, `Terminaste de pagar "${compromiso.nombre}"`)
  }

  // ---- Ingresos y gastos esperados ----
  function abrirNuevoPrevisto() {
    setPrevistoEditando(null)
    setFormularioPrevistoAbierto(true)
  }

  function abrirEdicionPrevisto(previsto: Previsto) {
    setPrevistoEditando(previsto)
    setFormularioPrevistoAbierto(true)
  }

  async function guardarPrevisto(previsto: Previsto) {
    await finanzas.guardarPrevisto(previsto)
    setFormularioPrevistoAbierto(false)
  }

  async function pedirEliminarPrevisto(previsto: Previsto) {
    if (window.confirm(`¿Quitar "${previsto.descripcion}" de lo que esperas?`)) {
      await finanzas.eliminarPrevisto(previsto.id)
      setFormularioPrevistoAbierto(false)
    }
  }

  // "Sí, registrar": abre el formulario con los datos ya llenos
  function registrarPrevisto(previsto: Previsto, fecha: string) {
    setPrevistoEnCurso({ previsto, fecha })
    setMovimientoEditando(null)
    setFormularioAbierto(true)
  }

  async function descartarPrevisto(previsto: Previsto, fecha: string) {
    const pregunta = previsto.tipo === 'ingreso' ? '¿No te llegó' : '¿No lo pagaste'
    if (window.confirm(`${pregunta} "${previsto.descripcion}"? Se quita de la lista y de la proyección.`)) {
      await finanzas.confirmarPrevisto(previsto.id, fecha)
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
            onAbrirAjustes={() => navegar('ajustes')}
            onContarleAClaude={() => setHojaClaudeAbierta(true)}
            onEditarPresupuesto={() => navegar('ajustes')}
            onNavegar={navegar}
            onTocarMovimiento={abrirEdicion}
            onRegistrarPrevisto={registrarPrevisto}
            onDescartarPrevisto={descartarPrevisto}
          />
        )}
        {pantalla === 'movimientos' && (
          <Movimientos movimientos={finanzas.movimientos} onTocarMovimiento={abrirEdicion} />
        )}
        {pantalla === 'metas' && (
          <Metas
            metas={finanzas.metas}
            compromisos={finanzas.compromisos}
            totalAhorrado={finanzas.totalAhorrado}
            ingresoDiario={finanzas.ingresoDiario}
            ingresoFijoMensual={finanzas.ingresoFijoMensual}
            cuotasDelMes={finanzas.cuotasDelMes}
            onNuevaMeta={abrirNuevaMeta}
            onAbonar={setMetaAbonando}
            onEditar={abrirEdicionMeta}
            onNuevoCompromiso={abrirNuevoCompromiso}
            onEditarCompromiso={abrirEdicionCompromiso}
            onTocarCuota={tocarCuota}
          />
        )}
        {pantalla === 'ajustes' && (
          <Ajustes
            finanzas={finanzas}
            nombre={nombre}
            onCambiarNombre={guardarNombre}
            onVolver={() => navegar('inicio')}
          />
        )}
        {pantalla === 'resumen' && (
          <Resumen
            finanzas={finanzas}
            onTocarMovimiento={abrirEdicion}
            onNuevoPrevisto={abrirNuevoPrevisto}
            onEditarPrevisto={abrirEdicionPrevisto}
          />
        )}
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
          categorias={finanzas.configuracion.categorias}
          tipoInicial={tipoNuevo}
          movimiento={movimientoEditando ?? undefined}
          valoresIniciales={
            previstoEnCurso
              ? {
                  tipo: previstoEnCurso.previsto.tipo,
                  monto: previstoEnCurso.previsto.monto,
                  descripcion: previstoEnCurso.previsto.descripcion,
                  categoria: previstoEnCurso.previsto.categoria,
                  fecha: previstoEnCurso.fecha,
                }
              : undefined
          }
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
      {formularioCompromisoAbierto && (
        <FormularioCompromiso
          compromiso={compromisoEditando ?? undefined}
          metas={finanzas.metas}
          onGuardar={guardarCompromiso}
          onEliminar={pedirEliminarCompromiso}
          onCerrar={() => setFormularioCompromisoAbierto(false)}
        />
      )}
      {formularioPrevistoAbierto && (
        <FormularioPrevisto
          categorias={finanzas.configuracion.categorias}
          previsto={previstoEditando ?? undefined}
          onGuardar={guardarPrevisto}
          onEliminar={pedirEliminarPrevisto}
          onCerrar={() => setFormularioPrevistoAbierto(false)}
        />
      )}
      {hojaClaudeAbierta && (
        <HojaClaude finanzas={finanzas} nombre={nombre} onCerrar={() => setHojaClaudeAbierta(false)} />
      )}
      {celebracion && (
        <Celebracion
          emoji={celebracion.emoji}
          mensaje={celebracion.mensaje}
          onCerrar={() => setCelebracion(null)}
        />
      )}
    </>
  )
}

export default App
