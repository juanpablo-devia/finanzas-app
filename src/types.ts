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
// Ingresos que cuentan como "fijos" para tu regla de cuotas (lo de tu papá y los extras no cuentan)
export const FUENTES_FIJAS = ['Trabajo', 'Mensualidad']

export interface Cuota {
  numero: number // 1, 2, 3...
  monto: number
  fecha: string // vencimiento 'YYYY-MM-DD'
  pagada: boolean
  movimientoId?: string // el gasto que se registró al pagarla (para poder deshacer)
  delBolsillo?: number // cuánto se sacó del bolsillo vinculado al pagarla
}

// Una compra o deuda que se paga en cuotas
export interface Compromiso {
  id: string
  nombre: string // "Regalo novia", "PS5"
  emoji: string
  acreedor: string // a quién le pagas: "Mi primo", "Tarjeta de crédito"
  metaId: string // bolsillo del que salen las cuotas, o '' si sale de tu saldo
  cuotas: Cuota[]
}

export type Frecuencia = 'una vez' | 'semanal' | 'mensual'

// Plata que sabes que va a entrar o salir en el futuro
export interface Previsto {
  id: string
  tipo: TipoMovimiento
  descripcion: string // "Pago de fin de mes", "Regalos familia"
  categoria: string
  monto: number
  desde: string // primera (o única) fecha 'YYYY-MM-DD'
  frecuencia: Frecuencia
  hasta: string // última fecha posible si se repite ('' = sin fin)
  confirmadas: string[] // fechas que ya registraste o descartaste
}
