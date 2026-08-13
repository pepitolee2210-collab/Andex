# Evidencia — qué hace que una foto parezca un escaneo

Consultado el 2026-08-10. No hizo falta desensamblar ninguna app: Dropbox
publicó su tubería completa en dos artículos de ingeniería, y ahí está el
detalle que nos faltaba.

Fuentes:

- **A** · Dropbox Engineering, *Fast Document Rectification and Enhancement*
  — https://dropbox.tech/machine-learning/fast-document-rectification-and-enhancement
- **A** · Dropbox Engineering, *Fast and Accurate Document Detection for Scanning*
  — https://dropbox.tech/machine-learning/fast-and-accurate-document-detection-for-scanning
- **B** · `marquaye/scanic`, MIT — https://github.com/marquaye/scanic

---

## El fallo: nuestra corrección es multiplicativa, y tiene que ser afín

`process.ts` corrige la iluminación con **sólo ganancia**:

```ts
const gain = Math.min(3, 235 / Math.max(mean[i], 1));
const v = data[o + ch] * gain;
```

Dropbox plantea el realce como un problema de optimización —minimizar
`k₁·Σ‖J−255‖² + k₂·Σ‖∇J−∇I‖²`, resuelto con la ecuación de Poisson— pero lo
que aplican en la práctica es una transformación **de ganancia Y desplazamiento
(gain and offset)** que varía suavemente por la imagen [A].

Y ahí está el problema de fondo, que es de matemáticas, no de ajuste fino:

> Multiplicar aclara el papel **y la tinta a la vez**. Con ganancia sola no se
> puede llevar el fondo a blanco sin llevarse por delante el negro del texto.

Por eso el resultado parece una foto aclarada y no un escaneo: le falta el
término que baja los oscuros mientras sube los claros. Con ganancia + offset se
resuelven dos ecuaciones por píxel —fondo→255, tinta→se queda— en vez de una.

## Tres detalles más del mismo artículo

**Resolver en baja resolución y luego escalar.** Dropbox calcula la ganancia y
el offset a resolución reducida y los sube, *"significantly reducing
computational cost"* [A]. Nosotros calculamos la media local a resolución
completa. Además de costar más, una corrección a resolución completa produce
halos alrededor del texto; a baja resolución el campo sale suave, que es lo
que se quiere: la iluminación varía despacio, el texto no.

**El color se arregla en HSV, no en RGB.** Convierten a HSV y copian tono y
saturación del original *"to prevent color shifts"* [A]. Nosotros aplicamos una
ganancia calculada sobre el GRIS a los tres canales por igual, así que el
tinte cálido de la bombilla sobrevive: el papel queda crema en vez de blanco.
Corrigiendo sólo el valor y respetando tono y saturación, el papel va a blanco
y el sello azul sigue azul — que en este producto es prueba documental (D54).

**La resolución de salida sale de la foto, no de una constante.** Dropbox
*"count[s] the number of pixels within the quadrilateral in the input image,
and set[s] the output resolution as to match this pixel count"* [A]. Nosotros
tenemos `DEFAULT_MAX_SIDE = 2200`, que en tamaño Carta son unos 200 DPI:
tirando resolución de una cámara de 12 MP y quedándonos por debajo de los
300 DPI que pide un OCR decente.

## Sobre la detección de bordes

Hoy usamos Sobel + Hough sobre una miniatura de 320 px (D55). Falla en el caso
clásico: papel blanco sobre mesa clara, donde no hay gradiente que encontrar.

**Scanic** [B] es la alternativa que no existía cuando se decidió D55: Rust
compilado a WebAssembly, **menos de 100 KB gzip**, sin OpenCV, con Canny +
desenfoque gaussiano + dilatación, y un detector neuronal opcional
(DocCornerNet) que sólo descarga sus ~3,4 MB si se pide. Licencia MIT.

Eso reabre D55 —que rechazaba OpenCV.js por sus 8–11 MB— sin contradecirlo: el
motivo del rechazo era el peso, y aquí no lo hay.

⚠️ **Pero 53 estrellas y 8 forks.** Para una app que maneja permisos de
trabajo, meter una dependencia de un solo mantenedor en el camino crítico es
una decisión de riesgo, no sólo técnica. Si entra, que sea detrás de la
interfaz que ya tenemos (`detectDocument`), de forma que se pueda quitar en una
línea.

## Y lo que Dropbox decidió NO hacer

> *"relies on a series of well-studied fundamental components, rather than the
> 'black box' of machine learning algorithms such as DNNs. The advantages of
> this approach are that it is easier to understand and debug, needs much less
> labeled training data, runs very fast and uses less memory at run time"* [B]

Con una red neuronal midieron que sus detecciones son *"60% less likely to be
manually corrected by users than those found by Apple's API"* — sin red. Es un
argumento fuerte para arreglar primero la tubería clásica antes de traerse un
modelo.

---

## Orden de trabajo que sale de esto

1. **Ganancia + offset, en HSV, resuelto en baja resolución.** Es el cambio que
   explica la queja "esto no parece un escáner". Sin dependencias nuevas.
2. **Resolución de salida según los píxeles del cuadrilátero**, con tope por
   memoria, no por una constante arbitraria.
3. **Enfoque (máscara de desenfoque)**: el remuestreo bilineal ablanda, y un
   escaneo se ve nítido.
4. **Detección**: probar Scanic detrás de `detectDocument`, midiendo contra
   nuestro Sobel+Hough antes de sustituir nada.
5. **OCR**: no evaluado todavía. Sería lo que permitiría buscar DENTRO de los
   documentos y leer la fecha de vencimiento sola —que alimenta la única
   promesa del módulo que hoy no se cumple— pero pesa y hay que medirlo.

---

## Lo que costó, y el error del que salió la lección

**Primer intento: peor que antes.** Estimé el nivel del papel Y el de la tinta
por celda de una rejilla. Resultado medido en pantalla: parches rectangulares
visibles alrededor de cada bloque de texto, y el sello azul convertido en negro
—justo lo que D54 prohíbe—.

Dos causas, las dos instructivas:

1. **La tinta no se puede estimar localmente.** Una celda con texto y su vecina
   sin él dan transformaciones distintas, y la costura entre ambas se ve. La
   iluminación varía despacio; el contenido no. Sólo el papel admite estimación
   local; el punto negro tiene que ser global.
2. **Estirar hasta el negro aplasta el color.** Llevar la tinta a 0 exacto
   convierte el azul del sello en negro. Hay que dejar margen (se estira contra
   el 92 % del punto negro, no contra él).

**Segundo problema, de memoria y no de CPU.** Guardar la imagen normalizada
entera en un `Float32Array(count * 3)` son, a 300 ppp, unos **174 MB** en un
solo búfer. En el Android de gama baja del público objetivo eso no es lentitud:
es quedarse sin memoria a mitad del escaneo. Se calcula al vuelo y no se guarda.

## Medido

Con la CPU frenada 4× (aproximación a un Android de gama baja) y una foto de
12 MP, el recorrido completo —detectar bordes, enderezar, realzar, revisar y
generar el PDF— tarda **3,4 s**.

## Lo que sigue pendiente

Los puntos 4 y 5 del plan de arriba: probar Scanic contra nuestro Sobel+Hough
antes de sustituir nada, y evaluar el OCR.

---

# Segunda ronda: sustituir la detección por una medida, no por una opinión

Fecha: 2026-08-12. La pregunta del dueño fue directa —*"quiero un sistema que
haga lo que hace un escáner de verdad, ¿existe la tecnología?"*— y la
respuesta corta es **sí**. Pero antes de traerla hubo que construir con qué
compararla.

## 1. Primero, una vara de medir

`lib/scanner/fixtures.ts` genera fotos sintéticas de un documento en las
condiciones que de verdad arruinan un escaneo: mesa clara, sombra de la mano,
penumbra con ruido, reflejo de lámpara, veta de madera, perspectiva fuerte.

La clave es que **las esquinas verdaderas las dibujamos nosotros**, así que el
error se mide en píxeles. De una foto real no se conocen, y sin eso "el
detector mejoró" es una opinión.

## 2. Lo que medía nuestro detector

| caso | error | veredicto |
|---|---|---|
| fácil | 0,2 % | bien |
| inclinado | 0,2 % | bien |
| **claro sobre claro** | **23,1 %** | **recorte falso** |
| madera | 0,2 % | bien |
| **sombra de la mano** | **17,9 %** | **recorte falso** |
| penumbra | 0,3 % | bien |
| reflejo | 0,2 % | bien |
| degradado | 0,3 % | bien |

Los dos malos no se rendían: entregaban un recorte equivocado con toda
seguridad, que es peor, porque la persona lo acepta sin mirar.

Las causas, ambas de fondo y no de ajuste:

- **Claro sobre claro.** El texto del documento tiene ~23 veces más contraste
  que el borde del papel, así que el umbral por percentil se calibraba con el
  texto y Hough encontraba el bloque de texto, no la hoja.
- **Sombra.** Una sombra multiplica la luz, así que el mismo borde salta 210
  niveles a plena luz y 73 bajo la mano. Hough veía media hoja.

## 3. Dos arreglos que sí funcionaron

**Escala logarítmica.** Un factor multiplicativo se vuelve una suma constante:

    log(253) − log(43) = 1,77     (borde iluminado)
    log(88)  − log(15) = 1,77     (mismo borde, en sombra)

El caso de la sombra pasó de **17,9 % a 0,9 %**.

**Desenfoque antes del gradiente.** Sobre la miniatura de 320 px una línea de
texto mide 3–4 px y desaparece; el borde del papel es una frontera larga y
sobrevive. El caso de mesa clara dejó de inventar y pasó a rendirse — no es
acertar, pero es la respuesta correcta cuando no se sabe.

## 4. Un intento que EMPEORÓ, anotado para que no se repita

Se probó a puntuar todos los cuadriláteros candidatos por área, con el
razonamiento de que "el papel es lo que encierra más superficie y un bloque de
texto siempre cabe dentro". Suena obvio y está mal: el candidato de mayor área
acaba siendo ruido del borde de la foto. **De 7 casos correctos bajó a 6.**
Revertido, con el motivo escrito en `detect-sobel.ts`.

## 5. La comparativa contra Scanic

Medido en un navegador real, sobre los mismos ocho casos:

| caso | nuestro | Scanic clásico | Scanic neuronal |
|---|---|---|---|
| fácil | 0,8 % | **0,3 %** | se rinde |
| inclinado | se rinde | **0,3 %** | 0,6 % |
| claro sobre claro | se rinde | **43,3 %** ✗ | **0,8 %** ✓ |
| madera | **0,2 %** | 0,6 % | 0,7 % |
| sombra de la mano | 1,0 % | **0,6 %** | 0,6 % |
| penumbra | 1,0 % | **0,6 %** | 0,8 % |
| reflejo | 0,8 % | **0,4 %** | se rinde |
| degradado | 1,0 % | **0,6 %** | 0,6 % |

Scanic clásico gana 6 a 2 y va al doble de velocidad. Pero **falla justo en el
caso peligroso**, y sin rendirse.

## 6. El dato que hizo posible la solución

El detector clásico **avisa cuando duda**. Su confianza separa limpiamente:

    aciertos → 0,91 – 0,93          el recorte falso → 0,64

Con ese hueco, la cascada se escribe sola: clásico primero, y si baja de 0,80
se consulta al neuronal — que resuelve ese caso exacto en 16 ms.

## 7. Resultado

    caso                 cascada
    ────────────────────────────────
    fácil                0,3 %    62 ms
    inclinado            0,3 %    25 ms
    claro sobre claro    0,8 %   366 ms   ← el único que descarga el modelo
    madera               0,6 %    90 ms
    sombra de la mano    0,6 %    28 ms
    penumbra             0,6 %    34 ms
    reflejo              0,4 %    30 ms
    degradado            0,6 %    34 ms
    ────────────────────────────────
    aciertos: 8/8

## 8. Lo que hay que saber de la dependencia

`scanic` es MIT, Rust compilado a WebAssembly, y su modelo neuronal
(DocCornerNet, también MIT) pesa ~1,9 MB y **sólo se descarga cuando el
clásico duda**. El paquete entero viaja en el chunk del escáner, que ya se
carga en diferido.

⚠️ **Un solo mantenedor.** Para una app que maneja permisos de trabajo, eso es
una decisión de riesgo y no sólo técnica. Mitigación aplicada: vive detrás de
`detectDocument`, y si el paquete no carga se cae a nuestro detector propio —
que sigue en el repo, probado, y saca 7 de los 8 casos. La detección degrada,
no desaparece.

## 9. Lo que sigue sin hacerse

- **Probar con fotos reales.** Las sintéticas atrapan regresiones; no imitan
  las aberraciones de un sensor de verdad.
- **OCR.** Sería lo que permitiría leer la fecha de vencimiento sola — que
  alimenta la única promesa del módulo que hoy no se cumple— y buscar dentro
  de los documentos. Sin evaluar todavía.
