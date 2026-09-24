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
