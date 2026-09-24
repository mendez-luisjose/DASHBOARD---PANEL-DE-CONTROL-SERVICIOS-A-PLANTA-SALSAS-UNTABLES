DASHBOARD SERVICIOS INDUSTRIALES · V8 · 24-09-2026

SISTEMA DE ENFRIAMIENTO UMA
- Se agrega como quinto sistema dentro de Compresores · Refrigeración · NH3.
- Bombas Formulación · Temperatura · rango 12 - 20 °C.
- Bombas Formulación · Presión · rango 40 - 120 psi.
- Bombas Envasado · Temperatura · rango 12 - 20 °C.
- Bombas Envasado · Presión · rango 40 - 120 psi.
- Lecturas en 7AM, 1PM, 7PM y 1AM desde filas 132-135 de Hoja1.
- Valores fuera del rango aparecen como Fuera de norma; valores dentro del rango aparecen normales.
- El nuevo sistema participa en los filtros Sistema > Equipo > Variable y en las gráficas históricas.

FORMATO OPERADOR
- formatos_operador/FORMATO_COMPRESORES_AMONIACO_UMA_ACTUALIZADO.xlsx
- Las etiquetas muestran los rangos de operación.
- Las celdas de lectura resaltan visualmente lecturas dentro/fuera del rango sin bloquear el ingreso.

GOOGLE DRIVE
- Hoja: COMPRESORES_REFRIGERACION.
- VariableId:
  sala_uma_132_temperatura_timed
  sala_uma_133_presion_timed
  sala_uma_134_temperatura_timed
  sala_uma_135_presion_timed

APPS SCRIPT
- Backend requerido: V8-2026-09-24.
- Reemplace Code.gs y publique una nueva versión de la misma Web App.
- No cambie MASTER_SHEET_ID ni WRITE_KEY.
- Compruebe TU_URL_EXEC?action=health y confirme:
  version = V8-2026-09-24
  supportsUmaCooling = true

GITHUB
- Suba a la raíz index.html, app.js, estilos.css, config.js, diagnostico_drive.html y los fallback.
- Después haga Commit changes y Ctrl+F5.
