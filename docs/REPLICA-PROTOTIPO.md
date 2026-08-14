# Réplica del prototipo — dónde está todo y qué falta

El encargo: que ANDEX se vea **idéntico** a `Downloads/andex-prototipo`,
**sin romper lo que ya funciona**.

## La regla

Sólo apariencia. Ninguna regla de la capa visual cambia qué se puede pulsar,
en qué orden se lee, ni qué anuncia un lector de pantalla. Si al replicar una
pantalla hay que tocar lógica, es que se está haciendo mal.

## Nunca inventar un valor

Todos los números salen de **medir el prototipo renderizado**, no de mirar su
HTML ni de aproximar a ojo:

```bash
node scratchpad/extraer-diseno.mjs        # tokens: color, radio, blur, fuente
node scratchpad/anat2.mjs andex-boveda    # anatomía: qué hay, dónde, de qué tamaño
node scratchpad/comparar.mjs              # lado a lado contra lo construido
```

Los valores medidos están escritos en la cabecera de `app/motion.css`. Si uno
cambia, deja de ser idéntico.

## Hecho

| | |
|---|---|
| Superficie | `app/motion.css` — fondo, cristal, baldosas, chips, botones, tipografía |
| Fondo | `public/os/wallpaper.webp`, extraído del propio prototipo |
| Piezas de pantalla | `components/os/primitives.tsx` — cabecera, banner, chips, fila |
| Movimiento | Kinetics traducido a toque/foco/aparición (mismo archivo) |
| Iconos animados | `components/icons/` + `components/motion/animated-icon.tsx` |
| Inicio | `components/os/home-view.tsx` — es **`/panel` y `/inicio`** |
| Tus aplicaciones | `app/inicio/aplicaciones/page.tsx` |
| Todo el panel vestido | Por CSS, sin editar componentes |

## Lo siguiente: la Bóveda

`andex-boveda.html`, medido:

```
 52  20 286x41  Nav        atrás 40 · "Bóveda" 20/800 · acción 40 (buscar)
 78  72         Subtitle   "12 documentos guardados" 11.5/500 al 54%
107  20 286x80  Banner     baldosa 40 · "Todo está cifrado" 13.5/800
                           cuerpo 11.5/500 al 78%
201  20 286x31  Chips      activo blanco 700 · resto 54% en 500
246  20 286x64  Fila       baldosa 38 · título 13.5/700 · meta 11/500 · chevron 17
       CTA      "Añadir documento" — degradado, radio 17
```

Correspondencia con lo nuestro (**el copy y la lógica no se tocan**):

| Prototipo | Nuestro |
|---|---|
| Chips `Identidad / Formularios / Cartas` | `Todos / Vence pronto / Sin fecha` (`vault-format.ts`) |
| Acción de la cabecera | El buscador que ya existe (`.k-search` se abre al enfocar) |
| Meta `PDF · 2.4 MB · Hace 2 días` | `Vence en N días` — es nuestra información y es mejor |
| Banner "Todo está cifrado" | La tarjeta de privacidad que ya existe |
| CTA "Añadir documento" | "Escanear un documento" |

**Lo que NO se toca:** cifrado AES-GCM, IndexedDB, la cascada de detección del
escáner, `searchDocuments`, la fecha editable ni sus pruebas.

## Después

`andex-escaner`, `andex-asistente-ia`, `andex-x-legal`,
`andex-notificaciones`, `andex-ajustes`. Las cinco usan las mismas piezas de
`primitives.tsx`, así que es maquetar, no diseñar.

Y arrastrar para reordenar el inicio: el modelo ya lo soporta
(`intercambiar()` en `lib/os/home.ts`, con pruebas), falta sólo el gesto.

## Decisiones que se apartan del prototipo, y por qué

1. **La hora es real**, no las 9:41 congeladas. Una hora falsa encima de una
   hora real —la de la próxima clase— hace dudar de las dos.
2. **Lo que se ve de 33px se toca en 44.** El tamaño dibujado es el del
   prototipo; el área pulsable, no. Un objetivo de 33 falla con el pulgar.
3. **No se llama "Store"** sino "Tus aplicaciones". En un producto que ya
   cobra suscripción, esa palabra insinúa un segundo cobro.
4. **El carrusel es `scroll-snap` nativo**, no JS: inercia real, teclado y
   lector de pantalla gratis.

## Lo que la copia fiel se lleva consigo

Medido sobre el prototipo: **11 de 14 textos por debajo de WCAG AA** y letra
de 11px. Es decisión tomada del encargo, no un descuido. Si algún día se
quiere corregir sin perder el aspecto, se sube el gris del texto secundario y
se pasa de 11px a 14px; el resto del lenguaje no cambia.
