# IMUDEL · Dashboard histórico DOM en Línea

Repositorio operativo para consolidar la serie mensual de DOM en Línea de la Dirección de Obras Municipales de Nacimiento.

## Arquitectura

- `data/monthly.json`: única base histórica consumida por el dashboard.
- `index.html`: interfaz web.
- `app.js`: validación, cálculo y renderizado automático de KPI, tendencias, calidad y Pareto.
- `.github/workflows/pages.yml`: despliegue automático al publicar cambios en `main`.

## Flujo mensual IMUDEL

1. Se solicita el informe mensual DOMEL del período.
2. Se leen y validan las fuentes institucionales vigentes de Google Drive y SharePoint.
3. Se construyen los indicadores oficiales del mes con las reglas metodológicas de IMUDEL.
4. Se genera el informe mensual.
5. El mismo cierre actualiza o incorpora el mes en `data/monthly.json`.
6. El dashboard recalcula automáticamente acumulados, digitalización, admisibilidad, tendencia y Pareto.
7. El push a `main` activa el despliegue de GitHub Pages.

## Regla fundamental

GitHub funciona como capa histórica y de publicación. Las fuentes administrativas originales siguen siendo Google Drive/SharePoint y deben validarse antes de incorporar un cierre mensual.

## Controles del esquema

Para cada mes se exige que:

- `domel + presencial = total`
- `domel + noadm = envios`
- exista clave única `AAAA-MM`
- el registro mensual incluya estado y nota de validación
- los KPI específicos y Pareto se carguen sólo cuando estén respaldados por las fuentes del período

## Operación esperada

Al ejecutar un nuevo cierre, por ejemplo **agosto 2026**, no es necesario modificar `index.html` ni `app.js`. Sólo se agrega el objeto `2026-08` a `data/monthly.json`; el dashboard incorpora el nuevo mes automáticamente.