// Color de cada categoría para las gráficas
const COLORES: Record<string, string> = {
  Comida: '#f97316', // naranja
  Transporte: '#3b82f6', // azul
  Gasolina: '#6366f1', // índigo
  Universidad: '#8b5cf6', // violeta
  Salidas: '#ec4899', // rosado
  Servicios: '#14b8a6', // verde azulado
  Compras: '#eab308', // amarillo
  Trabajo: '#10b981', // verde
  Regalo: '#f43f5e', // rojo rosado
  Venta: '#06b6d4', // cian
}

export function colorCategoria(categoria: string): string {
  return COLORES[categoria] ?? '#9ca3af' // gris para "Otro" o desconocidas
}
