// crypto.randomUUID() solo funciona en HTTPS o localhost.
// En el iPhone entramos por http://10.10.x.x, así que usamos esto:
export function generarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}