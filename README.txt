DASHBOARD SERVICIOS INDUSTRIALES · ACTUALIZACIÓN 22-09-2026

CORRECCIONES INCLUIDAS
- Vapor: el selector “Variable para lectura del día” permite una variable, “Todas las gráficas” y “Ninguna gráfica”.
- PTAR: el formato diario se lee directamente desde “Carga diaria”; se conservan 07:00 y 19:00.
- Vapor: el formato diario se lee directamente desde “Carga diaria”; se conservan 07:00 y 19:00.
- Suavizadores: la fecha se interpreta explícitamente como dd/mm/aaaa; por ejemplo 21/09/2026 -> 2026-09-21.
- Google Drive: Base_Maestra_Dashboard ahora usa una quinta hoja única: COMPRESORES_REFRIGERACION.
- Compresores de aire y Refrigeración/Amoníaco leen y guardan datos desde esa misma hoja única.
- Refrigeración y Amoníaco permanecen unificados en una sola pestaña del dashboard.
- La planilla Sala_de_Compresores_Actualizado_Amigable.xlsx conserva la estructura original; solo se mejoró su presentación.

ARCHIVOS PARA GITHUB
Suba a la raíz del repositorio:
- index.html
- app.js
- estilos.css
- config.js
- diagnostico_drive.html
- aire_fallback.js
- nh3_fallback.js
- ptab_fallback.js
- ptar_fallback.js
- vapor_fallback.js
- suav_fallback.js

APPS SCRIPT
Reemplace el Code.gs actual por apps_script_backend/Code.gs y publique una NUEVA VERSIÓN de la misma Aplicación web.
No cambie MASTER_SHEET_ID ni WRITE_KEY.
La URL /exec de config.js se conserva.

PLANILLA OPERADOR
formatos_operador/Sala_de_Compresores_Actualizado_Amigable.xlsx
Se puede cargar desde Compresores de aire o desde Refrigeración y amoníaco; una sola carga procesa ambas secciones y las guarda en COMPRESORES_REFRIGERACION.

Después de subir a GitHub haga Commit changes y Ctrl+F5.

ACTUALIZACIÓN V5 · 23-09-2026
- Backend requerido: V5-2026-09-23.
- Bancos de Hielo: lectura fija de E/G/I/K en filas 81-84.
- Temperaturas CAV Gigante: lectura fija E/I en filas 124-127.
- Históricos Sala de Compresores: Sistema > Equipo > Variable.
- La carga se verifica contra Drive después de guardar.
