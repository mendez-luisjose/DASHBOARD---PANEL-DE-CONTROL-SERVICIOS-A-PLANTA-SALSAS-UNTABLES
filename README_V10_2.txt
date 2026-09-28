DASHBOARD SERVICIOS INDUSTRIALES · V10.2 · 27-09-2026

INVENTARIO QUÍMICO
- Se elimina la alerta roja duplicada situada antes de las gráficas.
- Las gráficas son ahora la primera vista operativa del inventario.
- Los productos con stock negativo o por debajo del stock mínimo de seguridad se ordenan primero y se resaltan.
- Cada tarjeta muestra disponibilidad real en almacén, stock de seguridad, stock máximo, déficit y fecha estimada/OC cuando existe.

FORMATO OPERADOR
- formatos_operador/Formato_Actualizacion_Inventario_Quimico.xlsx
- Contiene los 40 productos del inventario base y todos los campos editables.
- No cambiar los encabezados de la fila 6.

CARGA DESDE EXCEL
- En Inventario Quimico usar “Actualizar inventario desde Excel”.
- El dashboard lee la hoja “Actualización Inventario”.
- Después de confirmación reemplaza los registros de INVENTARIO_QUIMICO en Base_Maestra_Dashboard.
- La actualización queda visible en todos los dispositivos al leer Drive.

APPS SCRIPT
- Reemplazar Code.gs por esta versión.
- Publicar una nueva versión de la misma Web App.
- Mantener MASTER_SHEET_ID y WRITE_KEY.
- Health esperado: version V10.2-2026-09-27 y supportsInventoryExcelUpload=true.
