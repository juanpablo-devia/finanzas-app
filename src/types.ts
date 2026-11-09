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
  ingreso: ['Trabajo', 'Regalo', 'Venta', 'Otro'],
  gasto: ['Comida', 'Transporte', 'Gasolina', 'Universidad', 'Salidas', 'Servicios', 'Compras', 'Otro'],
}