# Database Overview

> **Complete reference for the Supabase backend architecture**
>
> Last updated: 2025-12-28 | Auto-generated from live database schema

---

## Table of Contents

- [Introduction](#introduction)
- [Architecture Patterns](#architecture-patterns)
- [Core Tables](#core-tables)
- [Database Views](#database-views)
- [Security Model](#security-model)
- [Quick Reference](#quick-reference)
- [Related Documentation](#related-documentation)

---

## Introduction

This Supabase backend implements a comprehensive business partner management system for clubs and organizations. The database supports multi-tenancy, temporal tracking, and advanced relationship management between personas (natural persons) and empresas (companies).

### Key Features

- ✅ **Class Table Inheritance (CTI)** - Efficient polymorphic data modeling
- ✅ **Multi-Tenancy** - Organization-based data isolation
- ✅ **Soft Delete** - Non-destructive data removal
- ✅ **Temporal Tracking** - Historical relationship and assignment data
- ✅ **Row Level Security (RLS)** - Database-enforced permissions
- ✅ **JSONB Flexibility** - Extensible metadata storage
- ✅ **Automated Auditing** - Complete change tracking

---

## Architecture Patterns

### 1. Class Table Inheritance (CTI)

The system uses CTI to model different types of business partners efficiently:

```
business_partners (base table)
├── personas (natural persons specialization)
└── empresas (companies specialization)
```

**How it works:**
- `business_partners` contains common fields (email, phone, status, organization)
- `personas` and `empresas` extend with specialized fields
- Primary key relationship: `personas.id` → `business_partners.id` (1:1)
- `tipo_actor` discriminator field identifies the specialization type

**Benefits:**
- ✅ No NULL fields in specialized tables
- ✅ Enforced referential integrity
- ✅ Efficient queries with JOIN operations
- ✅ Clear data model separation

### 2. Multi-Tenancy

Every business partner, relationship, and action belongs to an `organizacion_id`:

- **Table:** `organizations` (clubs, divisions, branches)
- **Pattern:** Foreign key on all main tables
- **Enforcement:** RLS policies filter by user's organization membership
- **Hierarchy:** Organizations can have parent-child relationships

**Current Implementation:**
- RLS policies use `can_user_v2()` function to check permissions
- Users belong to organizations via `organization_members` table
- Role-based permissions via `roles` and `role_permissions` tables

### 3. Soft Delete Pattern

All tables use `eliminado_en` timestamp instead of hard DELETE:

```sql
-- Soft delete (RECOMMENDED)
UPDATE business_partners
SET eliminado_en = NOW(), eliminado_por = auth.uid()
WHERE id = 'xxx';

-- Queries automatically filter soft-deleted records
SELECT * FROM business_partners WHERE eliminado_en IS NULL;
```

**Benefits:**
- ✅ Data recovery capability
- ✅ Audit trail preservation
- ✅ Historical analysis
- ✅ Compliance requirements

### 4. Temporal Tracking

Relationships and action assignments support time-based validity:

- **Fields:** `fecha_inicio`, `fecha_fin`
- **Generated Column:** `es_vigente` (true when `fecha_fin IS NULL`)
- **Views:** `v_asignaciones_vigentes`, `v_asignaciones_historial`

**Use Cases:**
- Track ownership history of club shares (acciones)
- Manage employment relationships over time
- Support historical reporting and analytics

---

## Core Tables

### Business Partners Domain

| Table | Rows | Purpose |
|-------|------|---------|
| **organizations** | 1 | Multi-tenancy foundation, club/division hierarchy |
| **business_partners** | 13 | Base table for all partners (CTI pattern) |
| **personas** | 9 | Natural persons (members, contacts) |
| **empresas** | 4 | Companies (corporate members, sponsors) |
| **bp_relaciones** | 1 | Relationships between business partners |

### Acciones Domain (Club Shares)

| Table | Rows | Purpose |
|-------|------|---------|
| **acciones** | 25 | Master table of club shares/actions |
| **asignaciones_acciones** | 2 | Ownership and beneficiary assignments |

### Access Control Domain

| Table | Rows | Purpose |
|-------|------|---------|
| **organization_members** | 1 | User membership in organizations |
| **roles** | 4 | Available roles (owner, admin, analyst, auditor) |
| **role_permissions** | 82 | Fine-grained permission mappings |

**Total:** 10 tables, all with RLS enabled ✅

---

## Database Views

The system provides 7 pre-built views for common queries:

### Business Partners Views

- **`v_actores_unificados`** - Combined view of personas + empresas with unified field names
- **`v_personas_org`** - Filtered view of active personas per organization
- **`v_empresas_org`** - Filtered view of active empresas per organization
- **`v_empresas_completa`** - Complete empresa data with joins to organizations and rep legal

### Acciones Views

- **`v_asignaciones_vigentes`** - Current active assignments with BP details
- **`v_asignaciones_historial`** - Complete assignment history with status tracking
- **`v_acciones_asignadas`** - Summary view showing dueño, titular, and beneficiarios per action

All views use `SECURITY INVOKER` to respect RLS policies.

> **📖 See:** [VIEWS.md](./VIEWS.md) for complete view definitions and usage examples

---

## Security Model

### Row Level Security (RLS)

**Status:** ✅ All 10 tables have RLS enabled

**Implementation:**
- 38 active RLS policies
- Permission-based access via `can_user_v2()` function
- Organization membership validation via `organization_members`
- Role-based permissions via `role_permissions` table

### Policy Patterns

1. **SELECT policies:** Check read permission on `organizacion_id`
2. **INSERT policies:** Validate insert permission (WITH CHECK clause)
3. **UPDATE policies:** Verify update permission on both old and new rows
4. **DELETE policies:** Confirm delete permission (soft delete recommended)

**Example Policy:**
```sql
CREATE POLICY "personas_select"
  ON personas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_partners bp
      WHERE bp.id = personas.id
        AND can_user_v2('personas', 'select', bp.organizacion_id)
    )
    AND eliminado_en IS NULL
  );
```

> **📖 See:** [RLS.md](./RLS.md) for complete policy documentation

---

## Quick Reference

### Auto-Generated Codes

| Entity | Format | Example | Generator |
|--------|--------|---------|-----------|
| Business Partners | `BP-0000001` | BP-0000123 | Trigger: `generar_codigo_bp` |
| Acciones | `0000` | 4398 | Manual (4 digits, unique) |
| Asignaciones | `000000` | 439800 | accion_codigo + subcodigo |

### Validation Functions

| Function | Purpose | Example Usage |
|----------|---------|---------------|
| `calcular_digito_verificacion_nit()` | NIT verification digit for Colombian tax IDs | `SELECT calcular_digito_verificacion_nit('900123456')` |
| `validar_consistencia_tipo_actor()` | Ensures each BP has exactly one specialization | Trigger on business_partners |
| `validar_asignacion_accion()` | Validates assignment type and subcode correspondence | Trigger on asignaciones_acciones |

### Trigger Functions

| Trigger | Table | Purpose |
|---------|-------|---------|
| `actualizar_timestamp` | All tables | Auto-update `actualizado_en` on UPDATE |
| `generar_codigo_bp` | business_partners | Auto-generate `codigo_bp` on INSERT |
| `generar_codigo_completo_asignacion` | asignaciones_acciones | Build `codigo_completo` from accion + subcodigo |
| `set_audit_user_columns` | All tables | Auto-set `creado_por`, `actualizado_por` |
| `set_deleted_by_on_soft_delete` | All tables | Auto-set `eliminado_por` when soft deleting |

---

## Related Documentation

### Database Documentation

- **[SCHEMA.md](./SCHEMA.md)** - Complete schema reference with ERD diagrams
- **[TABLES.md](./TABLES.md)** - Detailed data dictionary for all tables
- **[FUNCTIONS.md](./FUNCTIONS.md)** - Database functions and stored procedures
- **[VIEWS.md](./VIEWS.md)** - Pre-built views and usage examples
- **[RLS.md](./RLS.md)** - Row Level Security policies and patterns
- **[QUERIES.md](./QUERIES.md)** - SQL cookbook with common patterns

### API Documentation

- **[../api/README.md](../api/README.md)** - API overview and RPC functions index
- **[../api/CREAR_PERSONA.md](../api/CREAR_PERSONA.md)** - Create natural person API
- **[../api/CREAR_EMPRESA.md](../api/CREAR_EMPRESA.md)** - Create company API
- **[../api/BP_RELACIONES.md](../api/BP_RELACIONES.md)** - Relationship management API
- **[../api/ACCIONES.md](../api/ACCIONES.md)** - Club shares management API

---

## Database Statistics

**Current State (as of 2025-12-28):**

- 📊 **10 tables** (all with RLS enabled)
- 🔐 **38 RLS policies** (SELECT, INSERT, UPDATE, DELETE)
- 🔧 **36 database functions** (11 user-facing RPC functions)
- 📋 **7 database views** (with SECURITY INVOKER)
- 🎯 **1 custom enum type** (tipo_relacion_bp)
- 📦 **13 business partners** (9 personas + 4 empresas)
- 🎫 **25 club shares** (acciones)
- 🔗 **1 active relationship** (bp_relaciones)

---

## Getting Started

### For Frontend Developers

1. Review [../api/README.md](../api/README.md) for available RPC functions
2. Check [QUERIES.md](./QUERIES.md) for TypeScript integration patterns
3. Use [TABLES.md](./TABLES.md) as field reference for forms and validation

### For Database Administrators

1. Start with [SCHEMA.md](./SCHEMA.md) for ERD diagrams
2. Review [RLS.md](./RLS.md) for security model
3. Consult [FUNCTIONS.md](./FUNCTIONS.md) for internal logic

### For Data Analysts

1. Explore [VIEWS.md](./VIEWS.md) for pre-built queries
2. Use [QUERIES.md](./QUERIES.md) for custom SQL patterns
3. Reference [TABLES.md](./TABLES.md) for field definitions

---

**Last Generated:** 2025-12-28
**Database Version:** Supabase PostgreSQL 15
**Total Documentation Pages:** 7 (database) + 5 (API)
