DASHBOARD DE SERVICIOS INDUSTRIALES — BASE MAESTRA UNIFICADA
Versión 16-09-2026

ARCHIVO PRINCIPAL PARA GITHUB PAGES
- index.html

BASE PRINCIPAL DE DATOS
- base_maestra/Base_Maestra_Dashboard.xlsx
- Contiene exactamente cuatro hojas: PTAB, PTAR, VAPOR y SUAVIZADORES.
- Esta base reúne el histórico que antes estaba separado en cuatro archivos Excel.
- En GitHub Pages, el dashboard intenta leer esta base al abrirse.
- Si un registro existe en la base maestra y también en el almacenamiento local del navegador, la base maestra se considera la referencia canónica. Los registros locales nuevos que todavía no estén en la base maestra se conservan.

FORMATOS PARA EL OPERADOR
- formatos_operador/Formato_Operador_Carga_Diaria_PTAB.xlsx
- formatos_operador/Formato_Operador_Carga_Diaria_PTAR.xlsx
- formatos_operador/Formato_Operador_Carga_Diaria_Vapor.xlsx
- formatos_operador/Formato_Operador_Carga_Diaria_Suavizadores.xlsx

FLUJO DE CARGA DIARIA
1. El operador llena la hoja "Carga diaria" del formato correspondiente y guarda el archivo .xlsx.
2. En el dashboard abre el servicio y pulsa "Añadir desde Excel".
3. El dashboard añade los registros al histórico sin borrar la información anterior.
4. Automáticamente se descarga "Base_Maestra_Dashboard_Actualizada.xlsx" con PTAB, PTAR, VAPOR y SUAVIZADORES consolidados.
5. Para dejar esa carga como base oficial del repositorio, renombre el archivo descargado a "Base_Maestra_Dashboard.xlsx" y reemplace el archivo ubicado en base_maestra/ dentro de GitHub.

CORRECCIONES MANUALES
- Si después de una carga hay que corregir fecha, operador, valor u observación, puede editar directamente base_maestra/Base_Maestra_Dashboard.xlsx.
- No cambie los nombres de las cuatro hojas ni los encabezados de las columnas.
- Después de corregirla, vuelva a subir/reemplazar el mismo archivo en base_maestra/.
- Al recargar GitHub Pages, esa base tendrá prioridad sobre copias antiguas del mismo registro guardadas localmente.

FILTROS DE VISUALIZACIÓN CONSERVADOS
- Mes general en Resumen de planta.
- Mes por servicio.
- Todos / un / ningún proceso.
- Lecturas del día: todas / una variable / ninguna gráfica.
- Histórico: todas / una variable / ninguna gráfica.

COMPRESORES DE AIRE Y REFRIGERACIÓN NH3
- Continúan con su estructura actual y no forman parte de esta base maestra de cuatro hojas.
- Sus plantillas se conservan en plantillas/.

PUBLICACIÓN EN GITHUB PAGES
- Suba TODO el contenido de esta carpeta a la raíz del repositorio.
- index.html debe quedar en la raíz.
- Mantenga la carpeta base_maestra/ con Base_Maestra_Dashboard.xlsx.
