-- ═══════════════════════════════════════════════════════════════════════
-- ANDEX — 0003 SEED
--   · modules            — §7.4 EXACTO (7 módulos, ids fijos 1–7)
--   · module_relevance   — base_score de BASE_RELEVANCE §3.3.1 +
--                          alt_title por contexto según la tabla §4.2.1
--   · external_resources — los 7 trámites de la tabla §6, con
--                          instructions_json de 3 pasos al estilo §5-M1
--
-- Idempotencia: UPSERT (ON CONFLICT ... DO UPDATE) — re-ejecutar converge
-- al contenido del PRD sin duplicar filas. external_resources usa UUIDs
-- fijos para que el upsert por id sea posible.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- 1. Módulos (§7.4, transcripción fiel)
-- ─────────────────────────────────────────────────────────
INSERT INTO modules (id, title, slug, description, icon_name, accent_color, canonical_order, status) VALUES
(1, 'Bóveda Digital & Alertas',      'boveda',    'Guarda tus documentos y no pierdas ninguna fecha límite.', 'folder-lock', '#0F766E', 1, 'coming_soon'),
(2, 'Guía Migratoria & Consular',    'migracion', 'Visas, pasaportes y citas, paso a paso.',                   'plane',       '#102A43', 2, 'coming_soon'),
(3, 'Finanzas & Patrimonio',         'finanzas',  'Construye tu crédito y protege lo que ahorras.',            'trending-up', '#0E7C5A', 3, 'coming_soon'),
(4, 'Desarrollo Empresarial',        'negocio',   'Crea tu LLC y haz crecer tu negocio.',                      'building',    '#9A6B00', 4, 'coming_soon'),
(5, 'Comunidad & Vida Local',        'comunidad', 'Encuentra tu gente, eventos y servicios cerca de ti.',      'users',       '#12B8A6', 5, 'coming_soon'),
(6, 'Academia de Certificaciones',   'academia',  'Certifícate en carreras de alta demanda.',                  'graduation',  '#102A43', 6, 'coming_soon'),
(7, 'Conexión Laboral',              'empleo',    'Empleos que coinciden con tu perfil.',                      'briefcase',   '#0F766E', 7, 'coming_soon')
ON CONFLICT (id) DO UPDATE SET
    title           = EXCLUDED.title,
    slug            = EXCLUDED.slug,
    description     = EXCLUDED.description,
    icon_name       = EXCLUDED.icon_name,
    accent_color    = EXCLUDED.accent_color,
    canonical_order = EXCLUDED.canonical_order,
    status          = EXCLUDED.status;

-- El seed inserta ids explícitos en una columna SERIAL: hay que avanzar la
-- secuencia o el próximo INSERT sin id chocaría con id=1.
SELECT setval(pg_get_serial_sequence('modules', 'id'),
              (SELECT MAX(id) FROM modules));

-- ─────────────────────────────────────────────────────────
-- 2. Relevancia por contexto
--    base_score = BASE_RELEVANCE §3.3.1:
--      in_us:       M1 40 · M2 30 · M3 30 · M4 25 · M5 30 · M6 25 · M7 35
--      pre_arrival: M1 25 · M2 50 · M3 20 · M4 15 · M5 15 · M6 30 · M7  5
--    alt_title = tabla §4.2.1 ("Diferencias de copy, no de funcionalidad").
--    alt_description: el PRD solo especifica títulos por contexto; las
--    descripciones in_us reusan §7.4 y las pre_arrival son copy derivado
--    del PRD (§4.2.1, §5) — el copy visible final lo gobierna lib/i18n.
-- ─────────────────────────────────────────────────────────
INSERT INTO module_relevance (module_id, location_context, base_score, alt_title, alt_description) VALUES
-- Contexto in_us (títulos = §4.2.1 columna "Título in_us")
(1, 'in_us', 40, 'Bóveda Digital & Alertas',      'Guarda tus documentos y no pierdas ninguna fecha límite.'),
(2, 'in_us', 30, 'Trámites y Estatus Migratorio', 'Visas, pasaportes y citas, paso a paso.'),
(3, 'in_us', 30, 'Finanzas & Patrimonio',         'Construye tu crédito y protege lo que ahorras.'),
(4, 'in_us', 25, 'Desarrollo Empresarial',        'Crea tu LLC y haz crecer tu negocio.'),
(5, 'in_us', 30, 'Comunidad & Vida Local',        'Encuentra tu gente, eventos y servicios cerca de ti.'),
(6, 'in_us', 25, 'Academia de Certificaciones',   'Certifícate en carreras de alta demanda.'),
(7, 'in_us', 35, 'Conexión Laboral',              'Empleos que coinciden con tu perfil.'),
-- Contexto pre_arrival (títulos = §4.2.1 columna "Título pre_arrival")
(1, 'pre_arrival', 25, 'Tus documentos para el viaje',        'Reúne y organiza los documentos que vas a necesitar para viajar.'),
(2, 'pre_arrival', 50, 'Prepara tu visa y tu cita',           'Tu DS-160, tu cita consular y cada paso antes de viajar.'),
(3, 'pre_arrival', 20, 'Prepara tu llegada financiera',       'Organiza tu dinero antes del viaje y llega con un plan.'),
(4, 'pre_arrival', 15, 'Invierte o abre empresa en EE. UU.',  'Constituye tu LLC en EE. UU. sin ser residente.'),
(5, 'pre_arrival', 15, 'Conoce tu destino antes de llegar',   'Descubre cómo es la vida en la ciudad a la que llegas.'),
(6, 'pre_arrival', 30, 'Certifícate desde tu país',           'Empieza hoy una certificación de alta demanda desde tu país.'),
(7, 'pre_arrival',  5, 'Cómo funciona el mercado laboral',    'Entiende cómo se consigue empleo en EE. UU. antes de llegar.')
ON CONFLICT (module_id, location_context) DO UPDATE SET
    base_score      = EXCLUDED.base_score,
    alt_title       = EXCLUDED.alt_title,
    alt_description = EXCLUDED.alt_description;

-- ─────────────────────────────────────────────────────────
-- 3. Recursos externos (tabla §6) — instructions_json de 3 pasos (§5-M1)
--    Requisitos §6: last_verified_at visible al usuario; job semanal de
--    verificación de URLs (pendiente, fuera de esta migración).
--    UUIDs fijos → seed idempotente por id.
-- ─────────────────────────────────────────────────────────
INSERT INTO external_resources
    (id, module_slug, label, official_url, scope_type, scope_value, location_context, instructions_json, last_verified_at, verified_by, status)
VALUES
-- M1 · Tracking Estado de Caso (USCIS) — nacional, ambos contextos.
-- Pasos: transcripción fiel del modal de 3 pasos de §5-M1.
('a0000000-0000-4000-8000-000000000001', 'boveda',
 'Consultar Estado Oficial de Mi Caso (USCIS)',
 'https://egov.uscis.gov/casestatus/',
 'national', NULL, NULL,
 '[
   {"step": 1, "text": "Copia tu número de recibo (ej. EAC1234567890)."},
   {"step": 2, "text": "Haz clic en el enlace seguro oficial."},
   {"step": 3, "text": "Pega el número en el portal del gobierno."}
 ]'::jsonb,
 now(), 'ANDEX seed v1 (PRD §6)', 'active'),

-- M1 · Fechas de Corte Inmigración (EOIR) — nacional, ambos contextos.
('a0000000-0000-4000-8000-000000000002', 'boveda',
 'Consultar fechas de corte de inmigración (EOIR)',
 'https://portal.eoir.justice.gov',
 'national', NULL, NULL,
 '[
   {"step": 1, "text": "Ten a la mano tu número A (Alien Registration, 9 dígitos)."},
   {"step": 2, "text": "Haz clic en el enlace seguro oficial."},
   {"step": 3, "text": "Ingresa tu número A en el portal para consultar tu caso y tus fechas de corte."}
 ]'::jsonb,
 now(), 'ANDEX seed v1 (PRD §6)', 'active'),

-- M2 · Formulario Visa DS-160 — nacional, contexto pre_arrival.
('a0000000-0000-4000-8000-000000000003', 'migracion',
 'Llenar el formulario de visa DS-160',
 'https://ceac.state.gov',
 'national', NULL, 'pre_arrival',
 '[
   {"step": 1, "text": "Reúne tu pasaporte vigente y una foto digital reciente."},
   {"step": 2, "text": "Haz clic en el enlace seguro oficial de CEAC."},
   {"step": 3, "text": "Guarda tu Application ID apenas empieces; lo necesitas para retomar el formulario."}
 ]'::jsonb,
 now(), 'ANDEX seed v1 (PRD §6)', 'active'),

-- M2 · Citas Consulares — por país (§6: "Portales de Embajadas por País").
-- Se siembran MX, CO y GT como ejemplos de scope 'country'; el directorio
-- completo por nacionalidad se cura en iteraciones siguientes.
('a0000000-0000-4000-8000-000000000004', 'migracion',
 'Citas consulares — Embajada de EE. UU. en México',
 'https://mx.usembassy.gov/visas/',
 'country', 'MX', 'pre_arrival',
 '[
   {"step": 1, "text": "Completa primero tu DS-160 y guarda tu número de confirmación."},
   {"step": 2, "text": "Haz clic en el portal oficial de la embajada."},
   {"step": 3, "text": "Crea tu cuenta en el sistema de citas y agenda tu cita consular."}
 ]'::jsonb,
 now(), 'ANDEX seed v1 (PRD §6)', 'active'),

('a0000000-0000-4000-8000-000000000005', 'migracion',
 'Citas consulares — Embajada de EE. UU. en Colombia',
 'https://co.usembassy.gov/visas/',
 'country', 'CO', 'pre_arrival',
 '[
   {"step": 1, "text": "Completa primero tu DS-160 y guarda tu número de confirmación."},
   {"step": 2, "text": "Haz clic en el portal oficial de la embajada."},
   {"step": 3, "text": "Crea tu cuenta en el sistema de citas y agenda tu cita consular."}
 ]'::jsonb,
 now(), 'ANDEX seed v1 (PRD §6)', 'active'),

('a0000000-0000-4000-8000-000000000006', 'migracion',
 'Citas consulares — Embajada de EE. UU. en Guatemala',
 'https://gt.usembassy.gov/visas/',
 'country', 'GT', 'pre_arrival',
 '[
   {"step": 1, "text": "Completa primero tu DS-160 y guarda tu número de confirmación."},
   {"step": 2, "text": "Haz clic en el portal oficial de la embajada."},
   {"step": 3, "text": "Crea tu cuenta en el sistema de citas y agenda tu cita consular."}
 ]'::jsonb,
 now(), 'ANDEX seed v1 (PRD §6)', 'active'),

-- M2 · Citas Licencia de Manejo — DMV por estado (piloto: Utah), in_us.
('a0000000-0000-4000-8000-000000000007', 'migracion',
 'Agendar cita para tu licencia de manejo (DMV Utah)',
 'https://dmv.utah.gov',
 'state', 'UT', 'in_us',
 '[
   {"step": 1, "text": "Reúne tus documentos de identidad y dos comprobantes de domicilio en Utah."},
   {"step": 2, "text": "Haz clic en el enlace seguro oficial del DMV de Utah."},
   {"step": 3, "text": "Agenda tu cita en línea y lleva tus documentos el día de la visita."}
 ]'::jsonb,
 now(), 'ANDEX seed v1 (PRD §6)', 'active'),

-- M4 · Registro de LLC — Division of Corporations de Utah.
-- location_context NULL a propósito: un no residente sí puede constituir
-- una LLC desde el extranjero (§4.2.1, situación inversion_remota §3.3.1).
('a0000000-0000-4000-8000-000000000008', 'negocio',
 'Registrar tu LLC en Utah (Division of Corporations)',
 'https://corporations.utah.gov',
 'state', 'UT', NULL,
 '[
   {"step": 1, "text": "Elige el nombre de tu empresa y verifica que esté disponible en Utah."},
   {"step": 2, "text": "Haz clic en el portal oficial de corporaciones de Utah."},
   {"step": 3, "text": "Completa el registro en línea y guarda tu confirmación y número de entidad."}
 ]'::jsonb,
 now(), 'ANDEX seed v1 (PRD §6)', 'active'),

-- M6 · Registro PTIN (IRS) — nacional, ambos contextos (§6: irs.gov/ptin).
('a0000000-0000-4000-8000-000000000009', 'academia',
 'Solicitar tu PTIN del IRS (preparador de impuestos)',
 'https://www.irs.gov/ptin',
 'national', NULL, NULL,
 '[
   {"step": 1, "text": "Ten a la mano tu SSN o ITIN y tu declaración de impuestos más reciente."},
   {"step": 2, "text": "Haz clic en el enlace seguro oficial del IRS."},
   {"step": 3, "text": "Crea tu cuenta PTIN y completa la solicitud en línea."}
 ]'::jsonb,
 now(), 'ANDEX seed v1 (PRD §6)', 'active')

ON CONFLICT (id) DO UPDATE SET
    module_slug       = EXCLUDED.module_slug,
    label             = EXCLUDED.label,
    official_url      = EXCLUDED.official_url,
    scope_type        = EXCLUDED.scope_type,
    scope_value       = EXCLUDED.scope_value,
    location_context  = EXCLUDED.location_context,
    instructions_json = EXCLUDED.instructions_json,
    last_verified_at  = EXCLUDED.last_verified_at,
    verified_by       = EXCLUDED.verified_by,
    status            = EXCLUDED.status;
