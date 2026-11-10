import Dexie, { type EntityTable } from 'dexie'
import type { Movimiento } from './types'

const db = new Dexie('MisFinanzasDB') as Dexie & {
  movimientos: EntityTable<Movimiento, 'id'>
}

// Esquema: el primer campo es la llave primaria,
// los demás son ÍNDICES (para buscar/filtrar rápido).
db.version(1).stores({
  movimientos: 'id, fecha, tipo, categoria',
})

export { db }