export function saludoSegunHora(fecha = new Date()): string {
  const hora = fecha.getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export function obtenerIniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)      // separa por espacios
    .slice(0, 2)       // máximo 2 palabras
    .map((palabra) => palabra[0].toUpperCase())
    .join('')
}