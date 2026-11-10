import Dexie, { type EntityTable } from 'dexie'
import type { Meta, Movimiento } from './types'

const db = new Dexie('MisFinanzasDB') as Dexie & {
  movimientos: EntityTable<Movimiento, 'id'>
  metas: EntityTable<Meta, 'id'>
}

db.version(1).stores({
  movimientos: 'id, fecha, tipo, categoria',
})

// Versión 2: agregamos la tabla de metas
db.version(2).stores({
  metas: 'id, fechaLimite',
})

export { db }