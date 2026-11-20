import Dexie, { type EntityTable } from 'dexie'
import type { Compromiso, Meta, Movimiento } from './types'

const db = new Dexie('MisFinanzasDB') as Dexie & {
  movimientos: EntityTable<Movimiento, 'id'>
  metas: EntityTable<Meta, 'id'>
  compromisos: EntityTable<Compromiso, 'id'>
}

db.version(1).stores({
  movimientos: 'id, fecha, tipo, categoria',
})

// Versión 2: agregamos la tabla de metas
db.version(2).stores({
  metas: 'id, fechaLimite',
})

// Versión 3: compras a cuotas (las cuotas se guardan dentro de cada compromiso)
db.version(3).stores({
  compromisos: 'id',
})

export { db }