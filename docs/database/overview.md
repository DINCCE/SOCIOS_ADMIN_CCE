# Database Overview

> **Comprehensive guide to the SOCIOS_ADMIN database architecture, design patterns, and data model**

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Architecture Principles](#architecture-principles)
- [Three-Tier CTI Hierarchy](#three-tier-cti-hierarchy)
- [Table Naming Convention](#table-naming-convention)
- [Schemas](#schemas)
- [Core Tables](#core-tables)
- [Security Model](#security-model)
- [Key Patterns](#key-patterns)
- [Database Functions](#database-functions)
- [Data Flow](#data-flow)
- [Migration History](#migration-history)
- [Related Documentation](#related-documentation)

---

## Executive Summary

**SOCIOS_ADMIN** is a multi-tenant Customer Relationship Management (CRM) system built on Supabase (PostgreSQL) for managing corporate partnerships, club memberships, commercial opportunities, and share ownership.

### Key Statistics

| Metric | Value |
|--------|-------|
| **Total Tables** | 10 (public schema) |
| **Total Functions** | 65+ |
| **RLS Coverage** | 100% (public schema) |
| **Total Migrations** | 72 |
| **Supported Currencies** | 45+ |
| **Cities in Catalog** | 1,367 |
| **Permission Mappings** | 92 |

### Core Capabilities

- Multi-tenant data isolation with hierarchical organizations
- Four-tier RBAC (Owner, Admin, Analyst, Auditor)
- Soft delete across all business tables
- Class Table Inheritance (CTI) for business partners
- Temporal data tracking for relationships and assignments
- Comprehensive audit trail
- Multi-currency financial transactions

---

## Architecture Principles

### Design Philosophy

The database follows these core principles:

1. **Multi-tenancy First** - All business data isolated by organization
2. **Security by Default** - RLS enabled on all tables
3. **No Hard Deletes** - Soft delete preserves data integrity
4. **Audit Everything** - Full creation/update tracking
5. **Flexible Storage** - JSONB for extensible attributes

### Technology Stack

- **Database**: PostgreSQL 15+ (via Supabase)
- **Security**: Row Level Security (RLS)
- **API**: PostgREST (auto-generated REST endpoints)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (buckets)

---

## Three-Tier CTI Hierarchy

The database implements a **Commercial-Trade-Item (CTI)** hierarchy for managing business entities and their relationships.

### Tier 1: Commercial (dm_actores)

**Purpose**: Base entity for all business partners using Class Table Inheritance (CTI).

```
dm_actores (Business Partners)
├── Persons (tipo_actor = 'persona')
│   ├── Individuals
│   ├── Contacts
│   └── Prospects
└── Companies (tipo_actor = 'empresa')
    ├── Corporations
    ├── Organizations
    └── Legal Entities
```

**Key Features**:
- Single table for both persons and companies
- Unified by `tipo_actor` enum
- Multi-tenant via `organizacion_id`
- Auto-generated codes (ACT-XXXXXXXX)
- JSONB profiles for flexible attributes
- Soft delete via `eliminado_en`

**Relationships**:
- Referenced by: `vn_relaciones_actores`, `vn_asociados`, `tr_doc_comercial`, `tr_tareas`

### Tier 2: Trade (tr_doc_comercial)

**Purpose**: Commercial documents and opportunities.

```
tr_doc_comercial
├── Opportunities (tipo = 'oportunidad')
├── Offers (tipo = 'oferta')
├── Sales Orders (tipo = 'pedido_venta')
└── Reservations (tipo = 'reserva')
```

**Key Features**:
- Self-referencing for document lineage
- Multi-currency support (45+ currencies)
- JSONB line items
- Status workflow (New → In Progress → Won/Lost/Discarded)
- Financial calculations (net, discount, tax, total)

### Tier 3: Item (dm_acciones + vn_asociados)

**Purpose**: Share/ownership management with temporal tracking.

```
dm_acciones (Master Shares)
└── vn_asociados (Assignments)
    ├── Owners (tipo_vinculo = 'propietario')
    ├── Title Holders (tipo_vinculo = 'titular')
    └── Beneficiaries (tipo_vinculo = 'beneficiario')
```

**Key Features**:
- `dm_acciones`: Master catalog (4-digit codes)
- `vn_asociados`: Temporal assignments with history
- Hierarchy: beneficiaries require parent assignments
- Subcode system (00=owner, 01=holder, 02+=beneficiaries)

---

## Table Naming Convention

All tables follow a logical prefix system that indicates their purpose:

| Prefix | Meaning | Examples |
|--------|---------|----------|
| **config_*** | Configuration/reference data | `config_organizaciones`, `config_roles`, `config_ciudades` |
| **dm_*** | Master data / Domain model | `dm_actores`, `dm_acciones` |
| **vn_*** | Relationships / Assignments (vinculo) | `vn_asociados`, `vn_relaciones_actores` |
| **tr_*** | Transactional data | `tr_doc_comercial`, `tr_tareas` |

### Prefix Details

#### `config_*` - Configuration Tables
System-wide reference data and settings:
- `config_organizaciones` - Multi-tenant organizations
- `config_organizacion_miembros` - User memberships
- `config_roles` - Role definitions
- `config_roles_permisos` - Permission mappings
- `config_ciudades` - Geographic catalog

#### `dm_*` - Master Data Tables
Core business entities with CTI pattern:
- `dm_actores` - Business partners (persons + companies)
- `dm_acciones` - Club shares/actions

#### `vn_*` - Relationship Tables
Many-to-many relationships with temporal tracking:
- `vn_asociados` - Share assignments
- `vn_relaciones_actores` - Actor relationships

#### `tr_*` - Transaction Tables
Transactional business documents:
- `tr_doc_comercial` - Commercial opportunities
- `tr_tareas` - Task management

---

## Schemas

### Public Schema

The main application schema containing all business tables.

| Category | Tables | Purpose |
|----------|--------|---------|
| **Configuration** | 5 | System config, orgs, roles, cities |
| **Master Data** | 2 | Actors, shares |
| **Relationships** | 2 | Assignments, relationships |
| **Transactions** | 2 | Commercial docs, tasks |
| **Total** | **10** | Complete CRM system |

### Auth Schema

Managed by Supabase Authentication:

| Table | Purpose |
|-------|---------|
| `auth.users` | User accounts |
| `auth.sessions` | Active sessions |
| `auth.identities` | OAuth/SSO identities |
| `auth.refresh_tokens` | JWT refresh tokens |
| `auth.mfa_factors` | MFA configuration |
| `auth.mfa_challenges` | MFA challenges |

**Note**: Direct access restricted. Use Supabase Auth APIs.

### Storage Schema

Managed by Supabase Storage:

| Table | Purpose |
|-------|---------|
| `storage.buckets` | Storage buckets |
| `storage.objects` | File metadata |
| `storage.migrations` | Schema migrations |

---

## Core Tables

### Configuration Tables

#### `config_organizaciones`

**Purpose**: Multi-tenant organization hierarchy.

**Key Columns**:
- `id` (uuid) - Unique identifier
- `nombre` (text) - Organization name
- `slug` (text) - URL-friendly identifier
- `tipo` (enum) - Type: club, asociacion, federacion, fundacion
- `organizacion_padre_id` (uuid) - Parent for hierarchy
- `direccion` (jsonb) - Address object
- `configuracion` (jsonb) - Technical settings

**Row Count**: 1

---

#### `config_organizacion_miembros`

**Purpose**: User-organization membership with roles.

**Key Columns**:
- `user_id` (uuid) - User reference
- `organization_id` (uuid) - Organization reference
- `role` (text) - owner, admin, analyst, auditor
- `atributos` (jsonb) - User preferences (UI theme, etc.)
- `nombres`, `apellidos` - Member info

**Primary Key**: (`user_id`, `organization_id`)

**Row Count**: 1

---

#### `config_roles` + `config_roles_permisos`

**Purpose**: Role definitions and 92 permission mappings.

**Roles**:
- `owner` - Full access including config
- `admin` - Full access to business tables
- `analyst` - Create/modify, no delete
- `auditor` - Read-only

**Resources**: 23 resources (tables, operations)

**Actions**: insert, select, update, delete

---

#### `config_ciudades`

**Purpose**: Geographic catalog with 1,367 cities.

**Key Columns**:
- `country_code`, `country_name` - Country
- `state_name` - State/province
- `city_name`, `city_code` - City
- `search_text` - Normalized search text

**Row Count**: 1,367

---

### Master Data Tables

#### `dm_actores`

**Purpose**: Business Partners (Class Table Inheritance).

**Identity**:
- `id` (uuid) - Shared identifier
- `codigo_bp` (text) - Auto: ACT-XXXXXXXX
- `tipo_actor` (enum) - persona, empresa
- `nat_fiscal` (enum) - natural, jurídica

**Identification**:
- `tipo_documento` (enum) - CC, CE, PA, TI, RC, PEP, PPT, NIT
- `num_documento` (text)
- `digito_verificacion` (smallint)

**Company Data**:
- `razon_social` (text)
- `nombre_comercial` (text)

**Person Data**:
- `primer_nombre`, `segundo_nombre`
- `primer_apellido`, `segundo_apellido`

**Contact**:
- `email_principal`, `email_secundario`
- `telefono_principal`, `telefono_secundario`
- `direccion_fisica`, `ciudad_id`

**Classifications**:
- `es_socio`, `es_cliente`, `es_proveedor`
- `estado_actor` - activo, inactivo, bloqueado

**Person Attributes**:
- `genero_actor` - masculino, femenino, otro
- `fecha_nacimiento`
- `estado_civil` - soltero, casado, union libre, etc.

**JSONB Profiles**:
- `perfil_identidad` - Expedition dates, nationality
- `perfil_profesional_corporativo` - Employment data
- `perfil_salud` - Health information
- `perfil_contacto` - Emergency contacts
- `perfil_intereses` - Preferences
- `perfil_preferencias` - Service preferences
- `perfil_redes` - Social media
- `perfil_compliance` - Risk assessment
- `perfil_referencias` - References

**Row Count**: 17

---

#### `dm_acciones`

**Purpose**: Club shares master catalog.

**Key Columns**:
- `id` (uuid) - Unique identifier
- `codigo_accion` (text) - 4-digit code, unique
- `estado` (enum) - disponible, asignada, arrendada, bloqueada, inactiva

**Row Count**: 25

---

### Relationship Tables

#### `vn_asociados`

**Purpose**: Share assignments with temporal history.

**Key Columns**:
- `accion_id` (uuid) - Share reference
- `asociado_id` (uuid) - Business partner reference
- `subcodigo` (text) - 2-digit: 00=owner, 01=holder, 02+=beneficiaries
- `codigo_completo` (text) - codigo_accion + subcode
- `fecha_inicio`, `fecha_fin` - Temporal tracking
- `es_vigente` (boolean) - Computed: fecha_fin IS NULL
- `tipo_vinculo` (enum) - propietario, titular, beneficiario, intermediario
- `modalidad` (enum) - propiedad, comodato, asignacion_corp, convenio
- `plan_comercial` (enum) - regular, plan dorado, joven ejecutivo, honorifico
- `asignacion_padre_id` (uuid) - Parent for beneficiary hierarchy

**Row Count**: 1

---

#### `vn_relaciones_actores`

**Purpose**: Relationships between business partners.

**Key Columns**:
- `bp_origen_id`, `bp_destino_id` - Actor references
- `tipo_relacion` (enum) - familiar, laboral, referencia, membresía, comercial
- `rol_origen`, `rol_destino` (enum) - cónyuge, padre, madre, hijo/a, etc.
- `fecha_inicio`, `fecha_fin` - Temporal tracking
- `es_actual` (boolean) - Computed: fecha_fin IS NULL
- `es_bidireccional` (boolean) - Query both directions

**Row Count**: 1

---

### Transaction Tables

#### `tr_doc_comercial`

**Purpose**: Commercial opportunities and documents.

**Structure**:
1. **Identity**: id, codigo (DOC-XXXXXXXX), tipo, estado
2. **Actors**: organizacion_id, asociado_id, solicitante_id, pagador_id
3. **Financial**: items (jsonb), moneda_iso, valor_neto/impuestos/total
4. **Context**: documento_origen_id (self-reference), notas, tags

**Types**:
- oportunidad, oferta, pedido_venta, reserva

**Subtypes**:
- sol_ingreso, sol_retiro, oferta_eventos, pedido_eventos

**States**:
- Nueva, En Progreso, Ganada, Pérdida, Descartada

**Currencies**: 45+ supported (COP, USD, EUR, etc.)

**Row Count**: 24

---

#### `tr_tareas`

**Purpose**: Task management with assignments.

**Key Columns**:
- `titulo`, `descripcion`
- `prioridad` (enum) - Baja, Media, Alta, Urgente
- `estado` (enum) - Pendiente, En Progreso, Terminada, Pausada, Cancelada
- `fecha_vencimiento` (date)
- `doc_comercial_id` (uuid) - Related opportunity
- `asignado_id` (uuid) - Assigned user
- `actor_relacionado_id` (uuid) - Related actor
- `codigo_tarea` (text) - Auto: TAR-XXXXXXXX
- `tags` (text[])

**Row Count**: 36

---

## Security Model

### Three-Layer Security

```
┌─────────────────────────────────────────────────────────────┐
│                     LAYER 1: Authentication                  │
│         User must be authenticated (auth.uid() required)    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     LAYER 2: Organization Membership         │
│  User must belong to organization (config_organizacion_     │
│  miembros.user_id = auth.uid() AND eliminado_en IS NULL)    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     LAYER 3: Permission Check                │
│   User's role must have permission (can_user_v2 checks      │
│   config_roles_permisos for resource + action + allow)      │
└─────────────────────────────────────────────────────────────┘
```

### Role-Based Access Control

| Role | Config Tables | Business Tables | Delete |
|------|---------------|-----------------|--------|
| **Owner** | ✅ All | ✅ All | ✅ Yes |
| **Admin** | ❌ None | ✅ All | ✅ Yes |
| **Analyst** | ❌ None | ✅ Insert/Update | ❌ No |
| **Auditor** | ❌ None | ✅ Select only | ❌ No |

### RLS Coverage

- **Public Schema**: 10/10 tables (100%)
- **Auth Schema**: 18/22 tables (82%)
- **Storage Schema**: 9/9 tables (100%)

**Key Function**: `can_user_v2(resource, action, org_id)` - Central authorization check

For complete RLS documentation, see [RLS.md](RLS.md).

---

## Key Patterns

### 1. Soft Delete

All business tables implement soft delete:

```sql
-- Mark as deleted
UPDATE dm_actores
SET eliminado_en = now(), eliminado_por = auth.uid()
WHERE id = '...';

-- Filter active records
SELECT * FROM dm_actores WHERE eliminado_en IS NULL;
```

**Benefits**:
- Preserves referential integrity
- Enables audit trails
- Supports data recovery

### 2. Audit Trail

Standard audit fields on all tables:

| Field | Type | Purpose |
|-------|------|---------|
| `creado_en` | timestamptz | Creation timestamp |
| `creado_por` | uuid → auth.users.id | Creator |
| `actualizado_en` | timestamptz | Last update |
| `actualizado_por` | uuid → auth.users.id | Last updater |
| `eliminado_en` | timestamptz | Soft delete |
| `eliminado_por` | uuid → auth.users.id | Deleter |

### 3. Multi-Tenancy

All business data isolated by organization:

```sql
-- Always filter by organization
SELECT * FROM dm_actores
WHERE organizacion_id = '...'
  AND eliminado_en IS NULL;
```

### 4. JSONB for Flexibility

Extensible attributes via JSONB:

```sql
-- Person profiles
perfil_identidad jsonb DEFAULT '{}'
perfil_profesional_corporativo jsonb DEFAULT '{}'
-- etc.

-- Organization settings
configuracion jsonb DEFAULT '{}'
direccion jsonb DEFAULT '{}'
```

### 5. Auto-Generated Codes

Unique identifiers for key entities:

| Entity | Pattern | Example |
|--------|---------|---------|
| Actor | ACT-XXXXXXXX | ACT-12345678 |
| Document | DOC-XXXXXXXX | DOC-87654321 |
| Task | TAR-XXXXXXXX | TAR-11112222 |
| Action | #### | 4398 |

### 6. Temporal Tracking

Relationships with start/end dates:

```sql
-- Active relationships
WHERE fecha_inicio <= CURRENT_DATE
  AND (fecha_fin IS NULL OR fecha_fin > CURRENT_DATE)
```

### 7. Class Table Inheritance (CTI)

Single table for multiple entity types:

```sql
-- Actors table
tipo_actor enum ('persona', 'empresa')

-- Person-specific columns
primer_nombre, primer_apellido, ...
-- Only populated when tipo_actor = 'persona'

-- Company-specific columns
razon_social, nombre_comercial, ...
-- Only populated when tipo_actor = 'empresa'
```

---

## Database Functions

### Core Categories

1. **Auth Functions** - JWT/email/uid helpers
2. **Permission Functions** - `can_user_v2()`, role checks
3. **Organization Functions** - `get_user_orgs()`
4. **Actor Functions** - Duplicate checks, soft delete
5. **Action Assignment Functions** - `vn_asociados_crear_asignacion()`
6. **Utility Functions** - Search, text normalization
7. **Trigger Functions** - Audit field management

### Key Functions

#### `can_user_v2(resource, action, org_id)`

**Purpose**: Central authorization check.

**Usage**:
```sql
SELECT can_user_v2('dm_actores', 'update', 'org-uuid');
```

---

#### `vn_asociados_crear_asignacion(...)`

**Purpose**: Create share assignment with validations.

**Features**:
- Permission checks
- Duplicate prevention
- Hierarchy enforcement
- Concurrency locking

---

#### `soft_delete_actor(actor_id)`

**Purpose**: Permission-aware soft delete.

**Returns**: `jsonb` with success status

---

#### `search_locations(query, max_results)`

**Purpose**: City/location search.

**Usage**:
```sql
SELECT * FROM search_locations('bogota', 10);
```

---

#### `dm_actores_documento_existe(...)`

**Purpose**: Check for duplicate documents.

**Returns**: TABLE with duplicate info

---

### Trigger Functions

| Function | Purpose |
|----------|---------|
| `set_actualizado_por_en` | Auto-set audit fields |
| `set_deleted_by_on_soft_delete` | Track deleter |
| `dm_actores_prevent_dup_doc_trg` | Prevent duplicates |
| `tr_doc_comercial_calcular_total` | Auto-calculate totals |

For complete function reference, see [FUNCTIONS.md](FUNCTIONS.md).

---

## Data Flow

### Actor Creation Flow

```
1. User inputs data in UI
   ↓
2. Validation (Zod schema)
   ↓
3. Server Action (app/actions/crear-actor.ts)
   ↓
4. Supabase INSERT (dm_actores table)
   ├─ RLS check: can_user_v2('dm_actores', 'insert', org_id)
   ├─ Duplicate check: dm_actores_documento_existe()
   ├─ Auto-generate: codigo_bp = ACT-XXXXXXXX
   └─ Set audit fields: creado_en, creado_por
   ↓
5. Revalidate cache
   ↓
6. UI updates (TanStack Query refetch)
```

### Share Assignment Flow

```
1. User selects action and associate
   ↓
2. Call: vn_asociados_crear_asignacion()
   ├─ Validate user auth
   ├─ Check permissions
   ├─ Validate action state
   ├─ Check uniqueness
   ├─ Validate hierarchy (if beneficiary)
   ├─ Lock for concurrency
   ├─ Generate subcodigo
   └─ Insert assignment
   ↓
3. Update action state (if needed)
   ↓
4. Return created record
```

### Commercial Document Flow

```
1. Create opportunity (tipo = 'oportunidad')
   ↓
2. Add line items (jsonb array)
   ↓
3. Trigger calculates totals:
   valor_total = valor_neto - valor_descuento + valor_impuestos
   ↓
4. Update status:
   Nueva → En Progreso → Ganada/Pérdida/Descartada
   ↓
5. Optionally create related document:
   documento_origen_id → new document
```

---

## Migration History

### Total Migrations: 72

**Latest Migration**: `20260115185337` - "add_tags_to_dm_actores"

### Migration Groups

| Phase | Focus | Migrations |
|-------|-------|------------|
| **Initial** | Schema setup | 1-10 |
| **Actors** | dm_actores creation | 11-25 |
| **Actions** | dm_acciones + vn_asociados | 26-35 |
| **Commerce** | tr_doc_comercial | 36-45 |
| **Tasks** | tr_tareas | 46-55 |
| **Relationships** | vn_relaciones_actores | 56-60 |
| **Security** | RLS + permissions | 61-68 |
| **Enhancements** | Tags, optimizations | 69-72 |

### Recent Changes

- Tag support for actors
- Enhanced RLS policies
- Performance optimizations
- Additional utility functions

---

## Current System Status

| Metric | Count |
|--------|-------|
| **Active Organizations** | 1 |
| **Total Users** | 2 |
| **Business Partners** | 17 |
| **Commercial Documents** | 24 |
| **Active Tasks** | 36 |
| **Share Assignments** | 1 |
| **Cities Catalog** | 1,367 |

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [TABLES.md](TABLES.md) | Complete table documentation with columns, types, relationships |
| [FUNCTIONS.md](FUNCTIONS.md) | All database functions with parameters and usage |
| [RLS.md](RLS.md) | Row Level Security policies and permission model |

---

## Best Practices

### DO

✅ Always filter by `organizacion_id`
✅ Always filter soft deletes: `eliminado_en IS NULL`
✅ Use `can_user_v2()` for permission checks
✅ Use soft delete instead of hard delete
✅ Set audit fields via triggers
✅ Use `vn_asociados_crear_asignacion()` for business logic
✅ Filter by organization in all queries

### DON'T

❌ Don't hard delete records
❌ Don't bypass RLS
❌ Don't forget `organizacion_id` in WHERE clauses
❌ Don't create custom API endpoints for basic CRUD (use PostgREST)
❌ Don't hardcode role checks
❌ Don't expose soft deleted records in views

---

## Development Guidelines

### Database Operations

**Use Supabase MCP tools** instead of CLI:

```typescript
// ❌ DON'T - Use CLI
supabase db push

// ✅ DO - Use MCP tools
mcp__supabase__execute_sql
mcp__supabase__apply_migration
mcp__supabase__list_tables
```

### Client Usage

```typescript
// Server Components/Actions
import { createClient } from '@/lib/supabase/server'

// Client Components (with TanStack Query)
import { createClient } from '@/lib/supabase/client'
```

### Server Actions Pattern

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createActor(data: ActorFormValues) {
  const supabase = await createClient()
  // Database operations...
  revalidatePath('/admin/socios/actores')
  return { success: true, message: '...' }
}
```

---

## Quick Reference

### Table Count by Type

| Type | Count |
|------|-------|
| config_* | 5 |
| dm_* | 2 |
| vn_* | 2 |
| tr_* | 2 |
| **Total** | **10** |

### Enums Reference

| Enum | Values |
|------|--------|
| `dm_actor_tipo_documento` | CC, CE, PA, TI, RC, PEP, PPT, NIT |
| `dm_actor_estado` | activo, inactivo, bloqueado |
| `dm_accion_estado` | disponible, asignada, arrendada, bloqueada, inactiva |
| `vn_asociados_tipo_vinculo` | propietario, titular, beneficiario, intermediario |
| `tr_doc_comercial_estados` | Nueva, En Progreso, Ganada, Pérdida, Descartada |
| `tr_tareas_prioridad` | Baja, Media, Alta, Urgente |
| `tr_tareas_estado` | Pendiente, En Progreso, Terminada, Pausada, Cancelada |

### Permission Matrix (Summary)

| Resource | Owner | Admin | Analyst | Auditor |
|----------|-------|-------|---------|---------|
| config_* | ✅ | ❌ | ❌ | ❌ |
| dm_* | ✅ | ✅ | ✅* | ✅ |
| vn_* | ✅ | ✅ | ✅* | ✅ |
| tr_* | ✅ | ✅ | ✅* | ✅ |

*Analyst: Insert/Select/Update only (no Delete)

---

**Last Updated**: 2025-01-18

**Database Version**: Migration 72 (20260115185337)
