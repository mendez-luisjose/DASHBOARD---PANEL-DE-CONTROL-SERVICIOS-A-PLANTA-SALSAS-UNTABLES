DASHBOARD SERVICIOS INDUSTRIALES · V11.1 · INVENTARIO CON ARCHIVO OFICIAL

CAMBIO PRINCIPAL
- El Inventario Químico se actualiza directamente usando el mismo archivo oficial:
  Inventario de Quimicos Servicios a Planta SyU.xlsx
- Ya no es necesario usar Formato_Actualizacion_Inventario_Quimico.xlsx.

LECTURA DEL ARCHIVO OFICIAL
- Reconoce la hoja "Inventario de quimicos".
- Interpreta los encabezados dobles de Stock Seguridad / Stock Máximo.
- Conserva Stock Seguridad Actual y Stock Máximo Actual.
- Conserva Stock Seguridad Requerido y Stock Máximo Requerido.
- Lee Disponibilidad (Almacén 0003), Solicitud/OC, Fecha Estimada y Observaciones.
- Hereda automáticamente Planta / Área cuando las filas siguientes vienen vacías.
- Reconoce las secciones PRODUCTOS QUÍMICOS, REACTIVOS (LABORATORIO) y LUBRICACIÓN.

USO
1. El operador abre el archivo oficial y actualiza sus campos normalmente.
2. Guarda el mismo archivo .xlsx.
3. En el dashboard: Inventario Quimico > Actualizar inventario desde Excel.
4. Selecciona el archivo oficial actualizado.
5. El dashboard reemplaza INVENTARIO_QUIMICO en la Base Maestra de Drive y vuelve a leer los datos.

INSTALACIÓN
- Suba el contenido de este paquete a GitHub y haga Commit changes.
- Después haga Ctrl+F5.
- No es necesario volver a desplegar Apps Script: Code.gs no cambió.
- No cambie MASTER_SHEET_ID, WRITE_KEY ni la URL /exec.
