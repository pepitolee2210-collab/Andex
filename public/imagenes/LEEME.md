# Imágenes de la landing

Deja aquí los archivos con **el nombre exacto** de la tabla. La página los
detecta sola: no hay que tocar código ni declararlos en ninguna parte. El
catálogo vive en `lib/landing-images.ts`.

**Cuántas dejes decide qué se monta:**

| Archivos presentes | Qué sale |
|---|---|
| ninguno | la sección se compone sin imagen, y queda bien igual |
| uno | imagen fija |
| dos o más | carrusel, con avance cada 5 s y sus frenos |

Los frenos del carrusel no son opcionales: se para al tocar y vuelve tras
10 s de quietud, se para con la pestaña en segundo plano, y con
`prefers-reduced-motion` no existe.

## Los archivos

| Archivo | Dónde sale | Proporción | Medida |
|---|---|---|---|
| `fundador.jpg` | La historia del fundador (S4) | **4:5** vertical | 1000 × 1250 |
| `ingles-1.jpg` · `ingles-2.jpg` · `ingles-3.jpg` | Inglés en vivo (S6) | **3:2** apaisada | 1500 × 1000 |
| `comunidad-1.jpg` … `comunidad-5.jpg` | Respaldo (S3) | **3:1** panorámica | 1500 × 500 |

Las de un mismo conjunto **tienen que compartir proporción**. Un carrusel
cuyas imágenes miden distinto salta de altura en cada paso, y ese salto
empuja media página hacia abajo cada cinco segundos.

> Las nueve están puestas. Se recodificaron a JPEG de calidad 0.86 al
> entrarlas: el retrato llegaba en PNG de 2,6 MB y el conjunto pesaba 4,4 MB.
> Ahora suma 1,5 MB y ninguna pasa de 300 KB.

---

## Los prompts

Para ChatGPT Imagen 2 o Nano Banana 2. Funcionan igual en español que en
inglés.

Tres cosas van en todos a propósito:

- **La paleta del producto** — navy `#102A43`, teal `#12B8A6`, crema
  `#F7F5EF`. Sin esto salen con el azul-violeta de fábrica de los modelos y
  la landing parece un collage de dos marcas distintas.
- **Luz natural, sin retoque** — es lo que separa una foto de una postal de
  banco de imágenes. Este público reconoce la foto de archivo al instante, y
  la foto de archivo dice «esto no es real».
- **Nada de texto dentro de la imagen.** Los modelos lo escriben mal y el
  cartel deformado del fondo es lo primero que delata que es generada.

---

### `fundador.jpg` — el retrato · 4:5

> ⚠️ **Que sea una foto real de Henry.** La sección entera dice «yo pasé por
> esto». Una cara generada presentada como la de una persona real es
> exactamente lo que este producto se niega a hacer en el copy: no se
> inventan reseñas, ni contadores, ni cifras de uso. Un rostro inventado
> pesa más que un número inventado, y con este público —al que ya le
> vendieron confianza fabricada— es lo que, si se descubre, se lleva por
> delante todo lo demás.
>
> El prompt sirve para **dirigir y encuadrar la foto real**: pásaselo a
> quien la haga, o úsalo para ajustar fondo y luz de una que ya exista. No
> para inventar la cara.

```
Retrato editorial vertical 4:5 de un hombre hispano de unos 45 años, padre de
familia, mirando a cámara con expresión serena y directa. Camisa lisa en azul
marino profundo (#102A43), sin logotipos. Fondo interior desenfocado de una
oficina pequeña y real —una estantería, una ventana— en tonos crema (#F7F5EF)
con un toque de verde azulado (#12B8A6) fuera de foco. Luz natural lateral de
ventana, suave, sombras presentes y no rellenadas. Lente de 50 mm, f/2.0,
profundidad de campo corta. Sin retoque de piel, sin viñeteado, sin contraste
exagerado. Sin texto en la imagen. Fotografía documental de prensa, no de
banco de imágenes corporativo.
```

---

### `ingles-1/2/3.jpg` — el inglés · 3:2

**Todo ocurre DENTRO de la app.** No hay aula, ni pizarra, ni profesor
delante de una clase: el producto es digital y la imagen no puede prometer
un sitio físico al que nadie va a ir. Las tres se sostienen sobre lo mismo —
una persona, su teléfono y la app— y cambian el momento.

**1 · La sesión en vivo**

```
Fotografía apaisada 3:2, plano cenital cercano: unas manos hispanas sostienen
un teléfono en el que se ve una videollamada en cuadrícula con varias
personas, la interfaz en azul marino profundo (#102A43) con acentos en verde
azulado (#12B8A6). Alrededor, sobre una mesa de madera clara, un cuaderno
abierto y una taza. Interior doméstico, luz de tarde de ventana. Paleta crema
(#F7F5EF) y madera. Lente de 35 mm, f/2.8. Sin texto legible en la pantalla
ni en el cuaderno. Sin caras reconocibles. Realista, sin apariencia de render
3D ni de ilustración.
```

**2 · El simulador de entrevista**

```
Fotografía apaisada 3:2 de una mujer hispana de unos 35 años sentada frente a
un teléfono apoyado en un soporte, hablando hacia él con gesto concentrado,
como en una entrevista de trabajo. La pantalla del teléfono muestra una
interfaz de aplicación en azul marino profundo (#102A43) con un botón en
verde azulado (#12B8A6). Interior doméstico sencillo, luz natural suave de
ventana lateral. Paleta crema (#F7F5EF). Encuadre de tres cuartos, ella
ligeramente descentrada. Lente de 35 mm, f/2.5. Sin texto legible. Sin
logotipos. Fotografía real, no ilustración.
```

**3 · Practicando**

```
Fotografía apaisada 3:2 de un hombre hispano joven con auriculares, sentado
en el sofá de su casa, mirando el teléfono y repitiendo en voz alta mientras
anota algo en una libreta apoyada en la rodilla. Luz cálida de última hora de
la tarde entrando por la ventana. Paleta crema (#F7F5EF) y tonos tierra, con
un acento en verde azulado (#12B8A6) en la funda del teléfono. Lente de 35 mm,
f/2.0, profundidad de campo corta. Sin texto legible en la pantalla. Ambiente
cotidiano y real, no publicitario.
```

---

### `comunidad-1..5.jpg` — la comunidad · 3:1

Panorámicas muy bajas: en la página ocupan una franja, no un cuadro. Compón
sabiendo que **se recortan arriba y abajo** — todo lo importante, en la
franja central.

**Cinco, y la mezcla es deliberada: tres presenciales y dos digitales.** La
comunidad de ANDEX es las dos cosas —la feria del sábado y el grupo que sigue
hablando el martes por la noche—, y enseñar sólo la presencial dejaría fuera
lo único que un miembro usa todos los días. Al revés, sólo pantallas, y
parecería otra red social más.

Las dos digitales tienen una dificultad propia: **un teléfono no es
panorámico**. Están compuestas como escenas anchas con el aparato en el
centro y aire a los lados, no como capturas de pantalla estiradas.

**1 · El encuentro**

```
Fotografía panorámica 3:1, muy apaisada, de un grupo de familias hispanas
conversando en un encuentro comunitario al aire libre en Utah: adultos y
niños de espaldas o de perfil, con montañas secas al fondo bajo un cielo
despejado. Luz dorada de última hora de la tarde. Paleta tierra y crema
(#F7F5EF) con detalles en verde azulado (#12B8A6) en la ropa. Acción
centrada en la franja media, aire arriba y abajo para que el recorte no corte
nada. Lente de 35 mm. Sin caras en primer plano reconocibles, sin logotipos,
sin texto. Fotografía documental real.
```

**2 · La feria de ayuda**

```
Fotografía panorámica 3:1 de una feria de ayuda comunitaria al aire libre:
carpas blancas sencillas en fila, familias hispanas haciendo cola y hablando
con voluntarios, mesas con folletos. Día claro, luz natural difusa, montañas
de Utah desenfocadas al fondo. Paleta crema (#F7F5EF) y tierra, con acentos
en verde azulado (#12B8A6). Composición horizontal muy ancha, la acción en la
franja central. Lente de 35 mm. Sin texto legible en carteles ni folletos, sin
logotipos, sin caras en primer plano. Fotografía documental real.
```

**3 · El barrio**

```
Fotografía panorámica 3:1 de vecinos hispanos compartiendo comida en una
reunión de barrio: una mesa larga al aire libre, platos caseros, manos
sirviendo, gente de pie conversando alrededor. Última hora de la tarde, luz
cálida y rasante. Paleta tierra y crema (#F7F5EF), un acento en verde
azulado (#12B8A6). Encuadre muy apaisado con la mesa cruzando la franja
central. Lente de 35 mm, f/2.8. Sin caras en primer plano reconocibles, sin
logotipos, sin texto. Fotografía documental real, no ilustración.
```

**4 · El muro de la comunidad, en la app** *(digital)*

```
Fotografía panorámica 3:1, muy apaisada, tomada desde arriba de una mesa de
madera clara: en el centro, un teléfono sostenido por unas manos hispanas
muestra el muro de una comunidad —tarjetas apiladas con mensajes y avatares
circulares—, la interfaz en azul marino profundo (#102A43) con acentos en
verde azulado (#12B8A6). A los lados de la mesa, desenfocados, una taza, unas
llaves y un cuaderno cerrado, dejando aire a izquierda y derecha. Luz natural
suave de ventana. Paleta crema (#F7F5EF) y madera. Lente de 35 mm, f/2.8. Sin
texto legible en la pantalla, sin caras reconocibles en los avatares. Realista,
no render 3D ni ilustración.
```

**5 · Un taller en vivo, en familia** *(digital)*

```
Fotografía panorámica 3:1 del salón de una casa: una familia hispana —dos
adultos y dos adolescentes— sentados juntos en el sofá, de perfil y de
espaldas, mirando una tablet apoyada en la mesa baja que reproduce un taller
en vivo con varias personas en cuadrícula. La interfaz, en azul marino
profundo (#102A43) con verde azulado (#12B8A6). Última hora de la tarde, luz
cálida de lámpara y ventana. Paleta crema (#F7F5EF) y tonos tierra.
Composición muy ancha, la familia y la tablet en la franja central, aire
arriba y abajo. Lente de 35 mm, f/2.5. Sin texto legible, sin caras en primer
plano reconocibles. Fotografía doméstica real, no publicitaria.
```

---

## Peso

Comprime antes de dejarlas aquí. El público objetivo usa Android de gama
media con datos contados, y ahora son **nueve** imágenes: por encima de unos
**300 KB cada una**, la landing empieza a costar dinero de verdad a quien la
abre. `squoosh.app` sirve, o cualquier compresor de JPEG a calidad 75–80.
