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

// Para categorías que tú creas: un color de esta paleta, siempre el mismo para el mismo nombre
const PALETA = ['#f97316', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#eab308', '#06b6d4', '#84cc16', '#f43f5e']

export function colorCategoria(categoria: string): string {
  if (categoria === 'Otro') return '#9ca3af' // gris
  if (COLORES[categoria]) return COLORES[categoria]
  // "Hash" sencillo: suma los códigos de las letras y elige un color de la paleta
  const suma = [...categoria].reduce((total, letra) => total + letra.charCodeAt(0), 0)
  return PALETA[suma % PALETA.length]
}
