# ANDEX — contexto para diseñar

Este documento describe **qué es la plataforma, quién la usa y qué contiene
cada pantalla**. No propone colores, tipografías ni formas: esa es
exactamente la parte que hay que inventar.

> **Sobre lo que existe hoy:** hay una versión construida y funcionando, con
> su propio sistema visual. **No lo mires y no te sientas atado a él.** Lo
> único que sobrevive de él son los requisitos de la sección 6, y sobreviven
> porque son de accesibilidad y de confianza, no de gusto.

---

## 1 · Qué es ANDEX

Una aplicación para **familias hispanas inmigrantes en Estados Unidos**.
Reúne en un solo sitio lo que hoy está repartido entre trámites migratorios,
empleo, finanzas, formación y comunidad. Piloto en **Utah**.

Suscripción de **$14 al mes** o **$140 al año**.

Bilingüe **español / inglés**, con el español por defecto.

---

## 2 · La persona, y el momento en que abre la aplicación

Esta sección es el combustible del diseño. Todo lo demás es inventario.

**Quién.** María llegó a Utah hace ocho meses. Trabaja limpiando casas.
Tiene dos hijos. Su inglés alcanza para lo básico. Su teléfono es un Android
de gama media con la pantalla rayada y poco espacio libre.

**Cómo lo sostiene.** Con una mano, de pie. En el coche antes de entrar a
trabajar, en la cocina de un restaurante, en una sala de espera. A veces con
sol directo dándole a la pantalla. Con datos móviles contados.

**Por qué lo abre.** Nunca a explorar. Lo abre porque **algo tiene fecha**:
su permiso de trabajo vence en 40 días y si se vence pierde el empleo. Hay
prisa y hay miedo.

**Lo que ya le pasó.** Le cobraron $800 por un trámite que era gratis. El
«gestor» dejó de contestar el teléfono. Conoce a tres personas más a las que
les pasó lo mismo.

Esto último tiene consecuencias directas y concretas:

- **Lo que parece «startup emocionante» le resta confianza.** Degradados
  vistosos, promesas grandes, efectos brillantes, todo eso lo ha visto antes
  en quien la estafó. Un producto que parece serio y un poco aburrido le
  genera más confianza que uno que parece innovador.
- **No cree las promesas absolutas.** «Seguridad de nivel bancario» es
  exactamente la frase que le dijeron. Prometer de menos y cumplir vale más.
- **La palabra «notario» está prohibida** en todo el texto en español. En
  EE. UU. un *notary public* no es abogado, y usarlo en español está
  restringido por ley estatal.

**Lo que necesita sentir al abrirlo:** *«esto no me va a fallar, y no me
está vendiendo nada»*.

---

## 3 · Todo lo que la plataforma contiene

Siete módulos de **orden fijo** — nunca se reordenan por popularidad ni por
recomendación, para que nadie pierda de vista uno.

### 1 · Bóveda Digital y Alertas — *el corazón del producto*
- **Escáner de documentos**: la cámara detecta las esquinas del papel,
  endereza la perspectiva, blanquea el fondo y genera un PDF.
- **Cifrado en el propio teléfono.** Los archivos nunca salen del
  dispositivo; ni la empresa puede verlos.
- Carpetas: Identidad · Migración · Conducir · Impuestos · Vivienda.
- **Vencimientos**: cada documento lleva su fecha; avisa 90, 60, 30 y 7 días
  antes.
- Buscador que atraviesa carpetas y tolera acentos.
- **Consulta de caso oficial**: guía en tres pasos para mirar el estatus en
  USCIS o las fechas de corte en EOIR, con enlace al portal oficial.

### 2 · Guía Migratoria y Consular
- Paso a paso para visas de turismo y estudiante, pasaportes y citas
  consulares.
- Enlace directo al portal oficial correspondiente.
- Opción de que un especialista llene el formulario y agende la cita.

### 3 · Finanzas y Patrimonio
- Construcción de historial crediticio y bancarización.
- **Simulador** con deslizadores de monto ($500–$50,000) y plazo (6–24
  meses).
- Guía para abrir cuentas de alto rendimiento y fondos de mercado monetario.

### 4 · Desarrollo Empresarial
- Pasos para registrar una empresa en el estado.
- Paquete de lanzamiento: LLC, EIN, acuerdo de socios y marca.

### 5 · Comunidad y Vida Local
- **Talleres en vivo** por videollamada, de martes a viernes, convertidos
  automáticamente **a la hora de quien mira** — con aviso cuando la sesión
  cae otro día en su país.
- Feed de publicaciones y eventos.
- **Directorio local geolocalizado**, en mapa o cuadrícula.

### 6 · Academia
- **Inglés para el trabajo**: nueve temarios por oficio (limpieza,
  restaurante, construcción, niñera, jardinería, bodega) organizados por
  momento — la entrevista, el primer día, cuando algo sale mal. Cada frase
  trae su **pronunciación escrita en español** y un botón para escucharla.
  Los datos sobre salarios y seguridad llevan **fuente citada** con enlace.
  Manual descargable en PDF.
- **Certificaciones técnicas**: preparador de impuestos, licencias de
  seguros, gestor inmobiliario, con simulacros de examen.

### 7 · Conexión Laboral
- Tarjetas de empleo con sueldo, ubicación y requisitos.
- Aviso al teléfono cuando aparece un empleo que encaja con el perfil.
- El perfil **no registra estatus migratorio ni permiso de trabajo**, por
  diseño.

### Sección adicional · Inversiones
- **Negocios para arrancar**: limpieza (desde $300), comida preparada
  ($500), construcción ($800), transporte ($1,500).
- **Fondos de inversión**: hasta 3–4% mensual, desde $100.
- Cada oportunidad termina en una conversación de WhatsApp.

---

## 4 · Las pantallas, con su contenido real

Los textos de abajo son **los de verdad**, no relleno. Sirven para
dimensionar: cuánto texto cabe, dónde rompen las líneas, qué es largo.

### Portada — antes de registrarse
Explica el producto y ofrece **el escáner gratis, sin registro ni tarjeta**.
Es el anzuelo: se prueba el valor antes de dar un dato.

> **Tu progreso cruza fronteras**
> Un solo lugar para tus trámites, tu empleo y el futuro de tu familia.
> *Cinco preguntas. Dos minutos. No pedimos tarjeta.*

### Registro
Tres campos: nombre, correo, contraseña. Y la aceptación de términos.

### Entrevista — cinco pasos, dos minutos
Arma el plan de la persona. El paso 2 **bifurca todo el producto**: quien ya
está en EE. UU. ve un producto distinto de quien todavía está en su país.

1. Lo básico — nombre y teléfono
2. **¿Dónde estás ahora?** → ya en EE. UU. (¿en qué estado?) / todavía en mi país
3. ¿En qué momento de tu camino estás?
4. ¿Qué te interesa resolver?
5. ¿Qué quieres resolver primero?

### Membresía y pago
Dos planes con lo que incluye cada uno. El pago pasa siempre por una
pasarela externa: **la aplicación nunca toca un número de tarjeta**.

### Panel — el inicio
Lo primero al entrar.

> Hola, María López
> **Tu prioridad en Utah este mes**
> Tu objetivo de estos 30 días: *resolver tus trámites migratorios*

Debajo: la recomendación de qué hacer ahora, y **la cuadrícula de los siete
módulos**.

### Bóveda
Vacía la primera vez:

> **Tu bóveda está vacía**
> Escanea tu primer documento con la cámara. Toma menos de un minuto.

Y el argumento que hace que alguien se atreva a fotografiar su pasaporte:

> **Tus documentos no salen de aquí**
> El escaneo ocurre dentro de tu teléfono y los archivos se guardan cifrados
> en él. No los subimos a ningún servidor: ni nosotros podemos verlos.
>
> Como están en tu teléfono, protégelo con tu clave o tu huella: quien pueda
> desbloquearlo puede abrir la app.

Con documentos dentro: buscador, filtros (*Todos · Vence pronto · Sin
fecha*), y las tarjetas ordenadas por urgencia.

> Permiso de trabajo (EAD) — **Vence en 40 días**

### Comunidad
> Horarios en tu hora (America/New_York)
> En Utah son las 11:09
> **Ojo: para ti es el día siguiente**
>
> El enlace se publica poco antes de empezar

### Academia
> **Inglés para el trabajo**
> No es un curso de inglés. Son las frases exactas de tu entrevista y de tu
> primer día.

Cada frase, en tres líneas:

> **Can I start on Monday?**
> *Se dice: can ai start on MON-dei*
> ¿Puedo empezar el lunes?

### Inversiones
Tarjetas con el rendimiento y el capital de entrada, cada una con su salida
a WhatsApp.

### Perfil
Cuenta, idioma, tema, suscripción, y **borrar mis datos**.

### Administración *(uso interno del equipo)*
Generar las sesiones de los talleres y pegar el enlace de cada una.

---

## 5 · Los estados

**Esto es lo que suele faltar en un diseño y es donde todo se rompe.** Cada
pantalla necesita las cinco versiones, no sólo la feliz.

| Estado | Ejemplo real |
|---|---|
| **Vacío** | La bóveda sin documentos — es la primera pantalla que ve todo el mundo |
| **Cargando** | Descifrar los documentos tarda; el escáner tarda segundos procesando la foto |
| **Error** | Cámara sin permiso · el escáner no encuentra el documento · pago rechazado · sin conexión |
| **Con datos** | Doce documentos en cinco carpetas, uno venciendo en 40 días |
| **Extremo** | Un nombre de documento larguísimo · cien documentos · el teléfono sin espacio |

Y tres estados propios de este producto, que no existen en otras apps:

**La urgencia de un documento** — cinco niveles: vence hoy · en 7 días · en
30 · en 90 · **sin fecha puesta**. Ese último importa: significa que el
sistema *nunca podrá avisar*, y hay que decírselo.

**La puerta de un taller** — cuatro: no hay sesión programada · próxima
sesión el jueves · abre en 15 minutos · **abierta ahora**. Regla dura:
nunca se enseña un botón de entrar si la sala no está abierta.

**La suscripción** — tres: activa · pago vencido en periodo de gracia
(panel en sólo lectura) · cancelada y vencida (todo bloqueado salvo la
cuenta).

---

## 6 · Requisitos que el diseño tiene que cumplir

No son preferencias. Vienen del público y de la confianza.

**Legibilidad**
- **16px como mínimo absoluto** para texto de cuerpo. Se lee bajo el sol,
  con vista cansada y a un brazo de distancia.
- Contraste mínimo **4.5:1** en texto normal y **3:1** en texto grande.
  *Cualquier* color que lleve texto encima tiene que cumplirlo — si el
  acento elegido no lo cumple, el acento es de superficie y el texto va
  sobre otra cosa.
- Todo lo pulsable, **44 × 44px** como mínimo.
- Diseñar primero para **360–414px de ancho**. El escritorio viene después.

**Confianza**
- Nada de promesas absolutas de seguridad; se dice el límite junto con la
  promesa.
- **Aviso permanente** donde haya trámites: *«ANDEX no está afiliado a
  ninguna agencia gubernamental. Estos trámites son gratuitos en los
  portales oficiales.»*
- Cada recurso externo muestra **cuándo se verificó por última vez**.

**Idioma**
- Todo texto existe en español e inglés, y **el español ocupa hasta un 25%
  más**. Donde el inglés dice «Scan», el español dice «Escanear un
  documento». Los botones, las etiquetas y los titulares tienen que aguantar
  ese crecimiento sin romperse.

---

## 7 · Los problemas de diseño difíciles

Si el diseño resuelve estos cinco, está resuelto. Son el encargo real.

**1 · Siete módulos que no pueden abrumar.**
Los siete tienen que estar visibles y en orden fijo, pero **sólo uno importa
ahora mismo**. Cómo se enseña todo el mapa sin que la persona se pierda es
el problema de composición más difícil del producto.

**2 · Urgencia sin alarma.**
Un documento que vence en 7 días tiene que distinguirse a simple vista de
uno que vence en 90. Pero la bóveda no puede parecer una alarma de incendios
cada vez que se abre: la persona ya está asustada.

**3 · Un vacío que invite.**
La primera pantalla que ve todo el mundo es una bóveda sin nada. Ahí se
decide si esta persona se atreve a **fotografiar su pasaporte y confiárselo
a una aplicación**. Es la pantalla más importante del producto.

**4 · Confianza sin teatro de seguridad.**
Hay que comunicar que los documentos están cifrados en el teléfono, y a la
vez decir el límite, sin que parezca letra pequeña ni escudo de marketing.

**5 · Que se lea en la calle.**
Con una mano, a un brazo, con el sol de lado, con prisa. Todo lo demás está
subordinado a esto.

---

## 8 · Qué NO se pide

- **No hace falta parecerse a nada que exista hoy en el producto.** El
  sistema visual actual se va a sustituir; considéralo inexistente.
- No hace falta que se vea «moderno» ni «innovador». Se pide que se vea
  **fiable y permanente**: algo que seguirá existiendo dentro de cinco años.
- No hace falta llenar la pantalla. El espacio vacío es aceptable si lo que
  queda se lee de un vistazo.

---

## 9 · Qué se espera de vuelta

**Dos o tres direcciones visuales distintas**, no una. Cada una con:

- Un nombre y una frase que diga a qué compromete y **qué sacrifica**.
- La misma pantalla resuelta en las tres, para poder compararlas de verdad.
  La mejor para comparar es **la Bóveda con documentos**: tiene jerarquía,
  urgencia, listas y una acción principal.
- Sus estados: al menos el **vacío** y el de **urgencia alta**.
- Paleta, tipografías, escala, formas y espaciado, con el porqué de cada
  elección.

Después, una vez elegida la dirección, el resto de las pantallas.
