# ANDEX — lo que existe hoy, pantalla por pantalla

Inventario del producto **real**, hecho recorriéndolo en el navegador y
leyendo el código. Sirve para corregir lo que se asumió y para diseñar sobre
lo que hay, no sobre lo que parecía haber.

Las 35 capturas están en `scratchpad/inventario/`, numeradas en el orden del
recorrido.

---

## 1 · La escala, para dimensionar

| | |
|---|---|
| Archivos `.ts` / `.tsx` | 224 |
| Líneas de código | 42.455 |
| Pruebas automáticas | 214, en 13 archivos |
| Tablas en la base de datos | 27, con 39 políticas de aislamiento y 29 índices |
| Módulos vivos | **3 de 7** |

Dónde está el peso real:

```
i18n (los dos idiomas)      5.365 líneas
landing                     5.326
bóveda (componentes)        4.467
panel                       3.733
escáner                     2.329
entrevista                  1.847
```

Dos lecturas de esa tabla:

- **La landing pesa casi tanto como la bóveda.** Se ha invertido tanto en
  vender el producto como en su función central.
- **El 13% del código es traducción.** Cada pantalla nueva cuesta el doble,
  porque nace en dos idiomas.

---

## 2 · Cómo está construido, y por qué le importa al diseño

**Los documentos nunca salen del teléfono.** Se cifran con AES-GCM, la clave
se deriva con PBKDF2 y se guardan en IndexedDB. El servidor no puede verlos
aunque quisiera. Consecuencia de diseño: **no hay sincronización entre
dispositivos, y hay que decirlo** — si pierde el teléfono, pierde la bóveda.

**El escáner es una cascada de tres niveles** que corre en el navegador:
detector clásico → red neuronal si la confianza baja de 0.8 → detector
propio como red de seguridad. Medido: acierta 8 de 8 contra un banco de
fotos con esquinas conocidas.

**Hay un motor de recomendación** (31 pruebas) que ordena los siete módulos
según el perfil. Es un módulo puro: no devuelve texto, devuelve códigos de
razón que el diccionario convierte en frase. Por eso el panel puede decir
*«porque dijiste que quieres resolver tus trámites migratorios»*.

**Hay un contrato de datos con 18 métodos** y dos implementaciones:
`localStorage` y Supabase. **Ahora mismo corre en modo demo** — el esquema de
27 tablas está aplicado en Supabase, pero la aplicación no está conectada a
él.

---

## 3 · Pantalla por pantalla

### Landing — 13.431px de alto
Dieciséis pantallas de teléfono. Contiene: hero · propósito · **escáner
gratis sin registro** · los siete módulos · rueda de módulos · recorrido en
teléfono · servicios · confianza · comparativa · precios · preguntas
frecuentes · cierre · pie. Más una barra fija de llamada a la acción en
móvil.

Y una bifurcación que atraviesa todo el producto: **ya estoy en EE. UU.** o
**todavía en mi país**. Cambia el orden de los módulos, el copy y los
enlaces externos.

### Registro
Tres campos —nombre, correo, contraseña— y la aceptación de términos.

### Entrevista — cinco pasos
1. Lo básico · 2. **¿Dónde estás ahora?** (la bifurcación) · 3. ¿En qué
momento de tu camino estás? · 4. ¿Qué te interesa resolver? · 5. ¿Qué
quieres resolver primero?

Cada paso muestra «Paso N de 5». El estado se guarda: se puede salir y
volver.

### Membresía y pago
Dos planes ($14/mes o $140/año). El pago es **simulado**: Stripe no está
provisionado.

### Panel — 3.071px
Saludo · el objetivo de estos 30 días (editable) · **una tarjeta de
recomendación** con su porqué y la opción «no es lo que busco» · «también te
puede servir» · la rejilla de los siete módulos.

### Bóveda — la pantalla más completa del producto
Contiene, en este orden:

1. Cabecera con icono, título y subtítulo
2. **«Escanear un documento»** a ancho completo — siempre visible
3. **Tarjeta de privacidad plegable** — abierta la primera vez, plegada
   después
4. **«Se te vence pronto»** — tarjeta ámbar con la promesa literal: *«Te
   avisamos 90, 60, 30 y 7 días antes. Ninguna fecha se te va a pasar.»* y
   debajo el documento urgente
5. **Buscador** — atraviesa carpetas, tolera acentos
6. **Filtros con contador**: `Todos` · `Vence pronto 1` · `Sin fecha 1`
7. **Rejilla de carpetas**, cada una con su cuenta
8. **Sección por carpeta**, con nombre y pista de qué va dentro
9. **Tarjeta por documento**: nombre · nº de páginas · estado de
   vencimiento con icono · y **cuatro acciones**: Abrir · editar · mover ·
   borrar
10. **«Consultar mi caso oficial»** — sección entera con el aviso de no
    afiliación y cuatro destinos: **Estado de mi caso (USCIS)** · **Mi cita
    en la corte (EOIR)** · **Mi registro de entrada (I-94)** · **Cita para
    la licencia de manejo**

**Las cinco carpetas, con sus nombres reales:**

| Id | Nombre visible | Qué guarda |
|---|---|---|
| `identity` | **Identificación** | Pasaporte, matrícula consular, acta de nacimiento |
| `immigration` | **Estatus migratorio** | Permiso de trabajo, I-94, citas de corte, recibos de USCIS |
| `driving` | **Manejo y vehículo** | Licencia, registro del auto, seguro |
| `taxes` | **Impuestos** | |
| `housing` | **Vivienda y estudios** | |

### Escáner — seis pasos
Abrir → **detectar esquinas** (ajustables a mano) → enderezar perspectiva →
corregir color y blanquear → generar PDF → nombrar, elegir carpeta y poner
fecha de vencimiento.

Al terminar hay una pantalla de entrega con **descargar** y **compartir**
(Web Share API, para que el PDF salga por WhatsApp).

### Academia — 3.303px, y 6.542px con un temario abierto
Nueve temarios. **Seis por oficio** y **tres transversales**, y los
transversales van **primero** por decisión de producto: nadie sabe que
necesita saber qué hacer cuando no le pagan.

| Transversales | Por oficio |
|---|---|
| Pago y derechos | Limpieza |
| Seguridad | Restaurante |
| Primeros meses | Cuidado de niños |
| | Jardinería |
| | **Cuidado en casa** |
| | Construcción |

Cada temario, al abrirse, muestra las frases agrupadas **por momento** —la
entrevista, el primer día, cuando algo sale mal—, cada una en tres líneas
(inglés · pronunciación escrita · español) con botón de escuchar. Antes de
las frases va un bloque **«lo que hay que saber»** con cada dato citado a su
fuente y enlazado. Y al final, **descarga del manual en PDF**.

Además: la **clase en vivo** con su horario y su puerta.

### Comunidad
Los talleres, martes a viernes, convertidos **a la hora de quien mira**, con
el aviso cuando la sesión cae otro día. La puerta tiene cuatro estados y
**nunca enseña un botón de entrar sin sala abierta**.

### Inversiones
Cuatro negocios para arrancar (desde $300, $500, $800 y $1.500) y **Fondos
de inversión, hasta 3–4% mensual desde $100**. Cada uno cierra en WhatsApp
con el mensaje ya escrito.

### Perfil — 4.148px, la segunda más larga
Datos, idioma, tema, suscripción, y **borrar mis datos**.

### Módulo en construcción — *lo que más se malinterpretó*
Los cuatro módulos aún no abiertos **no son un callejón sin salida**. Cada
uno tiene una pantalla real con:

- Insignia **«En construcción»** y *«Este módulo todavía no está abierto.
  Falta poco.»*
- **«Lo que vas a poder hacer aquí»** — cuatro promesas concretas
- **«¿Qué es lo primero que necesitas de este módulo?»** — campo libre de
  240 caracteres y botón **«Avísame cuando esté listo»**

Es captación de demanda: se guarda como señal de interés y alimenta el
motor de recomendación.

### Administración
Generar las próximas sesiones de talleres y pegar el enlace de Zoom de cada
una. **Rechaza dominios que imitan a `zoom.us`.**

---

## 4 · Correcciones a lo que se asumió

| Se dibujó | Es en realidad |
|---|---|
| Carpetas: Identidad · Migración · Conducir · Vivienda | **Identificación · Estatus migratorio · Manejo y vehículo · Vivienda y estudios** |
| Módulos en construcción, navegables | Pantalla propia de captación de demanda |
| Oficio «Bodega» | No existe. El sexto es **«Cuidado en casa»** |
| «Nueve temarios por oficio» | **Seis por oficio + tres transversales**, y los transversales van primero |
| Pago vencido: 14 días de gracia | **7 días** |
| Documento con chevron | **Cuatro acciones**: abrir, editar, mover, borrar |
| «Consultar mi caso» = dos filas en el detalle | **Sección entera en la bóveda**, con cuatro destinos oficiales |
| Filtros sin contador | **Con contador**: «Vence pronto 1» |
| Academia = Inglés + Certificaciones | **Sólo Inglés existe.** Certificaciones es especificación |
| Comunidad = Talleres + Eventos + Directorio | **Sólo Talleres existe** |
| Empleo con vacantes reales | **No existe pantalla.** Sólo el motor de coincidencia |
| Finanzas con simulador | **No existe** |
| Perfil con exportar y historial de pagos | **No existen** |

---

## 5 · Lo que se promete y no está construido

Esto importa para el diseño porque **son promesas ya visibles en la
interfaz**:

1. **Los avisos de 90/60/30/7 días.** La bóveda lo dice con todas las
   letras —*«Ninguna fecha se te va a pasar»*— y **no hay nada detrás**: ni
   trabajo programado, ni ruta de notificación, ni cron. Es la promesa
   central del producto.
2. **`/terminos`, `/privacidad` y `/contacto` dan 404** estando enlazadas
   desde el pie y desde el registro.
3. **Stripe no está provisionado.** El pago es simulado.
4. **La aplicación corre en modo demo**: todo en `localStorage`. El esquema
   de 27 tablas existe en Supabase pero no está conectado.
5. **Las traducciones al inglés las escribió un modelo** y no han pasado
   revisión humana bilingüe.

---

## 6 · Qué hace falta diseñar

**Estados que existen en el producto y no se han dibujado:**

- La bóveda **cargando** mientras descifra
- El escáner **sin permiso de cámara**
- El escáner **cuando no encuentra el documento** («el recorte quedó muy
  pequeño o torcido; mueve las esquinas»)
- **Sin conexión**
- **El teléfono sin espacio** — la bóveda avisa por debajo del 15%
- Un documento con **nombre larguísimo**
- La bóveda con **cien documentos**

**Componentes que existen y no están en el kit:**

- La tarjeta de documento con sus cuatro acciones
- La sección «Consultar mi caso oficial» con su aviso
- La pantalla de módulo en construcción con captación de demanda
- Los filtros con contador
- La rejilla de carpetas con cuenta
- El bloque «lo que hay que saber» con fuente citada y enlace
- La tarjeta de recomendación del panel, con su porqué y su «no es lo que
  busco»

**Y una restricción que sigue en pie:** el español ocupa hasta un 25% más
que el inglés. Los nombres de módulo son largos —«Bóveda Digital y
Alertas», «Guía Migratoria y Consular»— y en el kit actual la fila con
insignia parte el título en tres líneas.
