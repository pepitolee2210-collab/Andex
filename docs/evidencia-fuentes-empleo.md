# Evidencia — de dónde sacar vacantes reales

Consultado el 2026-08-11. La pregunta era si hacer *web scraping* de portales
de empleo. La respuesta corta: **no hace falta, y para este producto sería
peor que no tener vacantes.**

Fuentes:

- **A** · CareerOneStop — *Jobs Web API*, patrocinado por el Departamento de
  Trabajo de EE. UU. — https://www.careeronestop.org/Developers/WebAPI/
- **A** · NASWA — *National Labor Exchange* —
  https://www.naswa.org/national-labor-exchange
- **B** · DirectEmployers Association — https://directemployers.org/national-labor-exchange/

---

## 1. La vía oficial existe y es gratis

**CareerOneStop** es el portal de desarrolladores del **Departamento de
Trabajo de EE. UU.** Entre sus APIs hay una de empleo (`List Jobs V2`,
`Get Jobs by ID`, `List and Count Jobs`) y lo que devuelve no es un raspado:
son las vacantes del **National Labor Exchange**.

Y el NLx es exactamente lo que este producto necesita:

> *"the only nonprofit national online labor exchange system in the United
> States… collects and distributes **vetted, active, unduplicated** job
> postings that are **refreshed daily**"* — NASWA [A]

Es una alianza público-privada entre **DirectEmployers** y la **NASWA**, la
asociación de las agencias estatales de empleo. Participan *"All 50 state
workforce agencies, the District of Columbia, Guam, Puerto Rico, and the
U.S. Virgin Islands"* [A]. O sea: es el mismo caudal que usan las bolsas de
trabajo estatales, incluida la de Utah.

Sobre la licencia, que es la duda que decide todo:

> *"Data available through CareerOneStop APIs are open data under USDOL's
> Open Data Policy."* [A]

Autenticación por *bearer token* más un `userId`; el alta es un registro, no
un contrato comercial. Acepta búsqueda por palabra clave, por ubicación y
por **código O*NET**, la taxonomía ocupacional del propio Departamento de
Trabajo.

## 2. Por qué el scraping sería peor, y no por lo legal

Lo legal ya es motivo suficiente —Indeed cerró su API pública y los términos
de LinkedIn e Indeed lo prohíben expresamente—, pero el argumento que de
verdad manda en ESTE producto es otro:

> **Lo que se raspa no se puede verificar.**

Las estafas de empleo apuntan justo a esta población: *"paga $200 por el
uniforme y empiezas el lunes"*. Si ANDEX publica una vacante falsa que sacó
de un raspador, no pierde una vacante: pierde lo único que vende, que es ser
el sitio donde no te estafan. Y no hay forma de auditar un raspador.

El NLx llega **vetted y unduplicated** de origen. Esa palabra —*vetted*— es
la que hace que esta fuente sea defendible y un raspador no lo sea.

## 3. ⚠️ El límite honesto de esta fuente

El NLx se nutre de empleadores que publican en las bolsas estatales y en sus
propios portales corporativos. Eso sesga el catálogo hacia **el empleo
formal**: almacén, retail, cadenas, manufactura.

**Lo que probablemente NO va a traer** es justo el primer trabajo al que
apunta este producto: *"señora busca ayuda de limpieza tres días por
semana"*, la niñera del barrio, el jardinero que necesita un ayudante. Ese
empleo no pasa por una bolsa estatal.

De ahí la estrategia que se propone, y que no es "o una cosa o la otra":

| | De dónde | Para qué |
|---|---|---|
| **Base** | NLx vía CareerOneStop | Volumen y legitimidad desde el día uno, gratis y legal |
| **Núcleo** | Empleadores locales verificados a mano | El empleo que de verdad busca esta comunidad |

Diez empleadores reales de Utah valen más que mil vacantes raspadas. Con
2.400 familias piloto, sobra.

## 4. Lo que NO se pudo verificar

La documentación técnica de CareerOneStop devuelve 403 a los clientes
automáticos, así que **estos puntos siguen abiertos** y hay que resolverlos
al registrarse. Ninguna decisión debe darlos por supuestos:

- **Límites de uso** (peticiones por día o por segundo).
- **Campos exactos** que devuelve cada vacante: si trae salario, nombre del
  empleador, URL para aplicar y descripción completa, o sólo un resumen.
- **Si se puede almacenar en caché** la respuesta o hay que consultarla en
  vivo. Esto decide si `job_postings` guarda copias o sólo referencias, y es
  la diferencia entre poder emparejar sin conexión o no.
- **Atribución exigida** al mostrar los datos.

## 5. Otras vías miradas y descartadas

- **USAJOBS** (API federal, gratis y bien documentada): son empleos del
  gobierno federal, que en su inmensa mayoría exigen ciudadanía. No sirve
  para este público.
- **Agregadores comerciales** (Adzuna, Jooble, JSearch): funcionan, pero se
  pagan por consulta y ninguno promete verificación. Sólo tendrían sentido
  si el NLx se quedara corto en volumen.
- **`schema.org/JobPosting`**: muchos portales publican datos estructurados
  en sus páginas. Es legal leer lo que un sitio publica para buscadores,
  pero devuelve al mismo problema: nadie los ha verificado.

---

## Consecuencia para el esquema

`job_postings` necesita tres columnas que no tenía, y están en
`0010_fuentes_empleo.sql`:

- `source` — de dónde vino: `manual`, `nlx`, `partner`.
- `external_id` — el identificador en la fuente, para no duplicar en cada
  sincronización.
- `onet_code` — el código ocupacional del Departamento de Trabajo, que es
  como se consulta la API y como se puede mapear a nuestras etiquetas de
  oficio sin adivinar.
