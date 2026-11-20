export type TipoMovimiento = 'ingreso' | 'gasto'

export interface Movimiento {
  id: string
  tipo: TipoMovimiento
  monto: number        // entero en pesos
  descripcion: string
  categoria: string
  fecha: string        // 'YYYY-MM-DD'
}

export const CATEGORIAS: Record<TipoMovimiento, string[]> = {
  ingreso: ['Trabajo', 'Mensualidad', 'Papá', 'Regalo', 'Otro'],
  gasto: [
    'Gasolina',
    'Salidas con mi novia',
    'Aseo y personal',
    'Comida',
    'Carro',
    'Universidad',
    'Regalos',
    'Ropa',
    'Cuotas',
    'Compras',
    'Otro',
  ],
}

// Gastos grandes y planeados que se pagan con plata de los bolsillos,
// así que NO cuentan para el presupuesto de la semana
export const FUERA_DEL_PRESUPUESTO = ['Regalos', 'Ropa', 'Cuotas']

export const PRESUPUESTO_SEMANAL_INICIAL = 150000

export interface Meta {
  id: string
  nombre: string
  emoji: string
  montoObjetivo: number
  ahorrado: number
  fechaLimite: string // 'YYYY-MM-DD', o '' si no tiene fecha (ej. el colchón)
}

export const EMOJIS_META = ['🎯', '🎁', '✈️', '🚗', '💻', '🎓', '🏠', '💍']

export interface Abono {
  metaId: string
  monto: number
}