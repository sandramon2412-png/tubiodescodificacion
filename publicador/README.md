# Publicador multicanal (eBay · Poshmark · Depop)

Escribes el anuncio **una sola vez** (fotos, título, precio, talla…) y la app:

| Plataforma | Cómo publica | Por qué |
|---|---|---|
| **eBay** | **Automático**, con la API oficial (Sell Inventory API) | eBay ofrece API pública para vendedores |
| **Poshmark** | **Asistido**: textos ya adaptados, botón «Copiar», abre el formulario de Poshmark | Poshmark no tiene API pública; los bots que publican por ti incumplen sus condiciones y pueden cerrarte la cuenta |
| **Depop** | **Asistido**: descripción con hashtags (máx. 1000 caracteres y 5 hashtags) | Su API de venta solo está disponible para socios aprobados por Depop |

Además tiene dos pestañas más:

- **Inventario**: todos tus artículos con costo, precio, unidades, ubicación (caja/estante) y el estado en cada plataforma.
  Al marcar **Vendido**, descuenta la unidad, estima la comisión y, si era la última, **retira el anuncio de eBay automáticamente**
  y te recuerda borrar el de Poshmark/Depop para no venderlo dos veces.
- **Finanzas**: ingresos, comisiones, envíos, costo de lo vendido, otros gastos y **ganancia neta** (por mes, por plataforma y total),
  valor del inventario, registro de gastos y descarga en **CSV** (Excel / Google Sheets). Las comisiones son estimaciones editables.

Los datos se guardan en tu **Vercel Blob** (se ven igual desde el móvil y el ordenador) y se conservan las últimas 10 versiones como copia de seguridad.

## 1. Desplegar en Vercel

1. En [vercel.com/new](https://vercel.com/new) importa este repositorio.
2. En **Root Directory** elige `publicador`. Framework: **Other**. Deja el build vacío.
3. En **Environment Variables** añade como mínimo `APP_PASSWORD` (la contraseña de la app).
4. Pulsa **Deploy**. Tu app queda en `https://TU-APP.vercel.app`.

### Fotos e inventario
Vercel → tu proyecto → **Storage** → **Create → Blob** → conéctalo al proyecto. Eso crea `BLOB_READ_WRITE_TOKEN` solo. Haz **Redeploy**.
Sin esto no se pueden subir fotos ni guardar el inventario.
Las fotos se reducen a 1600 px en el móvil antes de subirse.

## 2. Conectar eBay

1. Crea una cuenta en [developer.ebay.com](https://developer.ebay.com) y en **Application Keys** genera claves (empieza por **Sandbox** para probar).
2. Copia `App ID` → `EBAY_CLIENT_ID` y `Cert ID` → `EBAY_CLIENT_SECRET`.
3. En **User Tokens → Get a Token from eBay via Your Application** añade una URL de redirección (RuName):
   - *Auth accepted URL*: `https://TU-APP.vercel.app/api/ebay/callback`
   - Copia el nombre del RuName → `EBAY_RUNAME`.
4. Pon `EBAY_ENV=sandbox` (o `production` cuando quieras publicar de verdad, con las claves de producción).
5. Redeploy, entra en la app y pulsa **Conectar eBay**. Acepta los permisos y copia el token que aparece en `EBAY_REFRESH_TOKEN`. Redeploy.
6. Activa las **Business policies** en Seller Hub (envío, pago, devoluciones) si no lo están.
7. En la app pulsa **Ver mis IDs de eBay**: te muestra los IDs de tus políticas y te deja crear la ubicación de envío. Copia
   `EBAY_FULFILLMENT_POLICY_ID`, `EBAY_PAYMENT_POLICY_ID`, `EBAY_RETURN_POLICY_ID` y `EBAY_MERCHANT_LOCATION_KEY`. Redeploy.

Cuando la etiqueta diga **eBay listo**, ya publica automáticamente. Todas las variables están en [`.env.example`](.env.example).

> Si eBay responde que falta una característica (p. ej. `Department` o `Type`), añádela en «Características extra» como `Department: Women`.

## 3. Uso diario
1. Sube fotos, rellena el artículo y busca la categoría de eBay (mejor en inglés: *women dress*).
2. Marca las plataformas y pulsa **Publicar**.
3. eBay se publica solo y te da el enlace. Para Poshmark y Depop pulsa **Copiar todo** → **Abrir formulario**, pega y sube las fotos, y luego **Marcar como publicado**.
4. El artículo queda en **Inventario**. Cuando lo vendas, pulsa **Vendido** y revisa la comisión y el envío.
5. Apunta en **Finanzas → Gastos** lo que no es mercancía (cajas, cinta, suscripciones…). La mercancía ya cuenta con el «costo» de cada artículo.

## Desarrollo
```bash
npm install
npm run check   # sintaxis + tests
npx vercel dev  # servidor local con las funciones /api
```

Estructura: `public/` (interfaz, sin build), `api/` (funciones serverless de Vercel: `data` = inventario/finanzas, `ebay/*`, `upload`), `lib/` (eBay, almacenamiento en Blob, contraseña), `tests/`.
