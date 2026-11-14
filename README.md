# 💰 Mis Finanzas

![CI/CD](https://github.com/juanpablo-devia/finanzas-app/actions/workflows/deploy.yml/badge.svg)

Aplicación web progresiva (PWA) para el control personal de ingresos, gastos y metas de ahorro. Los datos se guardan localmente en el navegador de cada usuario, por lo que no requiere servidor ni cuenta.

🔗 **Demo:** https://juanpablo-devia.github.io/finanzas-app/

## ✨ Características

- Registro de ingresos y gastos, con filtros y edición de movimientos.
- Saldo disponible y cuánto se puede gastar en el día.
- Metas de ahorro: abonar, retirar, editar, aviso de meta realista y celebración al cumplirla.
- Reparto de ingresos entre metas y gastos personales.
- Pestaña de resumen con gráfico de dona, barras diarias y comparación mensual.
- Instalable como app (PWA) y funciona sin conexión.

## 🛠️ Tecnologías

| Tecnología | Uso |
|---|---|
| React 19 + TypeScript | Interfaz y lógica |
| Vite | Empaquetado y servidor de desarrollo |
| Tailwind CSS 4 | Estilos |
| Dexie (IndexedDB) | Base de datos local en el navegador |
| vite-plugin-pwa | Soporte PWA y modo offline |
| Oxlint | Análisis estático del código |
| GitHub Actions + GitHub Pages | CI/CD y publicación |

## 🚀 Ejecutar en local

Requisitos: Node.js 22 o superior.

```bash
git clone https://github.com/juanpablo-devia/finanzas-app.git
cd finanzas-app
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

## 📜 Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila TypeScript y genera la versión de producción en `dist/` |
| `npm run preview` | Sirve localmente la versión de producción |
| `npm run lint` | Revisa el código con Oxlint |
| `npm run iconos` | Genera los íconos de la PWA |

## ⚙️ CI/CD

El pipeline (`.github/workflows/deploy.yml`) se ejecuta en cada push a `main`:

1. **Build:** instala dependencias, ejecuta el linter y genera la versión de producción con la ruta base `/finanzas-app/`.
2. **Deploy:** publica el contenido de `dist/` en GitHub Pages.
3. **Verificar despliegue:** comprueba que la página y el manifiesto de la PWA respondan con estado 200.

En los pull request solo se ejecuta el build, sin desplegar.

## 📁 Estructura

finanzas-app/
├── .github/workflows/ # Pipeline de CI/CD
├── public/ # Íconos y recursos estáticos de la PWA
├── src/
│ ├── components/ # Componentes de la interfaz
│ └── main.tsx # Punto de entrada
├── index.html
└── vite.config.ts # Configuración de Vite y de la PWA


## 📝 Convención de commits

Este proyecto usa [Conventional Commits](https://www.conventionalcommits.org/es/):
`feat:` nuevas funciones, `fix:` correcciones, `docs:` documentación, `ci:` pipeline, `build:` configuración de compilación.

## 👤 Autor

**Juan Pablo Devia** — Ingeniería de Sistemas, Unidad Central del Valle del Cauca (UCEVA)
