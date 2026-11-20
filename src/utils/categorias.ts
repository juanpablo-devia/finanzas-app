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
  Mensualidad: '#22c55e', // verde claro
  'Papá': '#0ea5e9', // azul cielo
  'Salidas con mi novia': '#ec4899', // rosado
  'Aseo y personal': '#14b8a6', // verde azulado
  Carro: '#64748b', // gris pizarra
  Regalos: '#f43f5e', // rojo rosado
  Ropa: '#a855f7', // púrpura
  Cuotas: '#ef4444', // rojo
}

export function colorCategoria(categoria: string): string {
  return COLORES[categoria] ?? '#9ca3af' // gris para "Otro" o desconocidas
}
