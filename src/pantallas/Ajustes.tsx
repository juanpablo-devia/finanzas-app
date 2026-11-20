import { useRef, useState, type ReactNode } from 'react'
import type { Finanzas } from '../hooks/useFinanzas'
import type { TipoMovimiento } from '../types'
import { colorCategoria } from '../utils/categorias'
import { formatearPesos, hoyISO } from '../utils/formato'
import { diasEntre } from '../utils/metas'
import { borrarTodo, exportarRespaldo, leerRespaldo, restaurarRespaldo } from '../utils/respaldo'

const tarjeta = 'rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900'
const campo = 'w-full rounded-xl bg-gray-100 px-4 py-3 text-base outline-none dark:bg-gray-800'

function Seccion({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="px-1 text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">{titulo}</h2>
      {descripcion && <p className="mt-1 px-1 text-xs text-gray-400">{descripcion}</p>}
      <div className={`${tarjeta} mt-2`}>{children}</div>
    </section>
  )
}

interface PropsLista {
  categorias: string[]
  etiquetaMarca: string // "En la semana", "Fijo"
  marcada: (categoria: string) => boolean
  onAlternar: (categoria: string) => void
  onRenombrar: (categoria: string) => void
  onEliminar: (categoria: string) => void
  onAgregar: (categoria: string) => void
}

function ListaCategorias({ categorias, etiquetaMarca, marcada, onAlternar, onRenombrar, onEliminar, onAgregar }: PropsLista) {
  const [nueva, setNueva] = useState('')

  function agregar() {
    const nombre = nueva.trim()
    if (!nombre) return
    if (categorias.some((c) => c.toLowerCase() === nombre.toLowerCase())) {
      window.alert(`Ya tienes una categoría llamada "${nombre}".`)
      return
    }
    onAgregar(nombre)
    setNueva('')
  }

  return (
    <>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {categorias.map((c) => (
          <li key={c} className="flex items-center gap-2 py-2.5">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: colorCategoria(c) }} />
            <button onClick={() => onRenombrar(c)} className="min-w-0 flex-1 truncate text-left text-sm">
              {c}
            </button>
            <button
              onClick={() => onAlternar(c)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                marcada(c)
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-gray-100 text-gray-400 line-through dark:bg-gray-800'
              }`}
            >
              {etiquetaMarca}
            </button>
            <button
              onClick={() => onEliminar(c)}
              aria-label={`Eliminar ${c}`}
              className="shrink-0 px-1 text-gray-300 dark:text-gray-600"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          agregar()
        }}
        className="mt-3 flex gap-2"
      >
        <input value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder="Nueva categoría" className={campo} />
        <button
          type="submit"
          disabled={!nueva.trim()}
          className="shrink-0 rounded-xl bg-emerald-600 px-4 font-semibold text-white transition active:scale-95 disabled:opacity-40"
        >
          +
        </button>
      </form>
      <p className="mt-2 text-[11px] text-gray-400">Toca el nombre para renombrarla.</p>
    </>
  )
}

interface Props {
  finanzas: Finanzas
  nombre: string
  onCambiarNombre: (nuevo: string) => void
  onVolver: () => void
}

export default function Ajustes({ finanzas, nombre, onCambiarNombre, onVolver }: Props) {
  const { configuracion, cambiarConfiguracion } = finanzas
  const [nombreLocal, setNombreLocal] = useState(nombre)
  const [presupuesto, setPresupuesto] = useState(String(configuracion.presupuestoSemanal))
  const [ultimoRespaldo, setUltimoRespaldo] = useState(() => localStorage.getItem('ultimoRespaldo') ?? '')
  const inputArchivo = useRef<HTMLInputElement>(null)

  // ---- Perfil y presupuesto: se guardan al salir del campo ----
  function guardarNombre() {
    const limpio = nombreLocal.trim()
    if (limpio && limpio !== nombre) onCambiarNombre(limpio)
    else setNombreLocal(nombre)
  }

  function guardarPresupuesto() {
    const valor = Number(presupuesto)
    if (valor > 0) finanzas.cambiarPresupuestoSemanal(valor)
    else setPresupuesto(String(configuracion.presupuestoSemanal))
  }

  // ---- Categorías ----
  const alternar = (lista: string[], c: string) => (lista.includes(c) ? lista.filter((x) => x !== c) : [...lista, c])

  function agregarCategoria(tipo: TipoMovimiento, nombreCat: string) {
    cambiarConfiguracion({
      ...configuracion,
      categorias: { ...configuracion.categorias, [tipo]: [...configuracion.categorias[tipo], nombreCat] },
    })
  }

  async function renombrar(tipo: TipoMovimiento, viejo: string) {
    const nuevo = window.prompt(`Nuevo nombre para "${viejo}":`, viejo)?.trim()
    if (!nuevo || nuevo === viejo) return
    if (configuracion.categorias[tipo].includes(nuevo)) {
      window.alert(`Ya tienes una categoría llamada "${nuevo}".`)
      return
    }
    await finanzas.renombrarCategoria(tipo, viejo, nuevo)
  }

  function eliminarCategoria(tipo: TipoMovimiento, c: string) {
    if (configuracion.categorias[tipo].length <= 1) {
      window.alert('Necesitas al menos una categoría.')
      return
    }
    if (!window.confirm(`¿Eliminar "${c}"? Los movimientos que ya la tienen la conservan.`)) return
    cambiarConfiguracion({
      ...configuracion,
      categorias: { ...configuracion.categorias, [tipo]: configuracion.categorias[tipo].filter((x) => x !== c) },
    })
  }

  // ---- Respaldo ----
  async function exportar() {
    if (await exportarRespaldo()) {
      const hoy = hoyISO()
      localStorage.setItem('ultimoRespaldo', hoy)
      setUltimoRespaldo(hoy)
    }
  }

  async function importar(archivo: File | undefined) {
    if (!archivo) return
    try {
      const respaldo = leerRespaldo(await archivo.text())
      const fecha = new Date(respaldo.creado).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
      const ok = window.confirm(
        `Respaldo del ${fecha} con ${respaldo.movimientos.length} movimientos y ${respaldo.metas.length} bolsillos.\n\n` +
          '⚠️ Esto REEMPLAZA todos tus datos actuales. ¿Continuar?',
      )
      if (!ok) return
      await restaurarRespaldo(respaldo)
      window.location.reload() // recargamos para que toda la app lea los datos restaurados
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No se pudo leer el archivo.')
    } finally {
      if (inputArchivo.current) inputArchivo.current.value = '' // permite elegir el mismo archivo otra vez
    }
  }

  async function pedirBorrarTodo() {
    if (!window.confirm('¿Borrar TODOS tus datos? Movimientos, bolsillos, cuotas, planes y ajustes.')) return
    const confirmacion = window.prompt('Esto no se puede deshacer. Escribe BORRAR para confirmar:')
    if (confirmacion?.trim().toUpperCase() !== 'BORRAR') return
    await borrarTodo()
    window.location.reload()
  }

  const diasDesdeRespaldo = ultimoRespaldo ? diasEntre(ultimoRespaldo, hoyISO()) : null

  return (
    <>
      <div className="mb-2 flex items-center gap-3">
        <button onClick={onVolver} aria-label="Volver" className="text-2xl text-gray-400">
          ‹
        </button>
        <h1 className="text-2xl font-bold">Ajustes</h1>
      </div>

      <Seccion titulo="👤 Perfil">
        <label className="block text-sm text-gray-500 dark:text-gray-400">
          Tu nombre
          <input
            value={nombreLocal}
            onChange={(e) => setNombreLocal(e.target.value)}
            onBlur={guardarNombre}
            className={`${campo} mt-1 text-gray-900 dark:text-gray-100`}
          />
        </label>
      </Seccion>

      <Seccion titulo="💵 Presupuesto semanal" descripcion="Lo que te permites gastar de lunes a domingo.">
        <input
          inputMode="numeric"
          value={presupuesto ? '$ ' + Number(presupuesto).toLocaleString('es-CO') : ''}
          onChange={(e) => setPresupuesto(e.target.value.replace(/\D/g, ''))}
          onBlur={guardarPresupuesto}
          className={campo}
        />
        <p className="mt-2 text-xs text-gray-400">
          Actual: {formatearPesos(configuracion.presupuestoSemanal)}. Elige abajo qué gastos cuentan.
        </p>
      </Seccion>

      <Seccion
        titulo="🏷️ Categorías de gastos"
        descripcion='"En la semana" = cuenta para tu presupuesto semanal. Desmárcalo para gastos grandes que pagas con bolsillos.'
      >
        <ListaCategorias
          categorias={configuracion.categorias.gasto}
          etiquetaMarca="En la semana"
          marcada={(c) => !configuracion.fueraDelPresupuesto.includes(c)}
          onAlternar={(c) =>
            cambiarConfiguracion({ ...configuracion, fueraDelPresupuesto: alternar(configuracion.fueraDelPresupuesto, c) })
          }
          onRenombrar={(c) => renombrar('gasto', c)}
          onEliminar={(c) => eliminarCategoria('gasto', c)}
          onAgregar={(c) => agregarCategoria('gasto', c)}
        />
      </Seccion>

      <Seccion
        titulo="🏷️ Fuentes de ingreso"
        descripcion='"Fijo" = cuenta para tu regla de cuotas (máx. 15–20% de tus ingresos fijos).'
      >
        <ListaCategorias
          categorias={configuracion.categorias.ingreso}
          etiquetaMarca="Fijo"
          marcada={(c) => configuracion.fuentesFijas.includes(c)}
          onAlternar={(c) => cambiarConfiguracion({ ...configuracion, fuentesFijas: alternar(configuracion.fuentesFijas, c) })}
          onRenombrar={(c) => renombrar('ingreso', c)}
          onEliminar={(c) => eliminarCategoria('ingreso', c)}
          onAgregar={(c) => agregarCategoria('ingreso', c)}
        />
      </Seccion>

      <Seccion titulo="💾 Respaldo" descripcion="Tus datos viven solo en este dispositivo. Haz un respaldo seguido.">
        <p
          className={`mb-3 text-sm ${
            diasDesdeRespaldo === null || diasDesdeRespaldo > 7 ? 'text-amber-600' : 'text-emerald-600'
          }`}
        >
          {diasDesdeRespaldo === null
            ? '⚠️ Nunca has hecho un respaldo.'
            : diasDesdeRespaldo === 0
              ? '✅ Último respaldo: hoy.'
              : `${diasDesdeRespaldo > 7 ? '⚠️' : '✅'} Último respaldo: hace ${diasDesdeRespaldo} ${diasDesdeRespaldo === 1 ? 'día' : 'días'}.`}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={exportar} className="rounded-xl bg-emerald-600 py-3 font-semibold text-white transition active:scale-95">
            Exportar
          </button>
          <button
            onClick={() => inputArchivo.current?.click()}
            className="rounded-xl bg-gray-100 py-3 font-semibold transition active:scale-95 dark:bg-gray-800"
          >
            Importar
          </button>
        </div>
        <input
          ref={inputArchivo}
          type="file"
          accept="application/json,.json"
          onChange={(e) => importar(e.target.files?.[0])}
          className="hidden"
        />
        <p className="mt-2 text-[11px] text-gray-400">
          En el iPhone, "Exportar" abre el menú para guardarlo en Archivos o enviártelo. Con "Importar" pasas tus datos a
          otro dispositivo.
        </p>
      </Seccion>

      <Seccion titulo="🗑️ Zona peligrosa">
        <button onClick={pedirBorrarTodo} className="w-full py-1 text-sm font-semibold text-red-500">
          Borrar todos mis datos
        </button>
      </Seccion>

      <p className="mt-8 text-center text-[11px] text-gray-400">
        Mis Finanzas · {window.location.hostname}
        <br />
        Hecho por {nombre} 💚
      </p>
    </>
  )
}
