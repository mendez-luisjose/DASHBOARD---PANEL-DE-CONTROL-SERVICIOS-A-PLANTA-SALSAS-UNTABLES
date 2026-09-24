DASHBOARD SERVICIOS INDUSTRIALES · V7 · 24-09-2026

NUEVAS VARIABLES VAPOR · ALIMENTACIÓN CALDERAS
- Presión del desaireador · ≤ 15 psi · vapor_59
- Temperatura del desaireador · ≤ 104 °C · vapor_60
- Temperatura del Intercambiador · ≤ 100 °C · vapor_61
- Frecuencia configurada: Diaria.

NUEVAS VARIABLES PTAB · AGUA CRUDA · TANQUE SUBTERRÁNEO
- Bomba 1 · sin rango · ptab_40
- Bomba 2 · sin rango · ptab_41
- Bomba 3 · sin rango · ptab_42

CAMBIOS DE DASHBOARD
- Las nuevas variables aparecen en sus procesos/equipos y en los selectores/gráficas históricas.
- Vapor lee las variables nuevas desde la hoja Carga diaria.
- PTAB ahora también lee directamente Carga diaria para no depender del cálculo cacheado de la hoja Control.
- Bomba 1/2/3 admiten un valor numérico o un texto operativo; el texto se conserva en "Valor original turno".

APPS SCRIPT
- Backend V7-2026-09-24.
- La estructura de PTAB y VAPOR en Drive no requiere columnas nuevas: las variables se distinguen por VariableId.
- Reemplace Code.gs y publique una nueva versión de la misma Web App.
- No cambie MASTER_SHEET_ID ni WRITE_KEY.
- Compruebe TU_URL_EXEC?action=health y confirme version V7-2026-09-24.

FORMATOS
- formatos_operador/FORMATO_VAPOR_ACTUALIZADO_NUEVAS_VARIABLES.xlsx
- formatos_operador/FORMATO_PTAB_ACTUALIZADO_BOMBAS.xlsx
