const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function formatearPesos(valor: number): string {
  return formatoCOP.format(valor)
}

// Fecha local en formato 'YYYY-MM-DD'.
// No usamos toISOString() porque devuelve la fecha en UTC:
// en Colombia, después de las 7 p. m. ya marcaría el día siguiente.
export function aISO(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

export function hoyISO(): string {
  return aISO(new Date())
}

export function formatearFecha(iso: string): string {
  const ayer = new Date()
  ayer.setDate(ayer.getDate() - 1)

  if (iso === hoyISO()) return 'Hoy'
  if (iso === aISO(ayer)) return 'Ayer'
  return new Date(iso + 'T00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}