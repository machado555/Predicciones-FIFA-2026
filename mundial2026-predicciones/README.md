# Mundial 2026 — Predicciones Analíticas

Sitio de predicciones del **Mundial FIFA 2026** (fase de grupos, cuadro eliminatorio, análisis de probabilidades y seguimiento en vivo). Proyecto de **RAM — Predicciones Deportivas**.

![Vista previa del sitio](docs/screenshot-placeholder.png)

> **Nota:** Agregá una captura real en `docs/screenshot-placeholder.png` antes de publicar el repo.

## Características

- **12 grupos (A–L)** con tablas proyectadas, marcadores predichos y % de confianza
- **Cuadro eliminatorio** completo (R32 → Final)
- **Modelo estadístico** con correlación intra-grupo (ρ = 0.12) y curva en U para marcador exacto
- **Factor de forma** que ajusta automáticamente confianzas futuras (±15 pts máx.)
- **Resultados en vivo** vía [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) con fallback al snapshot estático
- **100% client-side** — sin build obligatorio, compatible con GitHub Pages

## Inicio rápido

Los módulos ES (`import`/`export`) requieren un servidor estático (no abrir `index.html` con `file://`).

```bash
# Opción 1 — sin instalar dependencias
npx serve .

# Opción 2 — con scripts del proyecto
npm install
npm run dev
```

Abrí `http://localhost:3000` (o el puerto que indique `serve`).

## Despliegue en GitHub Pages

1. Creá un repo en GitHub y subí este proyecto.
2. En **Settings → Pages**, elegí **GitHub Actions** como fuente (o "Deploy from branch" → `main` / root).
3. El workflow `.github/workflows/deploy.yml` despliega automáticamente en cada push a `main`.
4. Activá Pages con permisos de workflow si es la primera vez.

## Estructura del proyecto

```
/
├── index.html
├── favicon.svg
├── src/
│   ├── css/styles.css
│   ├── js/
│   │   ├── config.js           # Constantes centralizadas
│   │   ├── utils.js            # Helpers compartidos (banderas, niveles de conf.)
│   │   ├── main.js             # Init, tabs, modal
│   │   ├── data/
│   │   │   ├── groups.js
│   │   │   └── knockout.js
│   │   ├── models/
│   │   │   ├── probability.js
│   │   │   └── formAdjustment.js
│   │   ├── services/
│   │   │   └── liveResults.js
│   │   └── render/
│   │       ├── groups.js
│   │       ├── knockout.js
│   │       ├── analysis.js
│   │       └── probability.js
│   └── assets/og-image.svg
├── README.md
├── LICENSE
└── .github/workflows/deploy.yml
```

## Modelo estadístico (resumen)

| Componente | Descripción |
|------------|-------------|
| **Confianza base** | % subjetivo por partido (ranking, odds, forma) |
| **Factor de forma** | Compara goles reales vs predichos; ajusta partidos futuros con `PESO_FORMA = 4`, clamp ±15 |
| **Correlación ρ = 0.12** | Partidos del mismo grupo no son independientes → ensancha la distribución de aciertos |
| **Marcador exacto** | Curva en U: 6%–14% según qué tan parejo es el partido |

## Datos en vivo

El servicio `loadLiveResults()` consulta:

```
https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json
```

- Timeout: 12 s
- Validación de estructura JSON antes de aplicar
- Si falla (CORS, red, formato): muestra snapshot del 14 jun 2026 con aviso amarillo

## Scripts opcionales

```bash
npm run lint    # ESLint (requiere npm install)
npm run format  # Prettier
npm run build   # No-op — el sitio funciona sin bundler
```

## Disclaimer

Proyecto **recreativo y educativo**. Las predicciones son estimaciones de probabilidad, no certezas ni asesoramiento para apuestas. No está afiliado a la FIFA.

## Licencia

[MIT](LICENSE)
