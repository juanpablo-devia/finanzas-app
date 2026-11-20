import { CATEGORIAS, FUENTES_FIJAS, FUERA_DEL_PRESUPUESTO, PRESUPUESTO_SEMANAL_INICIAL, type TipoMovimiento } from '../types'

// Todo lo que puedes personalizar en Ajustes. Se guarda en el dispositivo (localStorage).
export interface Configuracion {
  categorias: Record<TipoMovimiento, string[]>
  fuentesFijas: string[] // ingresos que cuentan para la regla de cuotas
  fueraDelPresupuesto: string[] // gastos que NO cuentan para el presupuesto semanal
  presupuestoSemanal: number
}

export const CONFIGURACION_INICIAL: Configuracion = {
  categorias: CATEGORIAS,
  fuentesFijas: FUENTES_FIJAS,
  fueraDelPresupuesto: FUERA_DEL_PRESUPUESTO,
  presupuestoSemanal: PRESUPUESTO_SEMANAL_INICIAL,
}

const CLAVE = 'configuracion'

export function leerConfiguracion(): Configuracion {
  try {
    const guardada = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Partial<Configuracion> | null
    // Antes el presupuesto se guardaba aparte: lo traemos para no perderlo
    const presupuestoViejo = Number(localStorage.getItem('presupuestoSemanal')) || undefined
    // Mezclamos con los valores iniciales por si en una versión nueva aparece un ajuste que no tenías
    return {
      ...CONFIGURACION_INICIAL,
      ...(presupuestoViejo ? { presupuestoSemanal: presupuestoViejo } : {}),
      ...guardada,
    }
  } catch {
    return CONFIGURACION_INICIAL
  }
}

export function guardarConfiguracion(configuracion: Configuracion) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(configuracion))
  } catch {
    // sin almacenamiento: los cambios duran hasta cerrar la app
  }
}
