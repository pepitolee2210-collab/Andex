/**
 * TEMARIOS TRANSVERSALES — no dependen del oficio.
 *
 * Salen de la evidencia y no de una intuición. El marco federal de educación
 * de adultos (CASAS) tiene dos áreas obligatorias que nuestros temarios no
 * cubrían en absoluto:
 *
 *   4.2  wages, benefits, **employee rights**
 *   4.3  work-related **safety** standards and procedures
 *
 * Enseñar a conseguir el trabajo y no enseñar a cobrarlo ni a sobrevivirlo
 * deja fuera la mitad que más duele. Y el dato que lo vuelve urgente: la
 * mitad de los trabajadores migrantes entrevistados se había lesionado en el
 * trabajo, y la mitad **no sabía que OSHA existe** (National COSH).
 *
 * El tercero —la vida fuera del trabajo— cubre CASAS 2, 3 y 5, y es lo que
 * necesita quien lleva poco tiempo aquí: el médico, la escuela, la renta y
 * el banco.
 *
 * Todas las fuentes en docs/evidencia-ingles-trabajo.md.
 *
 * ⚠️ Los `facts` sobre derechos NO son asesoría legal, y la interfaz lo dice
 * junto a ellos. Explicar que un derecho existe es información; aconsejar
 * sobre un caso concreto es otra cosa, y ésa no la hacemos.
 */

import type { LessonTrack } from "@/lib/academia/types";

export const RUTAS_TRANSVERSALES: readonly LessonTrack[] = [
  {
    id: "ingles-pago-derechos",
    slug: "pago-y-derechos",
    title: "Tu pago y tus derechos",
    summary: "Cómo preguntar por el pago antes de empezar, y qué decir cuando falta dinero.",
    kind: "transversal",
    occupationTag: "",
    level: "basico",
    weeks: 3,
    lessons: [
      {
        id: "pago-antes-de-empezar",
        position: 1,
        title: "Antes de aceptar el trabajo",
        situation: "entrevista",
        facts: [
          {
            text: "El salario mínimo, las horas extra y la protección contra el robo de salario aplican a todo trabajador, sin importar su estatus migratorio.",
            source: "U.S. Department of Labor, Fact Sheet #48",
            url: "https://www.dol.gov/agencies/whd/fact-sheets/48-hoffman-plastics",
          },
        ],
        phrases: [
          { en: "How much is the pay per hour?", es: "¿Cuánto es el pago por hora?", say: "jáu mach is de péi per áu-ar" },
          { en: "How often do you pay?", es: "¿Cada cuánto pagan?", say: "jáu Ó-fen du yu péi" },
          { en: "Do you pay overtime?", es: "¿Pagan horas extra?", say: "du yu péi Ó-ver-taim", note: "Pasadas 40 horas en una semana, normalmente se paga a tiempo y medio." },
          { en: "Will I get a pay stub?", es: "¿Me van a dar recibo de pago?", say: "uil ai guet a péi stab", note: "El recibo es tu prueba. Sin él, demostrar lo que trabajaste es mucho más difícil." },
          { en: "Am I paid by the hour or by the job?", es: "¿Me pagan por hora o por trabajo?", say: "am ai péid bai de áu-ar or bai de yob" },
        ],
      },
      {
        id: "pago-apuntar",
        position: 2,
        title: "Apunta tus horas desde el primer día",
        situation: "en_el_turno",
        facts: [
          {
            text: "Lleva tu propio registro: fecha, hora de entrada, hora de salida y dónde trabajaste. Si algún día hay que reclamar, ese registro cuenta.",
            source: "U.S. Department of Labor, Wage and Hour Division",
          },
        ],
        phrases: [
          { en: "What time did I start today?", es: "¿A qué hora entré hoy?", say: "uát taim did ai start tu-DÉI" },
          { en: "I worked eight hours today.", es: "Hoy trabajé ocho horas.", say: "ai uérkt eit áu-ers tu-DÉI" },
          { en: "Can I see my hours?", es: "¿Puedo ver mis horas?", say: "can ai si mai áu-ers" },
        ],
      },
      {
        id: "pago-falta-dinero",
        position: 3,
        title: "Cuando falta dinero",
        situation: "problema",
        facts: [
          {
            text: "La División de Horas y Salarios no pregunta por el estatus migratorio ni comparte los datos con inmigración: su mandato es que el empleador cumpla.",
            source: "U.S. Department of Labor, Wage and Hour Division",
            url: "https://www.dol.gov/agencies/whd/fact-sheets/48-hoffman-plastics",
          },
          {
            text: "La ley prohíbe las represalias por reclamar tu salario. Que esté prohibido no significa que no ocurra: antes de actuar, busca a alguien que pueda orientarte.",
            source: "Fair Labor Standards Act (FLSA)",
          },
        ],
        phrases: [
          { en: "My check is short.", es: "Me falta dinero en el cheque.", say: "mai chek is short" },
          { en: "I worked forty-five hours, not forty.", es: "Trabajé 45 horas, no 40.", say: "ai uérkt FOR-ti-faiv áu-ers, not FOR-ti" },
          { en: "Can you explain this deduction?", es: "¿Me explica este descuento?", say: "can yu eks-PLÉIN dis di-DÁK-shon" },
          { en: "I have not been paid for last week.", es: "No me han pagado la semana pasada.", say: "ai jav not bin péid for last uík" },
          { en: "When will I get paid?", es: "¿Cuándo me van a pagar?", say: "uén uil ai guet péid" },
        ],
      },
    ],
  },

  {
    id: "ingles-seguridad",
    slug: "seguridad",
    title: "Seguridad en el trabajo",
    summary: "Las señales, cómo decir que algo es peligroso, y qué hacer si te lastimas.",
    kind: "transversal",
    occupationTag: "",
    level: "basico",
    weeks: 2,
    lessons: [
      {
        id: "seguridad-senales",
        position: 1,
        title: "Las señales que hay que reconocer",
        situation: "primer_dia",
        phrases: [
          { en: "DANGER", es: "PELIGRO", say: "DÉIN-yer", note: "La más fuerte: riesgo de muerte o lesión grave." },
          { en: "WARNING", es: "ADVERTENCIA", say: "UÓR-nin" },
          { en: "CAUTION", es: "PRECAUCIÓN", say: "CÓ-shon" },
          { en: "WET FLOOR", es: "PISO MOJADO", say: "uét flor" },
          { en: "HARD HAT AREA", es: "ZONA DE CASCO OBLIGATORIO", say: "jard jat É-ria" },
          { en: "FLAMMABLE", es: "INFLAMABLE", say: "FLÁ-ma-bol" },
          { en: "DO NOT ENTER", es: "NO ENTRAR", say: "du not ÉN-ter" },
          { en: "EMERGENCY EXIT", es: "SALIDA DE EMERGENCIA", say: "i-MÉR-yen-si ÉK-sit", note: "Búscala el primer día, antes de necesitarla." },
        ],
      },
      {
        id: "seguridad-pedir",
        position: 2,
        title: "Pedir lo que te protege",
        situation: "en_el_turno",
        phrases: [
          { en: "I need gloves.", es: "Necesito guantes.", say: "ai nid glavs" },
          { en: "I need a mask.", es: "Necesito una mascarilla.", say: "ai nid a mask" },
          { en: "I need safety glasses.", es: "Necesito lentes de seguridad.", say: "ai nid SÉIF-ti GLÁ-ses" },
          { en: "Where is the first aid kit?", es: "¿Dónde está el botiquín?", say: "uér is de ferst eid kit" },
          { en: "Can you show me how to do this safely?", es: "¿Me enseña cómo hacer esto sin riesgo?", say: "can yu shóu mi jáu tu du dis SÉIF-li" },
        ],
      },
      {
        id: "seguridad-peligro",
        position: 3,
        title: "Cuando algo es peligroso",
        situation: "problema",
        facts: [
          {
            text: "Cualquier persona que trabaja puede denunciar condiciones peligrosas ante OSHA, sin importar su estatus migratorio.",
            source: "Occupational Safety and Health Act (OSH Act)",
            url: "https://www.osha.gov/workers",
          },
          {
            text: "Tienes derecho a recibir la capacitación de seguridad en un idioma que entiendas.",
            source: "OSHA",
            url: "https://www.osha.gov/workers",
          },
        ],
        phrases: [
          { en: "This is not safe.", es: "Esto no es seguro.", say: "dis is not séif" },
          { en: "I do not want to get hurt.", es: "No me quiero lastimar.", say: "ai du not uánt tu guet jert" },
          { en: "This machine is broken.", es: "Esta máquina está descompuesta.", say: "dis ma-SHÍN is BRÓU-ken" },
          { en: "I need training for this.", es: "Necesito capacitación para esto.", say: "ai nid TRÉI-nin for dis" },
        ],
      },
      {
        id: "seguridad-lesion",
        position: 4,
        title: "Si te lastimas",
        situation: "emergencia",
        facts: [
          {
            text: "Reporta la lesión el mismo día y por escrito, aunque parezca leve. Un accidente que no se reportó es mucho más difícil de reclamar después.",
            source: "CASAS 4.3.4 · OSHA",
          },
        ],
        phrases: [
          { en: "I got hurt at work.", es: "Me lastimé en el trabajo.", say: "ai got jert at uérk", note: "Di 'at work'. Es la palabra que cambia quién paga el tratamiento." },
          { en: "I need to see a doctor.", es: "Necesito ver a un doctor.", say: "ai nid tu si a DÓK-tor" },
          { en: "It happened today at three.", es: "Pasó hoy a las tres.", say: "it JÁ-pend tu-DÉI at zri" },
          { en: "I want to report this in writing.", es: "Quiero reportarlo por escrito.", say: "ai uánt tu ri-PORT dis in RÁI-tin" },
          { en: "Call 911.", es: "Llame al 911.", say: "col nain-uán-uán" },
        ],
      },
    ],
  },

  {
    id: "ingles-primeros-meses",
    slug: "primeros-meses",
    title: "Tus primeros meses aquí",
    summary: "El doctor, la escuela de tus hijos, el arrendador y el banco.",
    kind: "transversal",
    occupationTag: "",
    level: "ninguno",
    weeks: 4,
    lessons: [
      {
        id: "primeros-doctor",
        position: 1,
        title: "En la clínica",
        situation: "salud",
        facts: [
          {
            text: "Los centros de salud comunitarios atienden aunque no tengas seguro y cobran según lo que ganas. En inglés se llaman community health centers.",
            source: "Health Resources and Services Administration (HRSA)",
            url: "https://findahealthcenter.hrsa.gov/",
          },
        ],
        phrases: [
          { en: "I need to see a doctor.", es: "Necesito ver a un doctor.", say: "ai nid tu si a DÓK-tor" },
          { en: "I do not have insurance.", es: "No tengo seguro.", say: "ai du not jav in-SHÚ-rans" },
          { en: "Do you have a sliding scale?", es: "¿Cobran según lo que uno gana?", say: "du yu jav a SLÁI-din skéil", note: "'Sliding scale' es la frase exacta. Pregúntala siempre." },
          { en: "I need an interpreter, please.", es: "Necesito un intérprete, por favor.", say: "ai nid an in-TÉR-pri-ter, plis", note: "En cualquier sitio que reciba fondos federales tienes derecho a uno. Pídelo." },
          { en: "It hurts here.", es: "Me duele aquí.", say: "it jerts jíar" },
          { en: "I am allergic to…", es: "Soy alérgico a…", say: "ai am a-LÉR-yik tu…" },
        ],
      },
      {
        id: "primeros-escuela",
        position: 2,
        title: "Inscribir a tus hijos",
        situation: "escuela",
        facts: [
          {
            text: "Toda niña y todo niño tiene derecho a la escuela pública sin importar su estatus migratorio, y la escuela no puede exigir papeles de inmigración para inscribirlo.",
            source: "Plyler v. Doe (1982), Corte Suprema de EE. UU.",
            url: "https://www.justice.gov/crt/page/file/1178401/download",
          },
        ],
        phrases: [
          { en: "I want to enroll my child.", es: "Quiero inscribir a mi hijo.", say: "ai uánt tu en-RÓL mai chaild" },
          { en: "What documents do you need?", es: "¿Qué documentos necesitan?", say: "uát DÓ-kiu-ments du yu nid" },
          { en: "Does the school have free lunch?", es: "¿La escuela tiene almuerzo gratis?", say: "das de skul jav fri lanch" },
          { en: "I would like a translator for the meeting.", es: "Quisiera un traductor para la junta.", say: "ai wud laik a TRANS-léi-tor for de MÍ-tin" },
          { en: "How is my child doing?", es: "¿Cómo va mi hijo?", say: "jáu is mai chaild DÚ-in" },
        ],
      },
      {
        id: "primeros-renta",
        position: 3,
        title: "Con el arrendador",
        situation: "vivienda",
        phrases: [
          { en: "The heater is not working.", es: "La calefacción no sirve.", say: "de JÍ-ter is not UÉR-kin" },
          { en: "There is no hot water.", es: "No hay agua caliente.", say: "der is nóu jot UÓ-ter" },
          { en: "I sent you the rent on the first.", es: "Le mandé la renta el día uno.", say: "ai sent yu de rent on de ferst" },
          { en: "Can I get a receipt?", es: "¿Me da un recibo?", say: "can ai guet a ri-SÍT", note: "Pide recibo SIEMPRE, sobre todo si pagas en efectivo." },
          { en: "When will it be fixed?", es: "¿Cuándo lo van a arreglar?", say: "uén uil it bi fikst" },
        ],
      },
      {
        id: "primeros-banco",
        position: 4,
        title: "En el banco",
        situation: "dinero",
        facts: [
          {
            text: "Muchos bancos y cooperativas de crédito abren cuentas con pasaporte o matrícula consular y un número ITIN, sin exigir seguro social.",
            source: "Consumer Financial Protection Bureau (CFPB)",
            url: "https://www.consumerfinance.gov/",
          },
        ],
        phrases: [
          { en: "I want to open an account.", es: "Quiero abrir una cuenta.", say: "ai uánt tu ÓU-pen an a-KÁUNT" },
          { en: "Can I use my ITIN?", es: "¿Puedo usar mi ITIN?", say: "can ai yus mai ai-ti-ai-EN" },
          { en: "Are there monthly fees?", es: "¿Cobran cuota mensual?", say: "ar der MÁNZ-li fis" },
          { en: "I want to send money to my family.", es: "Quiero mandar dinero a mi familia.", say: "ai uánt tu send MÁ-ni tu mai FÁ-mi-li" },
          { en: "How much is the fee to send it?", es: "¿Cuánto cobran por mandarlo?", say: "jáu mach is de fi tu send it" },
        ],
      },
    ],
  },
] as const;
