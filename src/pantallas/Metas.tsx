import TarjetaCompromiso from '../components/TarjetaCompromiso'
import TarjetaMeta from '../components/TarjetaMeta'
import type { Compromiso, Cuota, Meta } from '../types'
import { formatearPesos } from '../utils/formato'

interface Props {
  metas: Meta[]
  compromisos: Compromiso[]
  totalAhorrado: number
  ingresoDiario: number
  ingresoFijoMensual: number
  cuotasDelMes: number
  onNuevaMeta: () => void
  onAbonar: (meta: Meta) => void
  onEditar: (meta: Meta) => void
  onNuevoCompromiso: () => void
  onEditarCompromiso: (compromiso: Compromiso) => void
  onTocarCuota: (compromiso: Compromiso, cuota: Cuota) => void
}

const tarjetaVacia = 'rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-gray-900'

// Tu regla: las cuotas no deben pasar del 15–20% de tus ingresos fijos
function ReglaCuotas({ cuotasDelMes, ingresoFijoMensual }: { cuotasDelMes: number; ingresoFijoMensual: number }) {
  if (cuotasDelMes === 0) return null

  if (ingresoFijoMensual <= 0) {
    return (
      <p className="mb-3 rounded-xl bg-gray-100 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        Este mes tus cuotas suman <b>{formatearPesos(cuotasDelMes)}</b>. Registra tus ingresos de Trabajo y
        Mensualidad para saber si cumples tu regla del 20%.
      </p>
    )
  }

  const porcentaje = Math.round((cuotasDelMes / ingresoFijoMensual) * 100)
  const estilo =
    porcentaje <= 15
      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
      : porcentaje <= 20
        ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200'
        : 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-200'

  return (
    <p className={`mb-3 rounded-xl p-3 text-xs leading-relaxed ${estilo}`}>
      {porcentaje <= 15 ? '✅' : porcentaje <= 20 ? '⚠️' : '🚨'} Este mes tus cuotas suman{' '}
      <b>{formatearPesos(cuotasDelMes)}</b>: el <b>{porcentaje}%</b> de tus ingresos fijos (unos{' '}
      {formatearPesos(ingresoFijoMensual)} al mes). Tu regla: máximo 15–20%.
      {porcentaje > 20 &&
        ' Si las cubres con plata extra o ahorrada, está bien; solo no sumes otra deuda hasta terminar.'}
    </p>
  )
}

export default function Metas({
  metas,
  compromisos,
  totalAhorrado,
  ingresoDiario,
  ingresoFijoMensual,
  cuotasDelMes,
  onNuevaMeta,
  onAbonar,
  onEditar,
  onNuevoCompromiso,
  onEditarCompromiso,
  onTocarCuota,
}: Props) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Metas y cuotas</h1>

      {/* ---- Bolsillos / metas ---- */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mis bolsillos</h2>
          <button
            onClick={onNuevaMeta}
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white transition active:scale-95"
          >
            + Nuevo
          </button>
        </div>

        {metas.length === 0 ? (
          <div className={tarjetaVacia}>
            <p className="text-4xl">🎯</p>
            <p className="mt-3 font-semibold">Aún no tienes bolsillos</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Crea uno para cada cosa: regalos, la Play, tu colchón…
            </p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
              Llevas <b className="text-emerald-600">{formatearPesos(totalAhorrado)}</b> guardados en {metas.length}{' '}
              {metas.length === 1 ? 'bolsillo' : 'bolsillos'}.
            </p>
            <div className="space-y-3">
              {metas.map((meta) => (
                <TarjetaMeta
                  key={meta.id}
                  meta={meta}
                  ingresoDiario={ingresoDiario}
                  onAbonar={() => onAbonar(meta)}
                  onEditar={() => onEditar(meta)}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ---- Compras a cuotas ---- */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Compras a cuotas</h2>
          <button
            onClick={onNuevoCompromiso}
            className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition active:scale-95"
          >
            + Nueva
          </button>
        </div>

        <ReglaCuotas cuotasDelMes={cuotasDelMes} ingresoFijoMensual={ingresoFijoMensual} />

        {compromisos.length === 0 ? (
          <div className={tarjetaVacia}>
            <p className="text-4xl">🧾</p>
            <p className="mt-3 font-semibold">Sin compras a cuotas</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Registra lo que pagas por partes y te aviso cuándo vence cada cuota.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {compromisos.map((c) => (
              <TarjetaCompromiso
                key={c.id}
                compromiso={c}
                nombreBolsillo={metas.find((m) => m.id === c.metaId)?.nombre}
                onTocarCuota={(cuota) => onTocarCuota(c, cuota)}
                onEditar={() => onEditarCompromiso(c)}
              />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
