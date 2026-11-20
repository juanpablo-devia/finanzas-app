import { db } from '../db'
import type { Compromiso, Meta, Movimiento, Previsto } from '../types'

// Lo que se guarda en localStorage y también va en el respaldo
const CLAVES_LOCALES = ['nombre', 'configuracion', 'plantillasReparto', 'notasParaClaude'] as const

export interface Respaldo {
  app: 'mis-finanzas'
  version: 1
  creado: string // fecha y hora ISO
  movimientos: Movimiento[]
  metas: Meta[]
  compromisos: Compromiso[]
  previstos: Previsto[]
  locales: Partial<Record<(typeof CLAVES_LOCALES)[number], string>>
}

export async function crearRespaldo(): Promise<Respaldo> {
  const locales: Respaldo['locales'] = {}
  for (const clave of CLAVES_LOCALES) {
    const valor = localStorage.getItem(clave)
    if (valor !== null) locales[clave] = valor
  }
  return {
    app: 'mis-finanzas',
    version: 1,
    creado: new Date().toISOString(),
    movimientos: await db.movimientos.toArray(),
    metas: await db.metas.toArray(),
    compromisos: await db.compromisos.toArray(),
    previstos: await db.previstos.toArray(),
    locales,
  }
}

// Entrega el archivo: en iPhone abre el menú de compartir (Guardar en Archivos, AirDrop…);
// en el computador lo descarga. Retorna false si cancelaste.
export async function exportarRespaldo(): Promise<boolean> {
  const respaldo = await crearRespaldo()
  const fecha = respaldo.creado.slice(0, 10)
  const archivo = new File([JSON.stringify(respaldo, null, 2)], `mis-finanzas-${fecha}.json`, {
    type: 'application/json',
  })

  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: 'Respaldo de Mis Finanzas' })
      return true
    } catch {
      return false // el usuario canceló
    }
  }

  const url = URL.createObjectURL(archivo)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = archivo.name
  enlace.click()
  URL.revokeObjectURL(url)
  return true
}

// Valida que el archivo sea un respaldo de esta app (no confiamos en cualquier JSON)
export function leerRespaldo(texto: string): Respaldo {
  const datos = JSON.parse(texto)
  if (datos?.app !== 'mis-finanzas' || !Array.isArray(datos.movimientos) || !Array.isArray(datos.metas)) {
    throw new Error('Este archivo no es un respaldo de Mis Finanzas.')
  }
  return {
    ...datos,
    compromisos: Array.isArray(datos.compromisos) ? datos.compromisos : [],
    previstos: Array.isArray(datos.previstos) ? datos.previstos : [],
    locales: datos.locales ?? {},
  }
}

// Reemplaza TODOS los datos actuales por los del respaldo
export async function restaurarRespaldo(respaldo: Respaldo) {
  await db.transaction('rw', [db.movimientos, db.metas, db.compromisos, db.previstos], async () => {
    await Promise.all([db.movimientos.clear(), db.metas.clear(), db.compromisos.clear(), db.previstos.clear()])
    await db.movimientos.bulkPut(respaldo.movimientos)
    await db.metas.bulkPut(respaldo.metas)
    await db.compromisos.bulkPut(respaldo.compromisos)
    await db.previstos.bulkPut(respaldo.previstos)
  })
  for (const clave of CLAVES_LOCALES) {
    const valor = respaldo.locales[clave]
    if (valor !== undefined) localStorage.setItem(clave, valor)
    else localStorage.removeItem(clave)
  }
}

export async function borrarTodo() {
  await db.transaction('rw', [db.movimientos, db.metas, db.compromisos, db.previstos], async () => {
    await Promise.all([db.movimientos.clear(), db.metas.clear(), db.compromisos.clear(), db.previstos.clear()])
  })
  for (const clave of [...CLAVES_LOCALES, 'presupuestoSemanal']) localStorage.removeItem(clave)
}
