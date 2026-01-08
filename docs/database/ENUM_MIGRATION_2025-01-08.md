# ENUM Renaming Migration - January 8, 2025

## Overview

On January 8, 2025, all database ENUM types were renamed to include table prefixes for better clarity and to avoid naming collisions. This migration affects TypeScript types, UI components, Server Actions, and documentation.

## Changed ENUM Names

### dm_actores Table ENUMs

| Old Name | New Name | Values |
|----------|----------|--------|
| `tipo_actor` | `tipo_actor_enum` | persona, empresa |
| `naturaleza_fiscal_actor` | `dm_actor_naturaleza_fiscal` | natural, jurídica |
| `tipo_documento_actor` | `dm_actor_tipo_documento` | CC, CE, PA, TI, RC, PEP, PPT, NIT |
| `regimen_tributario_actor` | `dm_actor_regimen_tributario` | responsable de iva, no responsable de iva, regimen simple tributacion, gran contribuyente, no sujeta a impuesto |
| `estado_actor` | `dm_actor_estado` | activo, inactivo, bloqueado |
| `genero_actor` | `dm_actor_genero` | masculino, femenino, otro, no aplica |
| `estado_civil_actor` | `dm_actor_estado_civil` | soltero, casado, union libre, divorciado, viudo |
| `nivel_educacion_enum` | `dm_actores_nivel_educacion` | sin estudios, primaria, bachillerato, técnica, profesional, especialización, maestría, doctorado |

### Relationships ENUM

| Old Name | New Name | Values |
|----------|----------|--------|
| `tipo_relacion_bp` | `dm_actores_tipo_relacion` | familiar, laboral, referencia, membresía, comercial, otra |

### tr_doc_comercial Table ENUMs

| Old Name | New Name | Values |
|----------|----------|--------|
| `tipo_doc_comercial_enum` | `tr_doc_comercial_tipo` | oportunidad, oferta, pedido_venta, reserva |
| `subtipo_doc_comercial_enum` | `tr_doc_comercial_subtipo` | sol_ingreso, sol_retiro, oferta_eventos, pedido_eventos |
| `estado_oportunidad_enum` | `tr_doc_comercial_estados` | Nueva, En Progreso, Ganada, Pérdida, Descartada |
| `moneda_iso_enum` | `config_moneda` | COP, MXN, ARS, BRL, CLP, PEN, USD, EUR, GBP, CAD, JPY, CHF, AUD, NZD, CNY, INR, KRW, SGD, HKD, SEK, NOK, DKK, PLN, TRY, ZAR, RUB, AED, SAR, ILS, CZK, HUF, RON, BGN, HRK, MYR, THB, IDR, PHP, VND, TWD, ISK |

### tr_tareas Table ENUMs

| Old Name | New Name | Values |
|----------|----------|--------|
| `estado_tarea_enum` | `tr_tareas_estado` | Pendiente, En Progreso, Terminada, Pausada, Cancelada |
| `prioridad_tarea_enum` | `tr_tareas_prioridad` | Baja, Media, Alta, Urgente |

### dm_acciones Table ENUMs

| Old Name | New Name | Values |
|----------|----------|--------|
| `estado_accion_enum` | `dm_accion_estado` | disponible, asignada, arrendada, bloqueada, inactiva |

### config Tables ENUMs

| Old Name | New Name | Values |
|----------|----------|--------|
| `tipo_organizacion_enum` | `config_organizacion_tipo` | club, asociacion, federacion, fundacion, otro |

## Application Changes

### New File: lib/db-types.ts

Created centralized type definitions file with:
- All TypeScript ENUM types
- Helper functions: `getEnumOptions()`, `formatEnumValue()`, `getStatusColor()`
- Arrays of valid values for each ENUM

### Updated Files

#### Server Actions (app/actions/)
- ✅ `personas.ts` - Updated table references
- ✅ `oportunidades.ts` - Updated table references
- ✅ `tareas.ts` - Updated table references
- ✅ `acciones.ts` - Updated table references

#### UI Components (features/ & components/)
- ✅ `features/procesos/oportunidades/columns.tsx`
- ✅ `features/procesos/tareas/columns.tsx`
- ✅ `components/procesos/oportunidades/oportunidades-board.tsx`
- ✅ `components/procesos/oportunidades/oportunidades-list.tsx`
- ✅ `components/procesos/tareas/tareas-board.tsx`
- ✅ `components/procesos/tareas/tareas-list.tsx`

#### Schemas (features/socios/types/)
- ✅ `socios-schema.ts` - Updated Zod validation schemas with new ENUM values

#### Documentation (docs/database/)
- ✅ `SCHEMA.md` - Updated ENUM references and table names
- ✅ `TABLES.md` - Updated column references
- ✅ `VIEWS.md` - Updated view definitions
- ✅ `OVERVIEW.md` - Updated architecture descriptions
- ✅ `QUERIES.md` - Updated query examples

## Table Name Changes

In addition to ENUM renaming, several tables were renamed for clarity:

| Old Name | New Name | Purpose |
|----------|----------|---------|
| `personas` | → `dm_actores` | Unified actor table (replaces CTI pattern) |
| `business_partners` | → `dm_actores` | Merged into dm_actores |
| `empresas` | → `dm_actores` | Merged into dm_actores |
| `tareas` | → `tr_tareas` | Transactional tasks table |
| `oportunidades` | → `tr_doc_comercial` | Commercial documents table |
| `acciones` | → `dm_acciones` | Club shares/actions table |
| `asignaciones_acciones` | → `vn_asociados` | Action assignments view |
| `organizations` | → `config_organizaciones` | Configuration table |
| `organization_members` | → `config_organizacion_miembros` | Configuration table |
| `geographic_locations` | → `config_ciudades` | Configuration table |

## Benefits

1. **Clarity**: ENUM names now clearly indicate which table they belong to
2. **Collision Avoidance**: No more naming conflicts between similar ENUMs
3. **Maintainability**: Easier to identify and update ENUM-related code
4. **Type Safety**: Better TypeScript autocompletion and type checking
5. **Consistency**: Standardized naming convention across the entire codebase

## Migration Notes

- **Breaking Change**: All TypeScript references to old ENUM names must be updated
- **Database**: ENUMs renamed directly in PostgreSQL (no migration script needed)
- **Application**: All code references updated via automated find-replace
- **Documentation**: All docs updated to reflect new names

## Related Migrations

- `20250105_drop_personas_empresas.sql` - Dropped old CTI pattern tables
- `20250108_rename_config_tables.sql` - Renamed config tables to Spanish

## Verification

To verify the migration:

```sql
-- List all ENUM types
SELECT typname
FROM pg_type
WHERE typtype = 'e'
AND typnamespace = 'public'::regnamespace
ORDER BY typname;
```

Expected output should show new names like:
- `tipo_actor_enum`
- `dm_actor_naturaleza_fiscal`
- `dm_actor_tipo_documento`
- `dm_actor_regimen_tributario`
- `dm_actor_estado`
- `dm_actor_genero`
- `dm_actor_estado_civil`
- `dm_actores_nivel_educacion`
- `dm_actores_tipo_relacion`
- `tr_doc_comercial_estados`
- `tr_doc_comercial_tipo`
- `tr_doc_comercial_subtipo`
- `tr_tareas_estado`
- `tr_tareas_prioridad`
- `dm_accion_estado`
- `config_moneda`
- `config_organizacion_tipo`

---

**Migration Date**: January 8, 2025
**Performed By**: Database Administrator
**Status**: ✅ Complete
