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
- **Ventas de eBay automáticas**: al abrir la app (o con el botón «Importar ventas de eBay») se traen tus pedidos pagados de eBay
  con la **comisión real** que cobró eBay. Se apuntan una sola vez; si el anuncio no estaba en tu inventario, se crea el artículo
  y te avisa para que añadas lo que te costó. El precio incluye el envío que pagó el comprador: anota en la venta lo que pagaste por la etiqueta.
- **Finanzas**: ingresos, comisiones, envíos, costo de lo vendido, otros gastos y **ganancia neta** (por mes, por plataforma y total),
  valor del inventario, registro de gastos y descarga en **CSV** (Excel / Google Sheets). Las comisiones son estimaciones editables.

- **Estudio con IA** (opcional):
  - **Fotos**: de tu primera foto crea tres presentaciones: **🪝 colgada en gancho** (p. ej. sobre una puerta de madera vieja),
    **👒 en el piso con accesorios** (vista desde arriba) y **💃 puesta en una modelo** (16 modelos a elegir). Además pone fondo nuevo a tus
    fotos reales, con sombra, luz que no cambia el color de la prenda y **sin arrugas**; las fotos de etiqueta o detalle se dejan tal cual.
    En modo **✨ Automático** la IA detecta el estilo de la prenda (boho, deportiva, urbana, elegante…) y elige escena y accesorios a juego;
    también puedes fijar un estilo (Boutique vintage, Bohemio, Deportivo, Urbano, Elegante, Floral, Blanco) o usar tu propio fondo.
    Si hay foto con accesorios, el anuncio aclara que no se incluyen.
  - **Textos**: mira las fotos (y la etiqueta) y escribe título con SEO (80 caracteres, palabras que más se buscan primero), descripción,
    marca, talla, material, condición, palabras clave/hashtags, características de eBay, categoría y **precio sugerido** con
    referencia de anuncios parecidos en eBay. Te dice qué revisar (medidas, etiqueta ilegible…). En inglés o español.
  - **Lote**: eliges todas las fotos de golpe, la app las agrupa por artículo (por la hora en que las tomaste) y procesa todo.
    Cada artículo queda como **Borrador** en Inventario para revisarlo y publicarlo.

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

### Estudio con IA (opcional)
1. **Textos**: crea una clave en [platform.claude.com](https://platform.claude.com) → API Keys y ponla en `ANTHROPIC_API_KEY`.
   Cada anuncio cuesta unos céntimos.
2. **Fotos**: contrata el plan **Plus** de la [API de Photoroom](https://www.photoroom.com/api) (el Basic no incluye fondos con IA)
   y pon la clave en `PHOTOROOM_API_KEY`. Cada foto editada gasta un crédito; mira sus precios actuales en su web.
   Para probar gratis, usa su clave de **sandbox** (empieza por `sandbox_`): funciona igual pero con marca de agua.
3. Redeploy.

> **Importante:** las fotos en gancho, en el piso y en modelo las genera la IA. Revisa siempre que la prenda se vea igual que la real
> (color, estampado, largo, botones) y deja al menos una foto real en el anuncio: así evitas devoluciones por «no es como en la foto».

Consejos para mejores resultados: fotografía la prenda entera sobre una superficie lisa con buena luz, y añade **una foto de la etiqueta**
(marca, talla, material). Para eBay, la primera foto en **Blanco limpio** suele funcionar mejor en las búsquedas.

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

> **¿Conectaste eBay antes de que existiera la importación de ventas?** Pulsa **Reconectar eBay** y sustituye `EBAY_REFRESH_TOKEN`
> por el nuevo (incluye el permiso de solo lectura de pedidos). Mientras tanto, publicar sigue funcionando.

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

Estructura: `public/` (interfaz, sin build), `api/` (funciones serverless de Vercel: `data` = inventario/finanzas, `ebay/*`, `ai/describe`, `photo/edit`, `upload`), `lib/` (eBay, Claude, Photoroom, almacenamiento en Blob, contraseña), `tests/`.
