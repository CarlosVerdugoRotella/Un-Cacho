# Un-Cacho
Siempre contigo

v1.0 Manifiesto
Concepto
App web mobile-first que reemplaza el vaso de cuero (cacho) en el juego chileno de dados "Cachos/Dudo".
Cada jugador usa su propio teléfono. Juego presencial, sin red online.
La app NO maneja reglas ni turnos — solo simula el cacho. Las reglas se acuerdan en persona.
---
Estructura de archivos
```
cachos/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js       ← máquina de estados, controlador principal
│   ├── cacho.js     ← lógica y animaciones del cacho/dados
│   ├── sensors.js   ← devicemotion, shake, golpe
│   └── audio.js     ← Web Audio API, sonidos sintéticos
└── assets/          ← vacío v1, aquí van gráficos personalizables
```
---
Flujo de estados
```
[INICIO]
  → Selección de dados: 1–5 (default 5)
  → Botón "Empezar"
      ↓
[AGITANDO]
  → Cacho boca arriba
  → Sensores activos (devicemotion)
  → Shake mínimo 2–3 segundos continuo
  → Sonido de dados rodando en loop
  → Al detectar golpe de mesa → genera tirada aleatoria → bloquea sensores
      ↓
[BLOQUEADO]
  → Cacho se voltea boca abajo (animación ~1s)
  → Tiro guardado en memoria, sensores off
  → Nuevo shake NO altera la tirada
  → Toca pantalla → [VIENDO DADOS]
  → Botón "Volver a tirar" (arriba derecha) → [ENTRE RONDAS]
      ↓
[VIENDO DADOS]
  → Cacho abre lentamente (2s animación)
  → Se mantiene abierto mientras se presiona
  → Al soltar: cierra en 1s
      ↓ (soltar)
[BLOQUEADO] ← vuelve aquí
      ↓ (botón "Volver a tirar")
[ENTRE RONDAS]
  → Toggle "PERDÍ UNO" — resta 1 dado al próximo ciclo
  → Toggle "CALZÉ BIEN" — suma 1 dado al próximo ciclo (máx 5)
  → Mutuamente excluyentes, ambos opcionales
  → Botón grande "TIRAR" → aplica cambio de dados si hay toggle activo → [AGITANDO]
  → Botón mini esquina → advertencia → [INICIO]
      ↓ (si dados llegan a 0)
[ELIMINADO]
  → Pantalla "Fuiste..." 
  → Botón volver al inicio
```
---
Visual
Elemento	Descripción
Cacho	Cilindro levemente cónico, cuero café oscuro, costuras visibles, SVG
Dados	Cubos esquinas redondeadas, blancos, puntos negros clásicos, SVG
Mesa	Base de madera, textura CSS, fondo oscuro
Estilo	Ilustración flat + texturas, animaciones CSS/SVG
Animaciones clave
Agitando: vibración lateral del cacho (keyframe CSS)
Golpe → Bloqueado: cacho se voltea boca abajo (~1s)
Bloqueado → Viendo dados: cacho voltea lentamente (2s), muestra dados
Soltar: cacho cierra (1s)
Personalización futura
Los 3 elementos visuales (cacho, dados, mesa) están aislados en componentes/clases
para poder intercambiar gráficos sin tocar lógica.
---
Interacción táctil y sensores
Acción	Sensor/Evento
Shake	devicemotion, umbral aceleración + tiempo mínimo 2–3s
Golpe de mesa	Pico brusco único de aceleración vertical (>25 m/s²)
Abrir cacho	touchstart (mantener presionado)
Cerrar cacho	touchend
iOS	DeviceMotionEvent.requestPermission() al inicio
---
Audio (Web Audio API, sin archivos externos)
Sonido dados rodando: loop activo durante shake
Sonido golpe al fijar tiro: sintético básico
Arquitectura permite reemplazar por archivos .mp3 en v2
---
Dados
Default: 5
Mínimo: 1 (al llegar a 0 → [ELIMINADO])
Máximo: 5
Configurable en [INICIO] y ajustable en [ENTRE RONDAS] vía toggles
---
Trampa (por diseño)
Botones +/− solo activos en [ENTRE RONDAS], nunca después de tirar
Sensores bloqueados en [BLOQUEADO], nuevo shake ignorado
Si se detecta intento de nuevo shake en [BLOQUEADO]: ignorado silenciosamente
La trampa es parte del juego; la app la dificulta pero no la elimina
---
Fuera de scope v1
Reglas, turnos, contador global de jugadores
Online/multijugador
Vibración háptica (Vibration API)
Sonidos personalizados (vidrio, explosión, etc.)
Modo 8-bit u otros estilos visuales alternativos
Publicidad en pantalla [ELIMINADO]
---
v1.0 — checkpoint inicial
