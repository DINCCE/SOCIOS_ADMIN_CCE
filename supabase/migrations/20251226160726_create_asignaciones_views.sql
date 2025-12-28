-- ============================================================================
-- Migration: Views for asignaciones_acciones
-- Description: Optimized views for querying assignments with denormalized data
-- Author: Sistema
-- Date: 2025-12-26
-- ============================================================================

-- ============================================================================
-- 1. VIEW: v_asignaciones_vigentes
-- ============================================================================
-- Purpose: Show all active assignments with complete BP, action, and date info
-- Filters: fecha_fin IS NULL (only active) AND eliminado_en IS NULL (not deleted)

CREATE OR REPLACE VIEW public.v_asignaciones_vigentes
WITH (security_invoker = true) AS
SELECT
  -- Assignment
  aa.id AS asignacion_id,
  aa.codigo_completo,
  aa.tipo_asignacion,
  aa.subtipo_beneficiario,
  aa.subcodigo,
  aa.fecha_inicio,
  aa.precio_transaccion,
  aa.notas,

  -- Action
  a.id AS accion_id,
  a.codigo_accion,
  a.estado AS accion_estado,

  -- Business Partner (base)
  bp.id AS bp_id,
  bp.codigo_bp,
  bp.tipo_actor AS bp_tipo,

  -- Polymorphic name (persona or empresa)
  COALESCE(
    CONCAT(
      p.primer_nombre, ' ',
      COALESCE(p.segundo_nombre || ' ', ''),
      p.primer_apellido,
      COALESCE(' ' || p.segundo_apellido, '')
    ),
    e.razon_social
  ) AS bp_nombre,

  -- Polymorphic document
  COALESCE(p.numero_documento, e.nit) AS bp_documento,
  COALESCE(p.tipo_documento, 'NIT') AS bp_tipo_documento,

  -- BP email and phone
  bp.email_principal AS bp_email,
  bp.telefono_principal AS bp_telefono,

  -- Audit
  aa.creado_en,
  aa.creado_por,
  aa.actualizado_en,
  aa.actualizado_por

FROM asignaciones_acciones aa
  JOIN acciones a ON aa.accion_id = a.id
  JOIN business_partners bp ON aa.business_partner_id = bp.id
  LEFT JOIN personas p ON bp.id = p.id
  LEFT JOIN empresas e ON bp.id = e.id

WHERE aa.fecha_fin IS NULL          -- Only active
  AND aa.eliminado_en IS NULL       -- Not deleted
  AND a.eliminado_en IS NULL
  AND bp.eliminado_en IS NULL;

COMMENT ON VIEW public.v_asignaciones_vigentes IS
  'Denormalized view of active assignments (fecha_fin IS NULL). Includes action data, BP (polymorphic name and document), and audit info.';


-- ============================================================================
-- 2. VIEW: v_acciones_asignadas
-- ============================================================================
-- Purpose: Summary per action showing owner, holder, and beneficiaries
-- Columns: action info, owner (codigo, name), holder (codigo, name), beneficiaries (total, names array)

CREATE OR REPLACE VIEW public.v_acciones_asignadas
WITH (security_invoker = true) AS
SELECT
  -- Action
  a.id AS accion_id,
  a.codigo_accion,
  a.estado AS accion_estado,

  -- Owner (subcode 00)
  dueno.codigo_completo AS dueno_codigo,
  dueno.bp_nombre AS dueno_nombre,
  dueno.bp_tipo AS dueno_tipo,

  -- Holder (subcode 01)
  titular.codigo_completo AS titular_codigo,
  titular.bp_nombre AS titular_nombre,

  -- Beneficiaries (subcodes 02+)
  COUNT(DISTINCT beneficiarios.asignacion_id) AS total_beneficiarios,
  ARRAY_AGG(DISTINCT beneficiarios.bp_nombre) FILTER (WHERE beneficiarios.bp_nombre IS NOT NULL) AS beneficiarios_nombres,
  ARRAY_AGG(DISTINCT beneficiarios.codigo_completo) FILTER (WHERE beneficiarios.codigo_completo IS NOT NULL) AS beneficiarios_codigos

FROM acciones a

  -- LEFT JOIN for owner (may not exist) - using E'' for proper encoding
  LEFT JOIN v_asignaciones_vigentes dueno
    ON a.id = dueno.accion_id
    AND dueno.tipo_asignacion = E'dueño'

  -- LEFT JOIN for holder (may not exist)
  LEFT JOIN v_asignaciones_vigentes titular
    ON a.id = titular.accion_id
    AND titular.tipo_asignacion = 'titular'

  -- LEFT JOIN for beneficiaries (may be 0, 1 or many)
  LEFT JOIN v_asignaciones_vigentes beneficiarios
    ON a.id = beneficiarios.accion_id
    AND beneficiarios.tipo_asignacion = 'beneficiario'

WHERE a.eliminado_en IS NULL

GROUP BY
  a.id,
  a.codigo_accion,
  a.estado,
  dueno.codigo_completo,
  dueno.bp_nombre,
  dueno.bp_tipo,
  titular.codigo_completo,
  titular.bp_nombre;

COMMENT ON VIEW public.v_acciones_asignadas IS
  'Summary of assignments per action: owner, holder, total beneficiaries. Useful for reports and dashboards.';


-- ============================================================================
-- 3. VIEW: v_asignaciones_historial
-- ============================================================================
-- Purpose: Show ALL assignments (active + finalized) with complete history
-- Difference from v_asignaciones_vigentes: Does NOT filter by fecha_fin IS NULL

CREATE OR REPLACE VIEW public.v_asignaciones_historial
WITH (security_invoker = true) AS
SELECT
  -- Assignment
  aa.id AS asignacion_id,
  aa.codigo_completo,
  aa.tipo_asignacion,
  aa.subtipo_beneficiario,
  aa.subcodigo,
  aa.fecha_inicio,
  aa.fecha_fin,
  aa.es_vigente,
  aa.precio_transaccion,
  aa.notas,

  -- Derived status
  CASE
    WHEN aa.es_vigente THEN 'VIGENTE'::TEXT
    ELSE 'FINALIZADA'::TEXT
  END AS estado,

  -- Action
  a.id AS accion_id,
  a.codigo_accion,
  a.estado AS accion_estado,

  -- Business Partner
  bp.id AS bp_id,
  bp.codigo_bp,
  bp.tipo_actor AS bp_tipo,

  -- Polymorphic name
  COALESCE(
    CONCAT(
      p.primer_nombre, ' ',
      COALESCE(p.segundo_nombre || ' ', ''),
      p.primer_apellido,
      COALESCE(' ' || p.segundo_apellido, '')
    ),
    e.razon_social
  ) AS bp_nombre,

  -- Polymorphic document
  COALESCE(p.numero_documento, e.nit) AS bp_documento,

  -- Audit
  aa.creado_en,
  aa.creado_por,
  aa.actualizado_en,
  aa.actualizado_por,
  aa.eliminado_en,
  aa.eliminado_por

FROM asignaciones_acciones aa
  JOIN acciones a ON aa.accion_id = a.id
  JOIN business_partners bp ON aa.business_partner_id = bp.id
  LEFT JOIN personas p ON bp.id = p.id
  LEFT JOIN empresas e ON bp.id = e.id

WHERE aa.eliminado_en IS NULL       -- Exclude soft-deleted
  AND a.eliminado_en IS NULL
  AND bp.eliminado_en IS NULL;

COMMENT ON VIEW public.v_asignaciones_historial IS
  'View of all assignments (active and finalized) with complete history. Useful for audit and historical reports.';


-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
-- Views created: 3
--
-- RESULT:
-- - v_asignaciones_vigentes - Active assignments with denormalized BP/action data
-- - v_acciones_asignadas - Summary per action (owner, holder, beneficiaries)
-- - v_asignaciones_historial - Complete history (active + finalized assignments)
--
-- All views use WITH (security_invoker = true) to respect RLS
-- All views filter eliminado_en IS NULL to exclude soft-deleted records
-- All views use polymorphic joins for personas/empresas
-- ============================================================================
