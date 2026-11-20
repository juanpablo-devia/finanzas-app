// Planes de reparto por fuente de ingreso, guardados en el dispositivo.
// Ejemplo: { "Trabajo": { "<id de la meta Play>": 0.15, "<id colchón>": 0.6 } }
// Se guardan como PROPORCIONES del ingreso (0 a 1), así sirven aunque el monto cambie.

export type Proporciones = Record<string, number> // id de la meta → fracción del ingreso

const CLAVE = 'plantillasReparto'

function leerTodas(): Record<string, Proporciones> {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? '{}')
  } catch {
    return {} // si el almacenamiento falla o el JSON está dañado, empezamos sin planes
  }
}

export function leerPlantilla(fuente: string): Proporciones | null {
  return leerTodas()[fuente] ?? null
}

export function guardarPlantilla(fuente: string, proporciones: Proporciones) {
  const todas = leerTodas()
  todas[fuente] = proporciones
  try {
    localStorage.setItem(CLAVE, JSON.stringify(todas))
  } catch {
    // sin almacenamiento disponible: el reparto se guarda igual, solo no se recuerda el plan
  }
}

// Si renombras una fuente de ingreso, su plan de reparto pasa al nombre nuevo
export function renombrarFuente(vieja: string, nueva: string) {
  const todas = leerTodas()
  if (!todas[vieja]) return
  todas[nueva] = todas[vieja]
  delete todas[vieja]
  try {
    localStorage.setItem(CLAVE, JSON.stringify(todas))
  } catch {
    // sin almacenamiento disponible
  }
}
