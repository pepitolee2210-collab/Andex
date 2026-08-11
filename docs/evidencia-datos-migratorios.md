# Evidencia — acceso a datos migratorios oficiales

Base: notebook **MigraConnect — Acceso a Datos Migratorios USA**
(`8e635334-9444-4855-a002-894d0f65b80e`), consultado el 2026-08-10.

Las citas de abajo salen **sólo de fuentes nivel A** (el propio USCIS Developer
Portal). El notebook contiene además fuentes nivel B y C —TRAC, DocketWise, un
blog de bufete, un hilo de Reddit— que **no** se han usado aquí. Si alguna
afirmación futura se apoya en ellas, hay que decirlo.

---

## 1. Consultar el caso de un tercero SÍ está permitido

Era la duda que decidía si ANDEX puede consultar el expediente de un usuario o
sólo enseñarle a hacerlo él. La API está diseñada para eso:

> *"Provides case status information to USCIS customers and their
> representatives who require regular access to case status information."*
> — Case Status API, USCIS Developer Portal

Con una condición contractual explícita sobre el consentimiento:

> *"Clearly state that third-party use or disclosure of user information
> (including de-identified, anonymized, or pseudonymized data) is prohibited
> for any reason without active consent from the user."*
> — Affidavit Requirement, USCIS Developer Portal

**Implicación para el producto:** el flujo guiado de §5-M1 puede pasar de
"te llevamos al portal" a "te lo consultamos", que es un salto grande de valor.
Pero exige consentimiento activo y registrado por usuario, no una casilla
enterrada en los términos.

## 2. Los límites de volumen no son el problema

> *"Daily Quota is limited to 400,000 request and resets everyday at -04:00 UTC
> (Midnight EST)"*
> *"API Concurrency limit is set to 10 Transactions Per Second (TPS). Allows 1
> request every 100 millisecond(ms)"*
> — Case Status API, USCIS Developer Portal

Con 2.400 familias piloto esto sobra por varios órdenes de magnitud. El cuello
de botella es el acceso, no la escala.

## 3. La puerta de entrada: sandbox con tráfico real, y una declaración jurada

Para pasar a producción hay que haber usado el sandbox de verdad:

> *"Minimum of 5 consecutive calendar days of API traffic"*
> *"Success and Error Responses; 200 and 4xx HTTPS responses tested"*
> — Demo ID Requirement, USCIS Developer Portal

Después se escribe a `developersupport@uscis.dhs.gov` y USCIS envía el
*Developer Portal Affidavit*, que firma alguien con capacidad de obligar a la
empresa:

> *"Primary contact must be an authorized signatory who can legally bind your
> company/organization"*
> — Affidavit Requirement, USCIS Developer Portal

**Implicación de calendario:** no es una integración de un día. Son mínimo 5
días de tráfico en sandbox antes siquiera de pedir la revisión, más lo que
tarde USCIS.

## 4. ⚠️ USCIS AUDITA la web. Y hoy no la pasaríamos

Esto es lo que convierte una deuda legal en un bloqueo técnico. El affidavit
somete el sitio y la app a una revisión con criterios medibles:

> *"Do the policies have a grade reading level of 12 or below?"*
> *"Are the policies free of obvious typographical errors?"*
> *"Do text and background colors meet minimum WCAG contrast requirements of at
> least 4.5:1?"*
> — fuente de nivel de lectura: font *"14px or larger"*, *"No long, unbroken
> paragraphs"*, *"No ALL-CAPS paragraphs (a sentence or two is OK)"*

Y sobre el borrado de datos:

> *"Give users an easy way to request permanent deletion of their data"*
> *"State how soon data deletion will happen after the user makes the request"*
> — Affidavit Requirement, USCIS Developer Portal

**Estado real de ANDEX hoy: `/terminos` y `/privacidad` devuelven 404.** Están
enlazadas desde el pie de la landing y desde el propio formulario de registro,
justo donde se lee "Al crear tu cuenta aceptas los Términos de servicio y la
Política de privacidad".

O sea que esas dos páginas dejan de ser una tarea legal pendiente y pasan a ser
**el primer requisito** de la función más valiosa del módulo. Y ya no basta con
escribirlas: tienen que aprobar una auditoría con umbrales concretos —nivel de
lectura de 12º grado o menos, contraste 4.5:1, 14px mínimo, sin párrafos en
mayúsculas, y un borrado de datos con plazo declarado.

Lo bueno: el sistema de diseño ya cumple contraste y tamaño (§2 del PRD), y el
copy del producto ya se escribe en lenguaje llano. El trabajo es redactar, no
rehacer.

---

## Lo que esta base NO cubre

Ninguna de estas preguntas tiene respaldo todavía. Cualquier afirmación sobre
ellas es **APUESTA** hasta que se investiguen:

- **EOIR**: el notebook tiene la fuente "Department of Justice - EOIR Case
  Data" sin consultar. No sabemos si hay API, con qué condiciones, ni si el
  número de audiencia se puede consultar por un tercero.
- **Ejercicio no autorizado de la abogacía (UPL)**: los estatutos estatales de
  consultoría migratoria que ya obligaron a quitar "notario" del copy
  (Anexo B). Cómo aplican a un asistente automático es la pregunta abierta más
  cara del proyecto.
- **Asistentes de voz**: coste por minuto, consentimiento de grabación por
  estado, y si esta audiencia confía o desconfía de una voz sintética.
- **Conversión freemium** en este segmento (pendiente desde D59).
