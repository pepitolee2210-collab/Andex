# ANDEX — la plataforma completa, para diseño

Documento de contexto para diseñar la interfaz. Describe **todo lo que la
aplicación es y hace**: sus siete módulos, cada pantalla, cada estado y las
condiciones reales en que se usa.

---

## 1 · Qué es ANDEX

Una aplicación para **familias hispanas inmigrantes en Estados Unidos**.
Reúne en un solo sitio lo que hoy está repartido entre trámites, empleo,
finanzas, formación y comunidad. Piloto en **Utah**, con vocación nacional.

Suscripción: **$14 al mes** o **$140 al año** ($11.60/mes equivalente).

**Bilingüe español / inglés.** El español es el idioma por defecto y el
inglés se activa por cookie. Todo texto visible existe en los dos idiomas.

---

## 2 · Quién lo usa, y en qué condiciones

Esto manda sobre cualquier decisión visual.

**El dispositivo.** Un teléfono Android de gama media o baja, sujeto con una
mano. Rara vez un escritorio. Pantallas de 360–414px de ancho.

**El lugar.** De pie, en el coche, en una obra, en la cocina de un
restaurante, en una sala de espera. A veces bajo sol directo. Con datos
móviles limitados.

**El momento.** Nadie abre ANDEX a explorar. Se abre porque **algo tiene
fecha**: un permiso que vence, un formulario que hay que mandar, una cita
consular. Hay prisa y hay ansiedad.

**La historia.** Buena parte de este público **ya fue estafado** — por
«notarios», gestores y consultores que cobraron y desaparecieron. Esto tiene
dos consecuencias de diseño concretas:

- La palabra **«notario» está prohibida** en todo el texto en español. En
  EE. UU. un *notary public* no es abogado, y usar el término en español
  está restringido por las leyes estatales de consultoría migratoria.
- **Lo que parece «startup emocionante» se lee como «otro que me quiere
  vender algo».** Degradados llamativos, promesas grandes y efectos brillantes
  restan confianza en vez de sumarla.

**El nivel de lectura.** Escolaridad variable, a menudo educación media.
Frases cortas, palabras comunes, nada de jerga legal sin explicar.

---

## 3 · Los siete módulos

El producto se organiza en siete módulos con **orden fijo**. Ese orden nunca
se reordena por popularidad ni por recomendación: es una regla del producto,
para que nadie pierda de vista un módulo.

### Módulo 1 · Bóveda Digital y Alertas
**El corazón del producto.**

Guarda documentos y vigila sus fechas límite.

- **Escáner de documentos**: la cámara detecta las cuatro esquinas del papel,
  endereza la perspectiva, blanquea el fondo y genera un PDF.
- **Cifrado en el dispositivo**: los archivos **nunca salen del teléfono**.
  Ni ANDEX puede verlos.
- **Carpetas**: Identidad · Migración · Conducir · Impuestos · Vivienda.
- **Vencimientos**: cada documento lleva su fecha; la bóveda ordena por
  urgencia y avisa **90, 60, 30 y 7 días antes**.
- **Buscador** que atraviesa carpetas y tolera acentos.
- **Consulta de caso oficial**: un modal guía en tres pasos para consultar el
  estatus en USCIS o las fechas de corte en EOIR, con enlace al portal
  oficial. ANDEX no consulta por el usuario: le enseña dónde y cómo.

### Módulo 2 · Guía Migratoria y Consular
Acompañamiento en visas (turismo B1/B2, estudiante F-1/M-1), pasaportes y
citas consulares.

- Paso a paso ilustrado dentro de ANDEX.
- Enlace directo al portal oficial (`ceac.state.gov`, sistema de citas del
  consulado correspondiente).
- **Servicio directo**: opción de que un especialista llene el formulario y
  agende la cita ($150–$250).

### Módulo 3 · Finanzas y Patrimonio
Construcción de historial crediticio, bancarización y fondos de inversión.

- **Simulador**: deslizador de monto ($500–$50,000) y plazo (6–24 meses).
- Guía y enlace para abrir cuentas de alto rendimiento y fondos de mercado
  monetario asociados.

### Módulo 4 · Desarrollo Empresarial
Crear una empresa y hacerla crecer.

- Pasos para registrar el nombre comercial en la división de corporaciones
  del estado (ej. `corporations.utah.gov`).
- **Servicio directo**: «Combo Lanzamiento Empresarial» — LLC + EIN +
  Operating Agreement + marca (logo, web y campañas).

### Módulo 5 · Comunidad y Vida Local
Red, directorio y programas familiares.

- **Talleres en vivo** por Zoom, de martes a viernes, 6–8pm hora de Utah,
  convertidos automáticamente **a la hora de quien mira** — incluyendo el
  aviso cuando la sesión cae otro día en su país.
- Feed de publicaciones y anuncios de eventos.
- **Directorio local geolocalizado** en mapa o cuadrícula.

### Módulo 6 · Academia
Formación y certificación.

Dos partes hoy:

- **Inglés para el trabajo**: nueve temarios organizados por oficio
  (limpieza, restaurante, construcción, niñera, jardinería, bodega) y por
  momento (la entrevista, el primer día, cuando algo sale mal). Cada frase
  trae su **pronunciación escrita en español** y un botón para escucharla.
  Los datos sobre salario y seguridad llevan **fuente citada** (Department
  of Labor, OSHA) con enlace. Manual descargable en PDF por temario.
- **Certificaciones técnicas**: preparador de impuestos (PTIN del IRS),
  licencias de seguros, gestor inmobiliario, asesoría financiera básica —
  con simulacros de examen y enlaces al registro oficial.

### Módulo 7 · Conexión Laboral
Bolsa de trabajo comunitaria.

- Tarjetas de empleo con sueldo, ubicación y requisitos.
- **Coincidencia automática**: aviso al teléfono cuando una empresa
  verificada publica un empleo que encaja con el perfil.
- El perfil laboral **no registra estatus migratorio ni permiso de trabajo**,
  por diseño.

### Sección adicional · Inversiones
Fuera de los siete módulos.

- **Negocios para arrancar**: limpieza (desde $300), comida preparada
  ($500), construcción ($800), transporte ($1,500).
- **Fondos de inversión**: hasta 3–4% mensual, desde $100.
- Cada oportunidad cierra en **WhatsApp**, con el mensaje ya redactado.

---

## 4 · Todas las pantallas

### Antes de entrar

| Pantalla | Qué pasa ahí |
|---|---|
| **Portada** | El argumento del producto y **el escáner gratis, sin registro ni tarjeta**. Es el anzuelo: se prueba el valor antes de dar un dato |
| **Registro** | Tres campos: nombre, correo, contraseña. Y la aceptación de términos |
| **Acceso** | Entrar con correo y contraseña |
| **Recuperar contraseña** | Dos pantallas: pedir el enlace, y poner la nueva |

### La entrevista

**Cinco pasos, dos minutos, sin pedir tarjeta.** Arma el plan de la persona.

1. Lo básico — nombre, teléfono
2. **¿Dónde estás ahora?** — bifurca todo el producto en dos: ya en EE. UU.
   (y en qué estado) o todavía en el país de origen
3. ¿En qué momento de tu camino estás? — recién llegado, asentado, etc.
4. ¿Qué te interesa resolver?
5. ¿Qué quieres resolver primero?

### El cobro

| Pantalla | Qué pasa ahí |
|---|---|
| **Membresía** | Los dos planes, lo que incluye cada uno, y el sello de fundador del plan anual |
| **Pago** | Los datos de la tarjeta, siempre a través de Stripe. ANDEX **nunca** toca un número de tarjeta |
| **Pago correcto** | Confirmación y entrada al panel |

### Dentro

| Pantalla | Qué pasa ahí |
|---|---|
| **Panel** | El inicio. Saludo, el objetivo del mes, la recomendación de qué hacer ahora, y la cuadrícula de los siete módulos |
| **Bóveda** | Escanear, buscar, filtrar, ver vencimientos, abrir y corregir documentos |
| **Comunidad** | Los talleres en vivo con su horario y su puerta de entrada |
| **Academia** | Los nueve temarios de inglés y las certificaciones |
| **Módulo** (genérico) | La pantalla de cualquiera de los siete |
| **Inversiones** | Negocios y fondos, con salida a WhatsApp |
| **Perfil** | Cuenta, preferencias, idioma, tema, suscripción y **borrar mis datos** |

### Administración

| Pantalla | Qué pasa ahí |
|---|---|
| **Panel de admin** | Uso interno del equipo |
| **Talleres** | Generar las próximas sesiones y pegar el enlace de Zoom de cada una |

---

## 5 · Los estados de cada pantalla

**Esto es lo que suele faltar en un diseño y es donde se rompen las cosas.**
Cada pantalla necesita las cinco versiones, no sólo la feliz.

| Estado | Ejemplo real en ANDEX |
|---|---|
| **Vacío** | «Tu bóveda está vacía» — es la primera pantalla que ve todo el mundo, y donde se decide si confía |
| **Cargando** | Leer los documentos cifrados del teléfono tarda; el escáner tarda segundos procesando |
| **Error** | La cámara sin permiso · el escáner que no encuentra el documento · el pago rechazado · sin conexión |
| **Con datos** | Doce documentos, tres carpetas, uno venciendo en 40 días |
| **Extremo** | Nombres largos que no caben · cien documentos · un documento sin fecha · el almacenamiento del teléfono lleno |

Estados propios del producto que no existen en otras apps:

- **La puerta del taller**: cerrada · abre en 15 minutos · abierta ahora ·
  no hay sesión programada. **Nunca se enseña un botón de entrar sin sala
  abierta.**
- **La urgencia de un documento**: vence hoy · en 7 días · en 30 · en 90 ·
  sin fecha puesta. Ese último es importante: significa que **nunca podrá
  avisar**, y hay que decirlo.
- **La suscripción**: activa · pago vencido con periodo de gracia ·
  cancelada. Con el pago vencido el panel queda en sólo lectura; cancelada y
  vencida, se bloquea todo salvo la cuenta y el perfil.

---

## 6 · Reglas que el diseño no puede romper

Vienen del producto, no del gusto.

**Legibilidad**

- **16px es el mínimo absoluto** para texto de cuerpo. No negociable: el
  público lo lee bajo el sol y con vista cansada.
- Contraste **4.5:1 como mínimo** en texto normal, 3:1 en texto grande.
- Todo lo pulsable mide **44 × 44px** como mínimo.

**Confianza**

- Nada de promesas absolutas de seguridad. El texto dice que los documentos
  se guardan cifrados **en el teléfono** y también dice el límite: *«protege
  tu teléfono con tu clave o tu huella; quien pueda desbloquearlo puede abrir
  la app»*. Prometer de más en seguridad es peor que no prometer.
- **Disclaimer permanente** donde haya trámites: *«ANDEX no está afiliado a
  ninguna agencia gubernamental. Estos trámites son gratuitos en los portales
  oficiales.»*
- Cada recurso externo muestra **cuándo se verificó por última vez**.
- Ningún dato del usuario viaja en una URL.

**Idioma**

- Todo texto visible existe en español e inglés. El diseño tiene que
  aguantar que **el español ocupe hasta un 25% más** que el inglés: los
  botones, las etiquetas y los titulares rompen líneas donde en inglés no lo
  harían. Un botón que en inglés dice «Scan» en español dice «Escanear un
  documento».

---

## 7 · El sistema visual actual

Existe y funciona. Sirve como punto de partida, no como límite.

**Color**

```
Navy      #102A43   texto y estructura
Crema     #F7F5EF   fondo de página
Teal      #12B8A6   superficie: barras, iconos, acentos
Teal deep #0F766E   botones con texto blanco
Ámbar     #F4B942   fondo de insignia
```

**Regla de oro que hay que respetar:** el teal `#12B8A6` y el ámbar
`#F4B942` son colores de **superficie, nunca de texto**. Blanco sobre teal
da 2.49:1 y sobre ámbar 1.77:1 — los dos reprueban. Si un elemento lleva
texto encima, el fondo es navy, blanco, crema, `teal-deep` o un tono suave.

**Escala tipográfica**

```
40/48px  hero          32px  h1        24px  h2
20px     h3            18px  destacado 16px  cuerpo (mínimo)
14px     etiqueta      13px  metadato
```

**Radios**: 8px campos · 12px botones · 16px tarjetas · 24px modales

**Tipografía actual**: Inter (cuerpo) + Montserrat (titulares).
**Este es el punto más débil del sistema** y donde más se gana cambiando:
son las dos familias más usadas del mundo, y además son la misma
clasificación — dos palos secos. Conviene sustituirlas por dos familias de
clasificación distinta.

---

## 8 · Qué está construido y qué es especificación

Para que el diseño sepa qué es real hoy.

**Funciona hoy**: portada con escáner gratis · registro · entrevista de 5
pasos · membresía y pago (simulado) · panel · Bóveda completa con escáner,
búsqueda y vencimientos · Comunidad con talleres y zonas horarias · Academia
con los nueve temarios de inglés y sus manuales en PDF · Inversiones · perfil
· panel de administración de talleres.

**Especificado, aún no construido**: Migración · Finanzas · Negocio · Empleo
· las certificaciones técnicas de Academia · el directorio local · el feed de
comunidad · **los avisos de 90/60/30/7 días** · términos, privacidad y
contacto · el cobro real con Stripe.

---

## 9 · Qué se le pide al diseño

1. Que **se lea a un brazo de distancia, con una mano, bajo el sol.**
2. Que **transmita permanencia, no novedad.** Que parezca algo que seguirá
   existiendo dentro de cinco años y que no está intentando vender nada.
3. Que **la urgencia sea visible sin gritar.** Un documento que vence en 7
   días tiene que distinguirse de uno que vence en 90, sin convertir la
   pantalla en una alarma.
4. Que **el vacío sea acogedor.** La primera pantalla que ve todo el mundo
   es una bóveda vacía; ahí se decide si esta persona se atreve a fotografiar
   su pasaporte.
5. Que **siete módulos no abrumen.** Es el reto de composición más difícil
   del producto: mucha superficie, y una sola cosa que importa ahora mismo.
