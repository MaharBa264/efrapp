# EfraApp · Despachos

Aplicación móvil PWA con frontend estático, API `/api/v1` en Worker y D1. Sin inventario. Los maestros se pueden editar; cada despacho conserva nombres y datos del emisor al crearse. Los números se asignan al confirmar mediante un contador en D1.

## Desarrollo

Node 22 o posterior. `npm ci`, `npm run check`, `npm test`. Crear una base D1 con `npx wrangler d1 create efrapp`, copiar su `database_id` en `wrangler.jsonc` y ejecutar `npm run db:local` y `npm run seed:local`. Iniciar API con `npm run dev` (puerto 8787) y frontend con `npm run pages` (4173). Para desarrollo local, usar `npx wrangler pages dev web --binding API_ORIGIN=https://TU-WORKER.workers.dev` para probar la función de Pages (o un proxy local `/api/*` al Worker). Abrir la web e inicializar el primer superadministrador con contraseña de al menos 12 caracteres. El setup sólo funciona si la tabla de usuarios está vacía.

## Producción en Cloudflare

1. Crear D1 `efrapp`, reemplazar `database_id` en `wrangler.jsonc`. Ejecutar `npm run db:remote` y `npm run seed:remote` desde una sesión Wrangler autenticada. El seed usa IDs estables y `INSERT OR IGNORE`: repetirlo no sobrescribe productos editados.
2. Ajustar `ALLOWED_ORIGIN` en `wrangler.jsonc` al origen final de Pages (lista de orígenes separados por coma si hay varios). Configurar `API_ORIGIN=https://TU-WORKER.workers.dev` como variable de entorno del proyecto Pages. Publicar API con `npm run deploy:api`.
3. Conectar **este repositorio**, rama `main`, a Cloudflare Pages: sin comando de build y directorio de salida `web` (directorio `functions` en la raíz del repositorio). Pages publicará nuevas versiones del frontend automáticamente. Para actualizar el Worker al cambiar `main`, configurar un segundo build de Workers conectado al mismo repositorio con comando `npm ci && npm run deploy:api`, o usar CI con `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` como secretos de GitHub. No publicar las credenciales en el repositorio.
4. Abrir Pages, inicializar el superadministrador y configurar los datos del despachante. Restringir el acceso administrativo al dominio real. Usar siempre HTTPS.

**Seguridad:** credenciales con PBKDF2-SHA256 y sal aleatoria, tokens de sesión aleatorios guardados sólo como hash, vencimiento a 7 días y autorización en cada ruta. El frontend conserva el token únicamente en `sessionStorage`. Los despachos se filtran en el servidor por vendedor y alcances. Para Android futuro, la API es independiente del frontend y usa UUID y timestamps ISO; todavía no implementa sincronización.

**Comprobantes:** PDF y PNG comparten el mismo SVG base. El PNG se exporta a 1200 px de ancho; el PDF usa páginas A4. Los borradores no tienen número ni comprobante final.

## Unidades y peso por producto

El peso se configura **por unidad en el catálogo de productos** (kg, hasta tres decimales). En un despacho sólo se ingresan unidades enteras, escribiéndolas o ajustándolas con los botones. El servidor calcula el peso total de cada renglón y guarda una copia del peso por unidad y del total para conservar los comprobantes históricos. Un producto sin peso configurado no puede despacharse: asigná los pesos a los productos existentes desde Administración antes de utilizar el nuevo flujo. Las migraciones `0002` y `0003` conservan los despachos anteriores y dejan como desconocidos los pesos que nunca se registraron. Antes de publicar el Worker actualizado, ejecutar `npm run db:remote` en la base de producción.

## Despliegue automático desde GitHub

`.github/workflows/deploy.yml` publica cada commit de `main` después de pasar las pruebas: aplica las migraciones pendientes de D1, actualiza el Worker y publica `web` y `functions` en el proyecto Pages existente `efrapp`. La primera vez hay que crear en **GitHub → repositorio → Settings → Secrets and variables → Actions** estos dos *repository secrets*:

- `CLOUDFLARE_ACCOUNT_ID`: ID de la cuenta de Cloudflare (dashboard, página de la cuenta).
- `CLOUDFLARE_API_TOKEN`: token de API de Cloudflare restringido a esta cuenta con permisos de edición para Workers, Pages y D1.

No copiar el token a archivos ni al historial de comandos. Después de guardar ambos secretos, ejecutar el workflow **Deploy EfraApp to Cloudflare** desde la pestaña Actions → Run workflow (rama `main`). Los siguientes commits en `main` se desplegarán automáticamente. Revisar la pestaña Actions si una publicación falla. Mantener `API_ORIGIN` configurada en el proyecto Pages para que `functions/api/[[path]].js` reenvíe las llamadas al Worker.

## Reporte de compras por cliente

En Historial, seleccionar cliente y fechas desde/hasta y pulsar **Ver resumen**. El reporte cuenta sólo despachos confirmados y respeta el alcance de lectura del usuario. Muestra cantidad de despachos, variedad de productos distintos, unidades y peso registrado total, con detalle por producto. El intervalo incluye ambos días según la fecha local argentina (UTC−03). Los kilos no registrados en despachos antiguos se señalan sin inventar un valor. La migración `0004_customer_contact_snapshot.sql` guarda domicilio y teléfono del cliente en cada despacho nuevo; para históricos anteriores copia los datos actuales del cliente una vez al aplicar la migración. Los comprobantes PDF y PNG muestran los datos disponibles.

## Productos, variedades y empaques

Administración → **Productos**: crear el producto base; **Variedades**: agregar sus tipos; **Empaques**: cargar cada presentación vendible, etiqueta de empaque y peso por unidad. En Despachar se elige cada empaque y se muestra su peso. Se pueden desactivar registros sin perder el historial. La migración `0005_varieties_packaging.sql` agrupa los 24 nombres iniciales conocidos y conserva los demás como productos anteriores editables; los despachos ya guardados mantienen sus nombres y pesos. El reporte por cliente cuenta variedades y presentaciones distintas. El workflow de GitHub aplica la migración automáticamente antes de desplegar el Worker y Pages. Para una instalación nueva, ejecutar `npm run seed:remote` después de aplicar las migraciones.

### Vendedores y transportistas

En **Administración → Vendedores / Transportistas** se mantienen fichas independientes de las cuentas de usuario. Al crear un despacho se pueden elegir ambas fichas; el despacho guarda sus identificadores y nombres históricos. Las casillas para mostrar sólo sus nombres en el PDF o PNG aparecen al abrir el despacho y empiezan desmarcadas. Los despachos anteriores permanecen sin vendedor comercial ni transportista. Ejecutar `npm run db:remote` antes de publicar el Worker para aplicar `0006_dispatch_people.sql`.
