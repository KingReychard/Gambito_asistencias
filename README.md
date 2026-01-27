# 🎯 Gambito - Registro de Asistencia

App móvil-first para que los maestros de Gambito registren la asistencia y avance de sus clases.

## 🚀 Despliegue Rápido en Cloudflare Pages

### 1. Sube el código a GitHub

```bash
git add .
git commit -m "Initial commit - Gambito Asistencias"
git push origin main
```

### 2. Configura Cloudflare Pages

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages
2. Click "Create a project" → "Connect to Git"
3. Selecciona el repo `Gambito_asistencias`
4. Configura el build:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Click "Save and Deploy"

¡Listo! Tu app estará en `gambito-asistencias.pages.dev` en ~2 minutos.

## 🔧 Configuración

### Conectar con n8n

Edita `src/App.jsx` y busca la sección `CONFIG`:

```javascript
const CONFIG = {
  // Cambia esto por tu URL real de n8n
  WEBHOOK_URL: 'https://tu-n8n.railway.app/webhook/registrar-clase',
  
  // PIN opcional para acceso
  ACCESS_PIN: '',
}
```

### Datos Reales de Notion

La app actual usa datos mock. Para conectar con tus datos reales de Notion:

1. Crea un workflow en n8n con un nodo "Webhook"
2. Agrega nodos para consultar Notion:
   - Obtener grupos del día
   - Obtener alumnos del grupo
   - Obtener temas del nivel
3. Retorna el JSON al frontend

## 📱 Uso

1. **Selecciona maestro** (se recuerda automáticamente)
2. **Elige el grupo** (filtrado por día de la semana)
3. **Tipo de clase:** Temario, Práctica, Evaluación o Torneo
4. **Si es Temario:** selecciona tema y número de sesión
5. **Pasa lista:** todos aparecen como "presentes", toca para marcar faltas
6. **Guarda** la clase

## 🎨 Personalización

### Colores (tailwind.config.js)

```javascript
colors: {
  gambito: {
    green: '#78c841',      // Verde principal
    orange: '#ff9b2f',     // Naranja acento
    dark: '#1a1a1a',       // Texto oscuro
    light: '#f8f9fa',      // Fondo claro
    red: '#ef4444',        // Color de faltas
  }
}
```

## 🛠 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Correr en modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## 📊 Estructura de Datos Enviados al Webhook

```json
{
  "fecha": "2026-01-27",
  "maestroId": "ricardo",
  "grupoId": "g3",
  "grupoCodigo": "C201",
  "tipo": "Temario",
  "temaId": "t13",
  "temaNombre": "La clavada",
  "sesion": 2,
  "totalSesiones": 3,
  "temaCompletado": false,
  "notas": "Buen avance del grupo",
  "asistencia": [
    { "alumnoId": "a10", "alumnoNombre": "Regina Flores", "status": "Asistió" },
    { "alumnoId": "a11", "alumnoNombre": "Leonardo Díaz", "status": "Falta" },
    ...
  ]
}
```

## 📁 Estructura del Proyecto

```
gambito-asistencias/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx          # Componente principal
│   ├── main.jsx         # Punto de entrada
│   └── index.css        # Estilos Tailwind
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## 🔗 Siguiente Paso: Workflow de n8n

Una vez la app funcione con datos mock, necesitas crear el workflow de n8n que:

1. **Webhook GET** `/obtener-datos-clase`
   - Recibe: `maestroId`, `fecha`
   - Retorna: grupos, alumnos, temas

2. **Webhook POST** `/registrar-clase`
   - Recibe: todos los datos de la clase
   - Crea registro en "📅 Registro de Clases"
   - Crea N registros en "✅ Asistencia"

---

Hecho con ♟️ para Gambito
