/**
 * Países — catálogo del PASO 2, rama B (Anexo C.2).
 *
 * Orden de presentación en DOS bloques, tal como pide el PRD:
 *   Bloque 1 — Latinoamérica y España, en el orden fijo del documento
 *              (orden de relevancia para la audiencia, NO alfabético).
 *   Bloque 2 — resto del mundo, alfabético por nombre en español.
 *
 * Se guarda SIEMPRE el código ISO 3166-1 alpha-2. Del país se derivan
 * (C.4): consulado aplicable a los enlaces del M2, zona horaria de las
 * notificaciones, formato de fecha, código telefónico del paso 1 y moneda
 * de referencia para mostrar el costo estimado de un trámite.
 *
 * ⚠️ Sobre la moneda: `currencyCode` sirve para SABER en qué moneda
 * expresar una estimación, no para convertirla. El PRD prohíbe fijar una
 * tasa de cambio en código (C.4 y Anexo B): toda conversión debe venir de
 * una fuente con fecha de actualización visible.
 */

export type Country = {
  /** ISO 3166-1 alpha-2, en mayúsculas. Es lo que se persiste. */
  code: string;
  nameEs: string;
  nameEn: string;
  /** 1 = acceso rápido (LatAm + España) · 2 = resto del mundo */
  block: 1 | 2;
  /** Código telefónico con "+", para prellenar el campo del paso 1. */
  dialCode: string;
  /** ISO 4217. Moneda de referencia, nunca una tasa. */
  currencyCode: string;
  /** C.4: LatAm usa DD/MM/AAAA; EE. UU. usa MM/DD/AAAA. */
  dateFormat: "DMY" | "MDY";
  /** Zona horaria IANA de la capital. */
  timezone: string;
};

/**
 * Valor que se persiste cuando el usuario elige "Mi país no está en la
 * lista" (C.2). El texto visible de esa opción vive en la capa de i18n.
 * No forma parte de COUNTRIES: es una salida de emergencia, no un país.
 */
export const COUNTRY_NOT_LISTED = "XX";

export const COUNTRIES: readonly Country[] = [
  // ── Bloque 1 — Latinoamérica y España (orden del PRD) ────
  { code: "MX", nameEs: "México", nameEn: "Mexico", block: 1, dialCode: "+52", currencyCode: "MXN", dateFormat: "DMY", timezone: "America/Mexico_City" },
  { code: "GT", nameEs: "Guatemala", nameEn: "Guatemala", block: 1, dialCode: "+502", currencyCode: "GTQ", dateFormat: "DMY", timezone: "America/Guatemala" },
  { code: "SV", nameEs: "El Salvador", nameEn: "El Salvador", block: 1, dialCode: "+503", currencyCode: "USD", dateFormat: "DMY", timezone: "America/El_Salvador" },
  { code: "HN", nameEs: "Honduras", nameEn: "Honduras", block: 1, dialCode: "+504", currencyCode: "HNL", dateFormat: "DMY", timezone: "America/Tegucigalpa" },
  { code: "NI", nameEs: "Nicaragua", nameEn: "Nicaragua", block: 1, dialCode: "+505", currencyCode: "NIO", dateFormat: "DMY", timezone: "America/Managua" },
  { code: "CR", nameEs: "Costa Rica", nameEn: "Costa Rica", block: 1, dialCode: "+506", currencyCode: "CRC", dateFormat: "DMY", timezone: "America/Costa_Rica" },
  { code: "PA", nameEs: "Panamá", nameEn: "Panama", block: 1, dialCode: "+507", currencyCode: "PAB", dateFormat: "DMY", timezone: "America/Panama" },
  { code: "CO", nameEs: "Colombia", nameEn: "Colombia", block: 1, dialCode: "+57", currencyCode: "COP", dateFormat: "DMY", timezone: "America/Bogota" },
  { code: "VE", nameEs: "Venezuela", nameEn: "Venezuela", block: 1, dialCode: "+58", currencyCode: "VES", dateFormat: "DMY", timezone: "America/Caracas" },
  { code: "EC", nameEs: "Ecuador", nameEn: "Ecuador", block: 1, dialCode: "+593", currencyCode: "USD", dateFormat: "DMY", timezone: "America/Guayaquil" },
  { code: "PE", nameEs: "Perú", nameEn: "Peru", block: 1, dialCode: "+51", currencyCode: "PEN", dateFormat: "DMY", timezone: "America/Lima" },
  { code: "BO", nameEs: "Bolivia", nameEn: "Bolivia", block: 1, dialCode: "+591", currencyCode: "BOB", dateFormat: "DMY", timezone: "America/La_Paz" },
  { code: "CL", nameEs: "Chile", nameEn: "Chile", block: 1, dialCode: "+56", currencyCode: "CLP", dateFormat: "DMY", timezone: "America/Santiago" },
  { code: "AR", nameEs: "Argentina", nameEn: "Argentina", block: 1, dialCode: "+54", currencyCode: "ARS", dateFormat: "DMY", timezone: "America/Argentina/Buenos_Aires" },
  { code: "UY", nameEs: "Uruguay", nameEn: "Uruguay", block: 1, dialCode: "+598", currencyCode: "UYU", dateFormat: "DMY", timezone: "America/Montevideo" },
  { code: "PY", nameEs: "Paraguay", nameEn: "Paraguay", block: 1, dialCode: "+595", currencyCode: "PYG", dateFormat: "DMY", timezone: "America/Asuncion" },
  { code: "BR", nameEs: "Brasil", nameEn: "Brazil", block: 1, dialCode: "+55", currencyCode: "BRL", dateFormat: "DMY", timezone: "America/Sao_Paulo" },
  { code: "DO", nameEs: "República Dominicana", nameEn: "Dominican Republic", block: 1, dialCode: "+1809", currencyCode: "DOP", dateFormat: "DMY", timezone: "America/Santo_Domingo" },
  { code: "CU", nameEs: "Cuba", nameEn: "Cuba", block: 1, dialCode: "+53", currencyCode: "CUP", dateFormat: "DMY", timezone: "America/Havana" },
  { code: "ES", nameEs: "España", nameEn: "Spain", block: 1, dialCode: "+34", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Madrid" },

  // ── Bloque 2 — Resto del mundo, alfabético por nameEs ─────
  { code: "AF", nameEs: "Afganistán", nameEn: "Afghanistan", block: 2, dialCode: "+93", currencyCode: "AFN", dateFormat: "DMY", timezone: "Asia/Kabul" },
  { code: "AL", nameEs: "Albania", nameEn: "Albania", block: 2, dialCode: "+355", currencyCode: "ALL", dateFormat: "DMY", timezone: "Europe/Tirane" },
  { code: "DE", nameEs: "Alemania", nameEn: "Germany", block: 2, dialCode: "+49", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Berlin" },
  { code: "AD", nameEs: "Andorra", nameEn: "Andorra", block: 2, dialCode: "+376", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Andorra" },
  { code: "AO", nameEs: "Angola", nameEn: "Angola", block: 2, dialCode: "+244", currencyCode: "AOA", dateFormat: "DMY", timezone: "Africa/Luanda" },
  { code: "AI", nameEs: "Anguila", nameEn: "Anguilla", block: 2, dialCode: "+1264", currencyCode: "XCD", dateFormat: "DMY", timezone: "America/Anguilla" },
  { code: "AQ", nameEs: "Antártida", nameEn: "Antarctica", block: 2, dialCode: "+672", currencyCode: "USD", dateFormat: "DMY", timezone: "Antarctica/McMurdo" },
  { code: "AG", nameEs: "Antigua y Barbuda", nameEn: "Antigua and Barbuda", block: 2, dialCode: "+1268", currencyCode: "XCD", dateFormat: "DMY", timezone: "America/Antigua" },
  { code: "SA", nameEs: "Arabia Saudita", nameEn: "Saudi Arabia", block: 2, dialCode: "+966", currencyCode: "SAR", dateFormat: "DMY", timezone: "Asia/Riyadh" },
  { code: "DZ", nameEs: "Argelia", nameEn: "Algeria", block: 2, dialCode: "+213", currencyCode: "DZD", dateFormat: "DMY", timezone: "Africa/Algiers" },
  { code: "AM", nameEs: "Armenia", nameEn: "Armenia", block: 2, dialCode: "+374", currencyCode: "AMD", dateFormat: "DMY", timezone: "Asia/Yerevan" },
  { code: "AW", nameEs: "Aruba", nameEn: "Aruba", block: 2, dialCode: "+297", currencyCode: "AWG", dateFormat: "DMY", timezone: "America/Aruba" },
  { code: "AU", nameEs: "Australia", nameEn: "Australia", block: 2, dialCode: "+61", currencyCode: "AUD", dateFormat: "DMY", timezone: "Australia/Sydney" },
  { code: "AT", nameEs: "Austria", nameEn: "Austria", block: 2, dialCode: "+43", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Vienna" },
  { code: "AZ", nameEs: "Azerbaiyán", nameEn: "Azerbaijan", block: 2, dialCode: "+994", currencyCode: "AZN", dateFormat: "DMY", timezone: "Asia/Baku" },
  { code: "BS", nameEs: "Bahamas", nameEn: "Bahamas", block: 2, dialCode: "+1242", currencyCode: "BSD", dateFormat: "DMY", timezone: "America/Nassau" },
  { code: "BD", nameEs: "Bangladés", nameEn: "Bangladesh", block: 2, dialCode: "+880", currencyCode: "BDT", dateFormat: "DMY", timezone: "Asia/Dhaka" },
  { code: "BB", nameEs: "Barbados", nameEn: "Barbados", block: 2, dialCode: "+1246", currencyCode: "BBD", dateFormat: "DMY", timezone: "America/Barbados" },
  { code: "BH", nameEs: "Baréin", nameEn: "Bahrain", block: 2, dialCode: "+973", currencyCode: "BHD", dateFormat: "DMY", timezone: "Asia/Bahrain" },
  { code: "BE", nameEs: "Bélgica", nameEn: "Belgium", block: 2, dialCode: "+32", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Brussels" },
  { code: "BZ", nameEs: "Belice", nameEn: "Belize", block: 2, dialCode: "+501", currencyCode: "BZD", dateFormat: "DMY", timezone: "America/Belize" },
  { code: "BJ", nameEs: "Benín", nameEn: "Benin", block: 2, dialCode: "+229", currencyCode: "XOF", dateFormat: "DMY", timezone: "Africa/Porto-Novo" },
  { code: "BM", nameEs: "Bermudas", nameEn: "Bermuda", block: 2, dialCode: "+1441", currencyCode: "BMD", dateFormat: "DMY", timezone: "Atlantic/Bermuda" },
  { code: "BY", nameEs: "Bielorrusia", nameEn: "Belarus", block: 2, dialCode: "+375", currencyCode: "BYN", dateFormat: "DMY", timezone: "Europe/Minsk" },
  { code: "MM", nameEs: "Birmania", nameEn: "Myanmar", block: 2, dialCode: "+95", currencyCode: "MMK", dateFormat: "DMY", timezone: "Asia/Yangon" },
  { code: "BQ", nameEs: "Bonaire, San Eustaquio y Saba", nameEn: "Caribbean Netherlands", block: 2, dialCode: "+599", currencyCode: "USD", dateFormat: "DMY", timezone: "America/Kralendijk" },
  { code: "BA", nameEs: "Bosnia y Herzegovina", nameEn: "Bosnia and Herzegovina", block: 2, dialCode: "+387", currencyCode: "BAM", dateFormat: "DMY", timezone: "Europe/Sarajevo" },
  { code: "BW", nameEs: "Botsuana", nameEn: "Botswana", block: 2, dialCode: "+267", currencyCode: "BWP", dateFormat: "DMY", timezone: "Africa/Gaborone" },
  { code: "BN", nameEs: "Brunéi", nameEn: "Brunei", block: 2, dialCode: "+673", currencyCode: "BND", dateFormat: "DMY", timezone: "Asia/Brunei" },
  { code: "BG", nameEs: "Bulgaria", nameEn: "Bulgaria", block: 2, dialCode: "+359", currencyCode: "BGN", dateFormat: "DMY", timezone: "Europe/Sofia" },
  { code: "BF", nameEs: "Burkina Faso", nameEn: "Burkina Faso", block: 2, dialCode: "+226", currencyCode: "XOF", dateFormat: "DMY", timezone: "Africa/Ouagadougou" },
  { code: "BI", nameEs: "Burundi", nameEn: "Burundi", block: 2, dialCode: "+257", currencyCode: "BIF", dateFormat: "DMY", timezone: "Africa/Bujumbura" },
  { code: "BT", nameEs: "Bután", nameEn: "Bhutan", block: 2, dialCode: "+975", currencyCode: "BTN", dateFormat: "DMY", timezone: "Asia/Thimphu" },
  { code: "CV", nameEs: "Cabo Verde", nameEn: "Cape Verde", block: 2, dialCode: "+238", currencyCode: "CVE", dateFormat: "DMY", timezone: "Atlantic/Cape_Verde" },
  { code: "KH", nameEs: "Camboya", nameEn: "Cambodia", block: 2, dialCode: "+855", currencyCode: "KHR", dateFormat: "DMY", timezone: "Asia/Phnom_Penh" },
  { code: "CM", nameEs: "Camerún", nameEn: "Cameroon", block: 2, dialCode: "+237", currencyCode: "XAF", dateFormat: "DMY", timezone: "Africa/Douala" },
  { code: "CA", nameEs: "Canadá", nameEn: "Canada", block: 2, dialCode: "+1", currencyCode: "CAD", dateFormat: "DMY", timezone: "America/Toronto" },
  { code: "QA", nameEs: "Catar", nameEn: "Qatar", block: 2, dialCode: "+974", currencyCode: "QAR", dateFormat: "DMY", timezone: "Asia/Qatar" },
  { code: "TD", nameEs: "Chad", nameEn: "Chad", block: 2, dialCode: "+235", currencyCode: "XAF", dateFormat: "DMY", timezone: "Africa/Ndjamena" },
  { code: "CZ", nameEs: "Chequia", nameEn: "Czechia", block: 2, dialCode: "+420", currencyCode: "CZK", dateFormat: "DMY", timezone: "Europe/Prague" },
  { code: "CN", nameEs: "China", nameEn: "China", block: 2, dialCode: "+86", currencyCode: "CNY", dateFormat: "DMY", timezone: "Asia/Shanghai" },
  { code: "CY", nameEs: "Chipre", nameEn: "Cyprus", block: 2, dialCode: "+357", currencyCode: "EUR", dateFormat: "DMY", timezone: "Asia/Nicosia" },
  { code: "VA", nameEs: "Ciudad del Vaticano", nameEn: "Vatican City", block: 2, dialCode: "+379", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Vatican" },
  { code: "KM", nameEs: "Comoras", nameEn: "Comoros", block: 2, dialCode: "+269", currencyCode: "KMF", dateFormat: "DMY", timezone: "Indian/Comoro" },
  { code: "CG", nameEs: "Congo", nameEn: "Congo", block: 2, dialCode: "+242", currencyCode: "XAF", dateFormat: "DMY", timezone: "Africa/Brazzaville" },
  { code: "CD", nameEs: "Congo (República Democrática)", nameEn: "Congo (DRC)", block: 2, dialCode: "+243", currencyCode: "CDF", dateFormat: "DMY", timezone: "Africa/Kinshasa" },
  { code: "KP", nameEs: "Corea del Norte", nameEn: "North Korea", block: 2, dialCode: "+850", currencyCode: "KPW", dateFormat: "DMY", timezone: "Asia/Pyongyang" },
  { code: "KR", nameEs: "Corea del Sur", nameEn: "South Korea", block: 2, dialCode: "+82", currencyCode: "KRW", dateFormat: "DMY", timezone: "Asia/Seoul" },
  { code: "CI", nameEs: "Costa de Marfil", nameEn: "Ivory Coast", block: 2, dialCode: "+225", currencyCode: "XOF", dateFormat: "DMY", timezone: "Africa/Abidjan" },
  { code: "HR", nameEs: "Croacia", nameEn: "Croatia", block: 2, dialCode: "+385", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Zagreb" },
  { code: "CW", nameEs: "Curazao", nameEn: "Curaçao", block: 2, dialCode: "+599", currencyCode: "ANG", dateFormat: "DMY", timezone: "America/Curacao" },
  { code: "DK", nameEs: "Dinamarca", nameEn: "Denmark", block: 2, dialCode: "+45", currencyCode: "DKK", dateFormat: "DMY", timezone: "Europe/Copenhagen" },
  { code: "DM", nameEs: "Dominica", nameEn: "Dominica", block: 2, dialCode: "+1767", currencyCode: "XCD", dateFormat: "DMY", timezone: "America/Dominica" },
  { code: "EG", nameEs: "Egipto", nameEn: "Egypt", block: 2, dialCode: "+20", currencyCode: "EGP", dateFormat: "DMY", timezone: "Africa/Cairo" },
  { code: "AE", nameEs: "Emiratos Árabes Unidos", nameEn: "United Arab Emirates", block: 2, dialCode: "+971", currencyCode: "AED", dateFormat: "DMY", timezone: "Asia/Dubai" },
  { code: "ER", nameEs: "Eritrea", nameEn: "Eritrea", block: 2, dialCode: "+291", currencyCode: "ERN", dateFormat: "DMY", timezone: "Africa/Asmara" },
  { code: "SK", nameEs: "Eslovaquia", nameEn: "Slovakia", block: 2, dialCode: "+421", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Bratislava" },
  { code: "SI", nameEs: "Eslovenia", nameEn: "Slovenia", block: 2, dialCode: "+386", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Ljubljana" },
  { code: "US", nameEs: "Estados Unidos", nameEn: "United States", block: 2, dialCode: "+1", currencyCode: "USD", dateFormat: "MDY", timezone: "America/New_York" },
  { code: "EE", nameEs: "Estonia", nameEn: "Estonia", block: 2, dialCode: "+372", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Tallinn" },
  { code: "SZ", nameEs: "Esuatini", nameEn: "Eswatini", block: 2, dialCode: "+268", currencyCode: "SZL", dateFormat: "DMY", timezone: "Africa/Mbabane" },
  { code: "ET", nameEs: "Etiopía", nameEn: "Ethiopia", block: 2, dialCode: "+251", currencyCode: "ETB", dateFormat: "DMY", timezone: "Africa/Addis_Ababa" },
  { code: "PH", nameEs: "Filipinas", nameEn: "Philippines", block: 2, dialCode: "+63", currencyCode: "PHP", dateFormat: "DMY", timezone: "Asia/Manila" },
  { code: "FI", nameEs: "Finlandia", nameEn: "Finland", block: 2, dialCode: "+358", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Helsinki" },
  { code: "FJ", nameEs: "Fiyi", nameEn: "Fiji", block: 2, dialCode: "+679", currencyCode: "FJD", dateFormat: "DMY", timezone: "Pacific/Fiji" },
  { code: "FR", nameEs: "Francia", nameEn: "France", block: 2, dialCode: "+33", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Paris" },
  { code: "GA", nameEs: "Gabón", nameEn: "Gabon", block: 2, dialCode: "+241", currencyCode: "XAF", dateFormat: "DMY", timezone: "Africa/Libreville" },
  { code: "GM", nameEs: "Gambia", nameEn: "Gambia", block: 2, dialCode: "+220", currencyCode: "GMD", dateFormat: "DMY", timezone: "Africa/Banjul" },
  { code: "GE", nameEs: "Georgia", nameEn: "Georgia", block: 2, dialCode: "+995", currencyCode: "GEL", dateFormat: "DMY", timezone: "Asia/Tbilisi" },
  { code: "GH", nameEs: "Ghana", nameEn: "Ghana", block: 2, dialCode: "+233", currencyCode: "GHS", dateFormat: "DMY", timezone: "Africa/Accra" },
  { code: "GI", nameEs: "Gibraltar", nameEn: "Gibraltar", block: 2, dialCode: "+350", currencyCode: "GIP", dateFormat: "DMY", timezone: "Europe/Gibraltar" },
  { code: "GD", nameEs: "Granada", nameEn: "Grenada", block: 2, dialCode: "+1473", currencyCode: "XCD", dateFormat: "DMY", timezone: "America/Grenada" },
  { code: "GR", nameEs: "Grecia", nameEn: "Greece", block: 2, dialCode: "+30", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Athens" },
  { code: "GL", nameEs: "Groenlandia", nameEn: "Greenland", block: 2, dialCode: "+299", currencyCode: "DKK", dateFormat: "DMY", timezone: "America/Nuuk" },
  { code: "GP", nameEs: "Guadalupe", nameEn: "Guadeloupe", block: 2, dialCode: "+590", currencyCode: "EUR", dateFormat: "DMY", timezone: "America/Guadeloupe" },
  { code: "GU", nameEs: "Guam", nameEn: "Guam", block: 2, dialCode: "+1671", currencyCode: "USD", dateFormat: "MDY", timezone: "Pacific/Guam" },
  { code: "GF", nameEs: "Guayana Francesa", nameEn: "French Guiana", block: 2, dialCode: "+594", currencyCode: "EUR", dateFormat: "DMY", timezone: "America/Cayenne" },
  { code: "GG", nameEs: "Guernsey", nameEn: "Guernsey", block: 2, dialCode: "+44", currencyCode: "GBP", dateFormat: "DMY", timezone: "Europe/Guernsey" },
  { code: "GN", nameEs: "Guinea", nameEn: "Guinea", block: 2, dialCode: "+224", currencyCode: "GNF", dateFormat: "DMY", timezone: "Africa/Conakry" },
  { code: "GQ", nameEs: "Guinea Ecuatorial", nameEn: "Equatorial Guinea", block: 2, dialCode: "+240", currencyCode: "XAF", dateFormat: "DMY", timezone: "Africa/Malabo" },
  { code: "GW", nameEs: "Guinea-Bisáu", nameEn: "Guinea-Bissau", block: 2, dialCode: "+245", currencyCode: "XOF", dateFormat: "DMY", timezone: "Africa/Bissau" },
  { code: "GY", nameEs: "Guyana", nameEn: "Guyana", block: 2, dialCode: "+592", currencyCode: "GYD", dateFormat: "DMY", timezone: "America/Guyana" },
  { code: "HT", nameEs: "Haití", nameEn: "Haiti", block: 2, dialCode: "+509", currencyCode: "HTG", dateFormat: "DMY", timezone: "America/Port-au-Prince" },
  { code: "HK", nameEs: "Hong Kong", nameEn: "Hong Kong", block: 2, dialCode: "+852", currencyCode: "HKD", dateFormat: "DMY", timezone: "Asia/Hong_Kong" },
  { code: "HU", nameEs: "Hungría", nameEn: "Hungary", block: 2, dialCode: "+36", currencyCode: "HUF", dateFormat: "DMY", timezone: "Europe/Budapest" },
  { code: "IN", nameEs: "India", nameEn: "India", block: 2, dialCode: "+91", currencyCode: "INR", dateFormat: "DMY", timezone: "Asia/Kolkata" },
  { code: "ID", nameEs: "Indonesia", nameEn: "Indonesia", block: 2, dialCode: "+62", currencyCode: "IDR", dateFormat: "DMY", timezone: "Asia/Jakarta" },
  { code: "IQ", nameEs: "Irak", nameEn: "Iraq", block: 2, dialCode: "+964", currencyCode: "IQD", dateFormat: "DMY", timezone: "Asia/Baghdad" },
  { code: "IR", nameEs: "Irán", nameEn: "Iran", block: 2, dialCode: "+98", currencyCode: "IRR", dateFormat: "DMY", timezone: "Asia/Tehran" },
  { code: "IE", nameEs: "Irlanda", nameEn: "Ireland", block: 2, dialCode: "+353", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Dublin" },
  { code: "BV", nameEs: "Isla Bouvet", nameEn: "Bouvet Island", block: 2, dialCode: "+47", currencyCode: "NOK", dateFormat: "DMY", timezone: "Europe/Oslo" },
  { code: "IM", nameEs: "Isla de Man", nameEn: "Isle of Man", block: 2, dialCode: "+44", currencyCode: "GBP", dateFormat: "DMY", timezone: "Europe/Isle_of_Man" },
  { code: "CX", nameEs: "Isla de Navidad", nameEn: "Christmas Island", block: 2, dialCode: "+61", currencyCode: "AUD", dateFormat: "DMY", timezone: "Indian/Christmas" },
  { code: "NF", nameEs: "Isla Norfolk", nameEn: "Norfolk Island", block: 2, dialCode: "+672", currencyCode: "AUD", dateFormat: "DMY", timezone: "Pacific/Norfolk" },
  { code: "IS", nameEs: "Islandia", nameEn: "Iceland", block: 2, dialCode: "+354", currencyCode: "ISK", dateFormat: "DMY", timezone: "Atlantic/Reykjavik" },
  { code: "AX", nameEs: "Islas Åland", nameEn: "Åland Islands", block: 2, dialCode: "+358", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Mariehamn" },
  { code: "KY", nameEs: "Islas Caimán", nameEn: "Cayman Islands", block: 2, dialCode: "+1345", currencyCode: "KYD", dateFormat: "DMY", timezone: "America/Cayman" },
  { code: "CC", nameEs: "Islas Cocos", nameEn: "Cocos (Keeling) Islands", block: 2, dialCode: "+61", currencyCode: "AUD", dateFormat: "DMY", timezone: "Indian/Cocos" },
  { code: "CK", nameEs: "Islas Cook", nameEn: "Cook Islands", block: 2, dialCode: "+682", currencyCode: "NZD", dateFormat: "DMY", timezone: "Pacific/Rarotonga" },
  { code: "FO", nameEs: "Islas Feroe", nameEn: "Faroe Islands", block: 2, dialCode: "+298", currencyCode: "DKK", dateFormat: "DMY", timezone: "Atlantic/Faroe" },
  { code: "GS", nameEs: "Islas Georgias del Sur y Sandwich del Sur", nameEn: "South Georgia and the South Sandwich Islands", block: 2, dialCode: "+500", currencyCode: "GBP", dateFormat: "DMY", timezone: "Atlantic/South_Georgia" },
  { code: "HM", nameEs: "Islas Heard y McDonald", nameEn: "Heard and McDonald Islands", block: 2, dialCode: "+672", currencyCode: "AUD", dateFormat: "DMY", timezone: "Indian/Kerguelen" },
  { code: "FK", nameEs: "Islas Malvinas", nameEn: "Falkland Islands", block: 2, dialCode: "+500", currencyCode: "FKP", dateFormat: "DMY", timezone: "Atlantic/Stanley" },
  { code: "MP", nameEs: "Islas Marianas del Norte", nameEn: "Northern Mariana Islands", block: 2, dialCode: "+1670", currencyCode: "USD", dateFormat: "MDY", timezone: "Pacific/Saipan" },
  { code: "MH", nameEs: "Islas Marshall", nameEn: "Marshall Islands", block: 2, dialCode: "+692", currencyCode: "USD", dateFormat: "DMY", timezone: "Pacific/Majuro" },
  { code: "UM", nameEs: "Islas Menores Alejadas de EE. UU.", nameEn: "U.S. Minor Outlying Islands", block: 2, dialCode: "+1", currencyCode: "USD", dateFormat: "MDY", timezone: "Pacific/Wake" },
  { code: "PN", nameEs: "Islas Pitcairn", nameEn: "Pitcairn Islands", block: 2, dialCode: "+64", currencyCode: "NZD", dateFormat: "DMY", timezone: "Pacific/Pitcairn" },
  { code: "SB", nameEs: "Islas Salomón", nameEn: "Solomon Islands", block: 2, dialCode: "+677", currencyCode: "SBD", dateFormat: "DMY", timezone: "Pacific/Guadalcanal" },
  { code: "TC", nameEs: "Islas Turcas y Caicos", nameEn: "Turks and Caicos Islands", block: 2, dialCode: "+1649", currencyCode: "USD", dateFormat: "DMY", timezone: "America/Grand_Turk" },
  { code: "VG", nameEs: "Islas Vírgenes Británicas", nameEn: "British Virgin Islands", block: 2, dialCode: "+1284", currencyCode: "USD", dateFormat: "DMY", timezone: "America/Tortola" },
  { code: "VI", nameEs: "Islas Vírgenes de EE. UU.", nameEn: "U.S. Virgin Islands", block: 2, dialCode: "+1340", currencyCode: "USD", dateFormat: "MDY", timezone: "America/St_Thomas" },
  { code: "IL", nameEs: "Israel", nameEn: "Israel", block: 2, dialCode: "+972", currencyCode: "ILS", dateFormat: "DMY", timezone: "Asia/Jerusalem" },
  { code: "IT", nameEs: "Italia", nameEn: "Italy", block: 2, dialCode: "+39", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Rome" },
  { code: "JM", nameEs: "Jamaica", nameEn: "Jamaica", block: 2, dialCode: "+1876", currencyCode: "JMD", dateFormat: "DMY", timezone: "America/Jamaica" },
  { code: "JP", nameEs: "Japón", nameEn: "Japan", block: 2, dialCode: "+81", currencyCode: "JPY", dateFormat: "DMY", timezone: "Asia/Tokyo" },
  { code: "JE", nameEs: "Jersey", nameEn: "Jersey", block: 2, dialCode: "+44", currencyCode: "GBP", dateFormat: "DMY", timezone: "Europe/Jersey" },
  { code: "JO", nameEs: "Jordania", nameEn: "Jordan", block: 2, dialCode: "+962", currencyCode: "JOD", dateFormat: "DMY", timezone: "Asia/Amman" },
  { code: "KZ", nameEs: "Kazajistán", nameEn: "Kazakhstan", block: 2, dialCode: "+7", currencyCode: "KZT", dateFormat: "DMY", timezone: "Asia/Almaty" },
  { code: "KE", nameEs: "Kenia", nameEn: "Kenya", block: 2, dialCode: "+254", currencyCode: "KES", dateFormat: "DMY", timezone: "Africa/Nairobi" },
  { code: "KG", nameEs: "Kirguistán", nameEn: "Kyrgyzstan", block: 2, dialCode: "+996", currencyCode: "KGS", dateFormat: "DMY", timezone: "Asia/Bishkek" },
  { code: "KI", nameEs: "Kiribati", nameEn: "Kiribati", block: 2, dialCode: "+686", currencyCode: "AUD", dateFormat: "DMY", timezone: "Pacific/Tarawa" },
  { code: "KW", nameEs: "Kuwait", nameEn: "Kuwait", block: 2, dialCode: "+965", currencyCode: "KWD", dateFormat: "DMY", timezone: "Asia/Kuwait" },
  { code: "LA", nameEs: "Laos", nameEn: "Laos", block: 2, dialCode: "+856", currencyCode: "LAK", dateFormat: "DMY", timezone: "Asia/Vientiane" },
  { code: "LS", nameEs: "Lesoto", nameEn: "Lesotho", block: 2, dialCode: "+266", currencyCode: "LSL", dateFormat: "DMY", timezone: "Africa/Maseru" },
  { code: "LV", nameEs: "Letonia", nameEn: "Latvia", block: 2, dialCode: "+371", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Riga" },
  { code: "LB", nameEs: "Líbano", nameEn: "Lebanon", block: 2, dialCode: "+961", currencyCode: "LBP", dateFormat: "DMY", timezone: "Asia/Beirut" },
  { code: "LR", nameEs: "Liberia", nameEn: "Liberia", block: 2, dialCode: "+231", currencyCode: "LRD", dateFormat: "DMY", timezone: "Africa/Monrovia" },
  { code: "LY", nameEs: "Libia", nameEn: "Libya", block: 2, dialCode: "+218", currencyCode: "LYD", dateFormat: "DMY", timezone: "Africa/Tripoli" },
  { code: "LI", nameEs: "Liechtenstein", nameEn: "Liechtenstein", block: 2, dialCode: "+423", currencyCode: "CHF", dateFormat: "DMY", timezone: "Europe/Vaduz" },
  { code: "LT", nameEs: "Lituania", nameEn: "Lithuania", block: 2, dialCode: "+370", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Vilnius" },
  { code: "LU", nameEs: "Luxemburgo", nameEn: "Luxembourg", block: 2, dialCode: "+352", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Luxembourg" },
  { code: "MO", nameEs: "Macao", nameEn: "Macao", block: 2, dialCode: "+853", currencyCode: "MOP", dateFormat: "DMY", timezone: "Asia/Macau" },
  { code: "MK", nameEs: "Macedonia del Norte", nameEn: "North Macedonia", block: 2, dialCode: "+389", currencyCode: "MKD", dateFormat: "DMY", timezone: "Europe/Skopje" },
  { code: "MG", nameEs: "Madagascar", nameEn: "Madagascar", block: 2, dialCode: "+261", currencyCode: "MGA", dateFormat: "DMY", timezone: "Indian/Antananarivo" },
  { code: "MY", nameEs: "Malasia", nameEn: "Malaysia", block: 2, dialCode: "+60", currencyCode: "MYR", dateFormat: "DMY", timezone: "Asia/Kuala_Lumpur" },
  { code: "MW", nameEs: "Malaui", nameEn: "Malawi", block: 2, dialCode: "+265", currencyCode: "MWK", dateFormat: "DMY", timezone: "Africa/Blantyre" },
  { code: "MV", nameEs: "Maldivas", nameEn: "Maldives", block: 2, dialCode: "+960", currencyCode: "MVR", dateFormat: "DMY", timezone: "Indian/Maldives" },
  { code: "ML", nameEs: "Malí", nameEn: "Mali", block: 2, dialCode: "+223", currencyCode: "XOF", dateFormat: "DMY", timezone: "Africa/Bamako" },
  { code: "MT", nameEs: "Malta", nameEn: "Malta", block: 2, dialCode: "+356", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Malta" },
  { code: "MA", nameEs: "Marruecos", nameEn: "Morocco", block: 2, dialCode: "+212", currencyCode: "MAD", dateFormat: "DMY", timezone: "Africa/Casablanca" },
  { code: "MQ", nameEs: "Martinica", nameEn: "Martinique", block: 2, dialCode: "+596", currencyCode: "EUR", dateFormat: "DMY", timezone: "America/Martinique" },
  { code: "MU", nameEs: "Mauricio", nameEn: "Mauritius", block: 2, dialCode: "+230", currencyCode: "MUR", dateFormat: "DMY", timezone: "Indian/Mauritius" },
  { code: "MR", nameEs: "Mauritania", nameEn: "Mauritania", block: 2, dialCode: "+222", currencyCode: "MRU", dateFormat: "DMY", timezone: "Africa/Nouakchott" },
  { code: "YT", nameEs: "Mayotte", nameEn: "Mayotte", block: 2, dialCode: "+262", currencyCode: "EUR", dateFormat: "DMY", timezone: "Indian/Mayotte" },
  { code: "FM", nameEs: "Micronesia", nameEn: "Micronesia", block: 2, dialCode: "+691", currencyCode: "USD", dateFormat: "DMY", timezone: "Pacific/Chuuk" },
  { code: "MD", nameEs: "Moldavia", nameEn: "Moldova", block: 2, dialCode: "+373", currencyCode: "MDL", dateFormat: "DMY", timezone: "Europe/Chisinau" },
  { code: "MC", nameEs: "Mónaco", nameEn: "Monaco", block: 2, dialCode: "+377", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Monaco" },
  { code: "MN", nameEs: "Mongolia", nameEn: "Mongolia", block: 2, dialCode: "+976", currencyCode: "MNT", dateFormat: "DMY", timezone: "Asia/Ulaanbaatar" },
  { code: "ME", nameEs: "Montenegro", nameEn: "Montenegro", block: 2, dialCode: "+382", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Podgorica" },
  { code: "MS", nameEs: "Montserrat", nameEn: "Montserrat", block: 2, dialCode: "+1664", currencyCode: "XCD", dateFormat: "DMY", timezone: "America/Montserrat" },
  { code: "MZ", nameEs: "Mozambique", nameEn: "Mozambique", block: 2, dialCode: "+258", currencyCode: "MZN", dateFormat: "DMY", timezone: "Africa/Maputo" },
  { code: "NA", nameEs: "Namibia", nameEn: "Namibia", block: 2, dialCode: "+264", currencyCode: "NAD", dateFormat: "DMY", timezone: "Africa/Windhoek" },
  { code: "NR", nameEs: "Nauru", nameEn: "Nauru", block: 2, dialCode: "+674", currencyCode: "AUD", dateFormat: "DMY", timezone: "Pacific/Nauru" },
  { code: "NP", nameEs: "Nepal", nameEn: "Nepal", block: 2, dialCode: "+977", currencyCode: "NPR", dateFormat: "DMY", timezone: "Asia/Kathmandu" },
  { code: "NE", nameEs: "Níger", nameEn: "Niger", block: 2, dialCode: "+227", currencyCode: "XOF", dateFormat: "DMY", timezone: "Africa/Niamey" },
  { code: "NG", nameEs: "Nigeria", nameEn: "Nigeria", block: 2, dialCode: "+234", currencyCode: "NGN", dateFormat: "DMY", timezone: "Africa/Lagos" },
  { code: "NU", nameEs: "Niue", nameEn: "Niue", block: 2, dialCode: "+683", currencyCode: "NZD", dateFormat: "DMY", timezone: "Pacific/Niue" },
  { code: "NO", nameEs: "Noruega", nameEn: "Norway", block: 2, dialCode: "+47", currencyCode: "NOK", dateFormat: "DMY", timezone: "Europe/Oslo" },
  { code: "NC", nameEs: "Nueva Caledonia", nameEn: "New Caledonia", block: 2, dialCode: "+687", currencyCode: "XPF", dateFormat: "DMY", timezone: "Pacific/Noumea" },
  { code: "NZ", nameEs: "Nueva Zelanda", nameEn: "New Zealand", block: 2, dialCode: "+64", currencyCode: "NZD", dateFormat: "DMY", timezone: "Pacific/Auckland" },
  { code: "OM", nameEs: "Omán", nameEn: "Oman", block: 2, dialCode: "+968", currencyCode: "OMR", dateFormat: "DMY", timezone: "Asia/Muscat" },
  { code: "NL", nameEs: "Países Bajos", nameEn: "Netherlands", block: 2, dialCode: "+31", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Amsterdam" },
  { code: "PK", nameEs: "Pakistán", nameEn: "Pakistan", block: 2, dialCode: "+92", currencyCode: "PKR", dateFormat: "DMY", timezone: "Asia/Karachi" },
  { code: "PW", nameEs: "Palaos", nameEn: "Palau", block: 2, dialCode: "+680", currencyCode: "USD", dateFormat: "DMY", timezone: "Pacific/Palau" },
  { code: "PS", nameEs: "Palestina", nameEn: "Palestine", block: 2, dialCode: "+970", currencyCode: "ILS", dateFormat: "DMY", timezone: "Asia/Hebron" },
  { code: "PG", nameEs: "Papúa Nueva Guinea", nameEn: "Papua New Guinea", block: 2, dialCode: "+675", currencyCode: "PGK", dateFormat: "DMY", timezone: "Pacific/Port_Moresby" },
  { code: "PF", nameEs: "Polinesia Francesa", nameEn: "French Polynesia", block: 2, dialCode: "+689", currencyCode: "XPF", dateFormat: "DMY", timezone: "Pacific/Tahiti" },
  { code: "PL", nameEs: "Polonia", nameEn: "Poland", block: 2, dialCode: "+48", currencyCode: "PLN", dateFormat: "DMY", timezone: "Europe/Warsaw" },
  { code: "PT", nameEs: "Portugal", nameEn: "Portugal", block: 2, dialCode: "+351", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/Lisbon" },
  { code: "PR", nameEs: "Puerto Rico", nameEn: "Puerto Rico", block: 2, dialCode: "+1787", currencyCode: "USD", dateFormat: "MDY", timezone: "America/Puerto_Rico" },
  { code: "GB", nameEs: "Reino Unido", nameEn: "United Kingdom", block: 2, dialCode: "+44", currencyCode: "GBP", dateFormat: "DMY", timezone: "Europe/London" },
  { code: "CF", nameEs: "República Centroafricana", nameEn: "Central African Republic", block: 2, dialCode: "+236", currencyCode: "XAF", dateFormat: "DMY", timezone: "Africa/Bangui" },
  { code: "RE", nameEs: "Reunión", nameEn: "Réunion", block: 2, dialCode: "+262", currencyCode: "EUR", dateFormat: "DMY", timezone: "Indian/Reunion" },
  { code: "RW", nameEs: "Ruanda", nameEn: "Rwanda", block: 2, dialCode: "+250", currencyCode: "RWF", dateFormat: "DMY", timezone: "Africa/Kigali" },
  { code: "RO", nameEs: "Rumania", nameEn: "Romania", block: 2, dialCode: "+40", currencyCode: "RON", dateFormat: "DMY", timezone: "Europe/Bucharest" },
  { code: "RU", nameEs: "Rusia", nameEn: "Russia", block: 2, dialCode: "+7", currencyCode: "RUB", dateFormat: "DMY", timezone: "Europe/Moscow" },
  { code: "EH", nameEs: "Sáhara Occidental", nameEn: "Western Sahara", block: 2, dialCode: "+212", currencyCode: "MAD", dateFormat: "DMY", timezone: "Africa/El_Aaiun" },
  { code: "WS", nameEs: "Samoa", nameEn: "Samoa", block: 2, dialCode: "+685", currencyCode: "WST", dateFormat: "DMY", timezone: "Pacific/Apia" },
  { code: "AS", nameEs: "Samoa Americana", nameEn: "American Samoa", block: 2, dialCode: "+1684", currencyCode: "USD", dateFormat: "MDY", timezone: "Pacific/Pago_Pago" },
  { code: "BL", nameEs: "San Bartolomé", nameEn: "Saint Barthélemy", block: 2, dialCode: "+590", currencyCode: "EUR", dateFormat: "DMY", timezone: "America/St_Barthelemy" },
  { code: "KN", nameEs: "San Cristóbal y Nieves", nameEn: "Saint Kitts and Nevis", block: 2, dialCode: "+1869", currencyCode: "XCD", dateFormat: "DMY", timezone: "America/St_Kitts" },
  { code: "SM", nameEs: "San Marino", nameEn: "San Marino", block: 2, dialCode: "+378", currencyCode: "EUR", dateFormat: "DMY", timezone: "Europe/San_Marino" },
  { code: "MF", nameEs: "San Martín", nameEn: "Saint Martin", block: 2, dialCode: "+590", currencyCode: "EUR", dateFormat: "DMY", timezone: "America/Marigot" },
  { code: "PM", nameEs: "San Pedro y Miquelón", nameEn: "Saint Pierre and Miquelon", block: 2, dialCode: "+508", currencyCode: "EUR", dateFormat: "DMY", timezone: "America/Miquelon" },
  { code: "VC", nameEs: "San Vicente y las Granadinas", nameEn: "Saint Vincent and the Grenadines", block: 2, dialCode: "+1784", currencyCode: "XCD", dateFormat: "DMY", timezone: "America/St_Vincent" },
  { code: "SH", nameEs: "Santa Elena, Ascensión y Tristán de Acuña", nameEn: "Saint Helena, Ascension and Tristan da Cunha", block: 2, dialCode: "+290", currencyCode: "SHP", dateFormat: "DMY", timezone: "Atlantic/St_Helena" },
  { code: "LC", nameEs: "Santa Lucía", nameEn: "Saint Lucia", block: 2, dialCode: "+1758", currencyCode: "XCD", dateFormat: "DMY", timezone: "America/St_Lucia" },
  { code: "ST", nameEs: "Santo Tomé y Príncipe", nameEn: "São Tomé and Príncipe", block: 2, dialCode: "+239", currencyCode: "STN", dateFormat: "DMY", timezone: "Africa/Sao_Tome" },
  { code: "SN", nameEs: "Senegal", nameEn: "Senegal", block: 2, dialCode: "+221", currencyCode: "XOF", dateFormat: "DMY", timezone: "Africa/Dakar" },
  { code: "RS", nameEs: "Serbia", nameEn: "Serbia", block: 2, dialCode: "+381", currencyCode: "RSD", dateFormat: "DMY", timezone: "Europe/Belgrade" },
  { code: "SC", nameEs: "Seychelles", nameEn: "Seychelles", block: 2, dialCode: "+248", currencyCode: "SCR", dateFormat: "DMY", timezone: "Indian/Mahe" },
  { code: "SL", nameEs: "Sierra Leona", nameEn: "Sierra Leone", block: 2, dialCode: "+232", currencyCode: "SLE", dateFormat: "DMY", timezone: "Africa/Freetown" },
  { code: "SG", nameEs: "Singapur", nameEn: "Singapore", block: 2, dialCode: "+65", currencyCode: "SGD", dateFormat: "DMY", timezone: "Asia/Singapore" },
  { code: "SX", nameEs: "Sint Maarten", nameEn: "Sint Maarten", block: 2, dialCode: "+1721", currencyCode: "ANG", dateFormat: "DMY", timezone: "America/Lower_Princes" },
  { code: "SY", nameEs: "Siria", nameEn: "Syria", block: 2, dialCode: "+963", currencyCode: "SYP", dateFormat: "DMY", timezone: "Asia/Damascus" },
  { code: "SO", nameEs: "Somalia", nameEn: "Somalia", block: 2, dialCode: "+252", currencyCode: "SOS", dateFormat: "DMY", timezone: "Africa/Mogadishu" },
  { code: "LK", nameEs: "Sri Lanka", nameEn: "Sri Lanka", block: 2, dialCode: "+94", currencyCode: "LKR", dateFormat: "DMY", timezone: "Asia/Colombo" },
  { code: "ZA", nameEs: "Sudáfrica", nameEn: "South Africa", block: 2, dialCode: "+27", currencyCode: "ZAR", dateFormat: "DMY", timezone: "Africa/Johannesburg" },
  { code: "SD", nameEs: "Sudán", nameEn: "Sudan", block: 2, dialCode: "+249", currencyCode: "SDG", dateFormat: "DMY", timezone: "Africa/Khartoum" },
  { code: "SS", nameEs: "Sudán del Sur", nameEn: "South Sudan", block: 2, dialCode: "+211", currencyCode: "SSP", dateFormat: "DMY", timezone: "Africa/Juba" },
  { code: "SE", nameEs: "Suecia", nameEn: "Sweden", block: 2, dialCode: "+46", currencyCode: "SEK", dateFormat: "DMY", timezone: "Europe/Stockholm" },
  { code: "CH", nameEs: "Suiza", nameEn: "Switzerland", block: 2, dialCode: "+41", currencyCode: "CHF", dateFormat: "DMY", timezone: "Europe/Zurich" },
  { code: "SR", nameEs: "Surinam", nameEn: "Suriname", block: 2, dialCode: "+597", currencyCode: "SRD", dateFormat: "DMY", timezone: "America/Paramaribo" },
  { code: "SJ", nameEs: "Svalbard y Jan Mayen", nameEn: "Svalbard and Jan Mayen", block: 2, dialCode: "+47", currencyCode: "NOK", dateFormat: "DMY", timezone: "Arctic/Longyearbyen" },
  { code: "TH", nameEs: "Tailandia", nameEn: "Thailand", block: 2, dialCode: "+66", currencyCode: "THB", dateFormat: "DMY", timezone: "Asia/Bangkok" },
  { code: "TW", nameEs: "Taiwán", nameEn: "Taiwan", block: 2, dialCode: "+886", currencyCode: "TWD", dateFormat: "DMY", timezone: "Asia/Taipei" },
  { code: "TZ", nameEs: "Tanzania", nameEn: "Tanzania", block: 2, dialCode: "+255", currencyCode: "TZS", dateFormat: "DMY", timezone: "Africa/Dar_es_Salaam" },
  { code: "TJ", nameEs: "Tayikistán", nameEn: "Tajikistan", block: 2, dialCode: "+992", currencyCode: "TJS", dateFormat: "DMY", timezone: "Asia/Dushanbe" },
  { code: "IO", nameEs: "Territorio Británico del Océano Índico", nameEn: "British Indian Ocean Territory", block: 2, dialCode: "+246", currencyCode: "USD", dateFormat: "DMY", timezone: "Indian/Chagos" },
  { code: "TF", nameEs: "Territorios Australes Franceses", nameEn: "French Southern Territories", block: 2, dialCode: "+262", currencyCode: "EUR", dateFormat: "DMY", timezone: "Indian/Kerguelen" },
  { code: "TL", nameEs: "Timor Oriental", nameEn: "Timor-Leste", block: 2, dialCode: "+670", currencyCode: "USD", dateFormat: "DMY", timezone: "Asia/Dili" },
  { code: "TG", nameEs: "Togo", nameEn: "Togo", block: 2, dialCode: "+228", currencyCode: "XOF", dateFormat: "DMY", timezone: "Africa/Lome" },
  { code: "TK", nameEs: "Tokelau", nameEn: "Tokelau", block: 2, dialCode: "+690", currencyCode: "NZD", dateFormat: "DMY", timezone: "Pacific/Fakaofo" },
  { code: "TO", nameEs: "Tonga", nameEn: "Tonga", block: 2, dialCode: "+676", currencyCode: "TOP", dateFormat: "DMY", timezone: "Pacific/Tongatapu" },
  { code: "TT", nameEs: "Trinidad y Tobago", nameEn: "Trinidad and Tobago", block: 2, dialCode: "+1868", currencyCode: "TTD", dateFormat: "DMY", timezone: "America/Port_of_Spain" },
  { code: "TN", nameEs: "Túnez", nameEn: "Tunisia", block: 2, dialCode: "+216", currencyCode: "TND", dateFormat: "DMY", timezone: "Africa/Tunis" },
  { code: "TM", nameEs: "Turkmenistán", nameEn: "Turkmenistan", block: 2, dialCode: "+993", currencyCode: "TMT", dateFormat: "DMY", timezone: "Asia/Ashgabat" },
  { code: "TR", nameEs: "Turquía", nameEn: "Türkiye", block: 2, dialCode: "+90", currencyCode: "TRY", dateFormat: "DMY", timezone: "Europe/Istanbul" },
  { code: "TV", nameEs: "Tuvalu", nameEn: "Tuvalu", block: 2, dialCode: "+688", currencyCode: "AUD", dateFormat: "DMY", timezone: "Pacific/Funafuti" },
  { code: "UA", nameEs: "Ucrania", nameEn: "Ukraine", block: 2, dialCode: "+380", currencyCode: "UAH", dateFormat: "DMY", timezone: "Europe/Kyiv" },
  { code: "UG", nameEs: "Uganda", nameEn: "Uganda", block: 2, dialCode: "+256", currencyCode: "UGX", dateFormat: "DMY", timezone: "Africa/Kampala" },
  { code: "UZ", nameEs: "Uzbekistán", nameEn: "Uzbekistan", block: 2, dialCode: "+998", currencyCode: "UZS", dateFormat: "DMY", timezone: "Asia/Tashkent" },
  { code: "VU", nameEs: "Vanuatu", nameEn: "Vanuatu", block: 2, dialCode: "+678", currencyCode: "VUV", dateFormat: "DMY", timezone: "Pacific/Efate" },
  { code: "VN", nameEs: "Vietnam", nameEn: "Vietnam", block: 2, dialCode: "+84", currencyCode: "VND", dateFormat: "DMY", timezone: "Asia/Ho_Chi_Minh" },
  { code: "WF", nameEs: "Wallis y Futuna", nameEn: "Wallis and Futuna", block: 2, dialCode: "+681", currencyCode: "XPF", dateFormat: "DMY", timezone: "Pacific/Wallis" },
  { code: "YE", nameEs: "Yemen", nameEn: "Yemen", block: 2, dialCode: "+967", currencyCode: "YER", dateFormat: "DMY", timezone: "Asia/Aden" },
  { code: "DJ", nameEs: "Yibuti", nameEn: "Djibouti", block: 2, dialCode: "+253", currencyCode: "DJF", dateFormat: "DMY", timezone: "Africa/Djibouti" },
  { code: "ZM", nameEs: "Zambia", nameEn: "Zambia", block: 2, dialCode: "+260", currencyCode: "ZMW", dateFormat: "DMY", timezone: "Africa/Lusaka" },
  { code: "ZW", nameEs: "Zimbabue", nameEn: "Zimbabwe", block: 2, dialCode: "+263", currencyCode: "ZWL", dateFormat: "DMY", timezone: "Africa/Harare" },
];

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function countryByCode(code: string | null | undefined): Country | null {
  if (!code) return null;
  return BY_CODE.get(code.toUpperCase()) ?? null;
}

/** Los dos bloques por separado, para los encabezados del combobox (C.2). */
export function countriesGrouped(): { quickAccess: Country[]; rest: Country[] } {
  return {
    quickAccess: COUNTRIES.filter((c) => c.block === 1),
    rest: COUNTRIES.filter((c) => c.block === 2),
  };
}

/**
 * Opciones del selector de código telefónico del paso 1. Mismo orden de
 * presentación: los países de la audiencia primero.
 */
export function dialCodeOptions(): Array<{
  code: string;
  dialCode: string;
  nameEs: string;
  nameEn: string;
}> {
  return COUNTRIES.map(({ code, dialCode, nameEs, nameEn }) => ({
    code,
    dialCode,
    nameEs,
    nameEn,
  }));
}
