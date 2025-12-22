-- Migration: Create database views for business partners
-- Created: 2024-12-21
-- Description: Adds v_personas_completa, v_empresas_completa, and v_actores_unificados views

-- =============================================================================
-- View: v_personas_completa
-- =============================================================================
-- Purpose: Denormalized view combining personas, business_partners, and organizations
-- Usage: Simplified queries for personas with all related data
-- =============================================================================

CREATE OR REPLACE VIEW v_personas_completa AS
SELECT
    p.*,
    bp.organizacion_id,
    bp.tipo_actor,
    bp.codigo_interno,
    bp.estado,
    bp.atributos AS atributos_bp,
    bp.creado_en AS bp_creado_en,
    bp.actualizado_en AS bp_actualizado_en,
    bp.eliminado_en AS bp_eliminado_en,
    o.nombre AS organizacion_nombre,
    (p.nombres || ' ' || p.apellidos) AS nombre_completo,
    (ce.nombres || ' ' || ce.apellidos) AS nombre_contacto_emergencia
FROM personas p
INNER JOIN business_partners bp ON p.id = bp.id
INNER JOIN organizations o ON bp.organizacion_id = o.id
LEFT JOIN personas ce ON p.contacto_emergencia_id = ce.id;

-- Add comment to view
COMMENT ON VIEW v_personas_completa IS 'Vista desnormalizada que combina datos de personas, business_partners y organizations para facilitar queries';

-- =============================================================================
-- View: v_empresas_completa
-- =============================================================================
-- Purpose: Denormalized view combining empresas, business_partners, organizations, and legal representative
-- Usage: Simplified queries for empresas with all related data
-- =============================================================================

CREATE OR REPLACE VIEW v_empresas_completa AS
SELECT
    e.*,
    bp.organizacion_id,
    bp.tipo_actor,
    bp.codigo_interno,
    bp.estado,
    bp.atributos AS atributos_bp,
    bp.creado_en AS bp_creado_en,
    bp.actualizado_en AS bp_actualizado_en,
    bp.eliminado_en AS bp_eliminado_en,
    o.nombre AS organizacion_nombre,
    (e.nit || '-' || e.digito_verificacion) AS nit_completo,
    (rl.nombres || ' ' || rl.apellidos) AS nombre_representante_legal
FROM empresas e
INNER JOIN business_partners bp ON e.id = bp.id
INNER JOIN organizations o ON bp.organizacion_id = o.id
LEFT JOIN personas rl ON e.representante_legal_id = rl.id;

-- Add comment to view
COMMENT ON VIEW v_empresas_completa IS 'Vista desnormalizada que combina datos de empresas, business_partners, organizations y representante legal';

-- =============================================================================
-- View: v_actores_unificados
-- =============================================================================
-- Purpose: Polymorphic view unifying ALL actors (personas + empresas) with common fields
-- Usage: Unified queries across all business partners regardless of type
-- =============================================================================

CREATE OR REPLACE VIEW v_actores_unificados AS
-- Personas
SELECT
    bp.id,
    bp.organizacion_id,
    bp.tipo_actor,
    (p.nombres || ' ' || p.apellidos) AS nombre,
    p.numero_documento AS identificacion,
    p.tipo_documento::text AS tipo_identificacion,
    p.email,
    p.telefono,
    p.direccion,
    bp.estado,
    bp.codigo_interno,
    bp.creado_en,
    bp.actualizado_en,
    bp.eliminado_en
FROM business_partners bp
INNER JOIN personas p ON bp.id = p.id
WHERE bp.tipo_actor = 'persona'

UNION ALL

-- Empresas
SELECT
    bp.id,
    bp.organizacion_id,
    bp.tipo_actor,
    e.razon_social AS nombre,
    (e.nit || '-' || e.digito_verificacion) AS identificacion,
    'NIT' AS tipo_identificacion,
    e.email,
    e.telefono,
    e.direccion,
    bp.estado,
    bp.codigo_interno,
    bp.creado_en,
    bp.actualizado_en,
    bp.eliminado_en
FROM business_partners bp
INNER JOIN empresas e ON bp.id = e.id
WHERE bp.tipo_actor = 'empresa';

-- Add comment to view
COMMENT ON VIEW v_actores_unificados IS 'Vista polimórfica que unifica TODOS los actores (personas + empresas) en una sola vista con campos comunes';
