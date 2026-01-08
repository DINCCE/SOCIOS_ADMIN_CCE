# Database Schema - ERD and Relationships

> **Last Updated:** 2026-01-08
> **Total Tables:** 11
> **Total Relationships:** 25+

---

## Table of Contents

1. [Entity Relationship Diagram](#entity-relationship-diagram)
2. [Relationship Details](#relationship-details)
3. [Foreign Key References](#foreign-key-references)
4. [Table Hierarchies](#table-hierarchies)
5. [Index Summary](#index-summary)
6. [Function Dependencies](#function-dependencies)

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          AUTHENTICATION & AUTHORIZATION                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐         ┌──────────────────────┐         ┌──────────────┐   │
│  │ auth.users   │         │ config_organizacion_ │         │config_roles  │   │
│  │              │         │     miembros         │         │              │   │
│  │- id (PK)     │◄────────│- user_id (FK)       │         │- role (PK)   │   │
│  │- email       │         │- organization_id(FK)│─────────►│- metadata    │   │
│  │- ...         │         │- role               │         │              │   │
│  └──────────────┘         └──────────────────────┘         └──────┬───────┘   │
│          │                          │                            │            │
│          │                          │                            │            │
│          │             ┌─────────────┴───────────┐            │            │
│          │             │    config_roles_       │            │            │
│          │             │     permisos          │◄───────────┘            │
│          │             │- role (FK)            │                         │
│          │             │- resource             │                         │
│          │             │- action               │                         │
│          │             └───────────────────────┘                         │
│          ▼                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                           ┌──────────────────┐
                           │config_organiza- │
                           │    ciones        │◄────────────────────────────┐
                           │                  │                             │
                           │- id (PK)         │                             │
                           │- nombre          │                             │
                           │- slug            │                             │
                           │- metadata        │                             │
                           └────────┬─────────┘                             │
                                    │                                       │
                                    │ organi-                               │
                                    │ zacion_id                            │
                                    │ (FK)                                  │
                                    ▼                                       │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MASTER DATA                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐    │
│  │                          dm_actores                                   │    │
│  │                        (Business Partners)                             │    │
│  │                                                                      │    │
│  │- id (PK) ◄─────────────────────┬─────────────────────────────┐      │    │
│  │- codigo_bp                     │                             │      │    │
│  │- tipo_actor                    │                             │      │    │
│  │- organizacion_id (FK) ─────────┘                             │      │    │
│  │- ciudad_id (FK) ────────┐                                    │      │    │
│  │- email                   │                                    │      │    │
│  │- nombre_completo         │                                    │      │    │
│  │- razon_social            │                                    │      │    │
│  │- ...                     │                                    │      │    │
│  └──────────────────────────┼────────────────────────────────────┘      │    │
│                             │                                           │    │
│  ┌──────────────────────────┴───────────┐      ┌────────────────────┐    │    │
│  │              config_ciudades          │      │     dm_acciones    │    │    │
│  │                                     │      │   (Stock Cert.)    │    │    │
│  │- id (PK)                            │      │                     │    │    │
│  │- country_code                       │      │- id (PK)            │    │    │
│  │- city_name                          │      │- organizacion_id(FK)│────┼────┘
│  └─────────────────────────────────────┘      │- codigo_accion      │    │       │
│                                             │- estado             │    │       │
│                                             └─────────────────────┘    │       │
│                                                                         │       │
└─────────────────────────────────────────────────────────────────────────┘       │
                                                                          │       │
┌─────────────────────────────────────────────────────────────────────────────────┤
│                           TRANSACTIONS                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────┐       │
│  │                        tr_doc_comercial                             │       │
│  │                     (Business Opportunities)                       │       │
│  │                                                                     │       │
│  │- id (PK)                                                            │       │
│  │- organizacion_id (FK)                                              │       │
│  │- asociado_id (FK) ────────────┐                                    │       │
│  │- solicitante_id (FK) ─────────┼──────────┐                         │       │
│  │- responsable_id (FK) ─────────┼──────────┼─────────┐               │       │
│  │- pagador_id (FK) ──────────────┼──────────┼─────────┼───────┐       │       │
│  │- oportunidad_id (FK) ◄──────────┘          │         │       │       │       │
│  │- estado                                          │         │       │       │       │
│  │- valor_total                                     │         │       │       │       │
│  └─────────────────────────────────────────────────┼─────────┴───────┴───────┘       │
│                                                    │                            │
│  ┌───────────────────────────────────────────────┴─────┐    ┌─────────────────┐   │
│  │                       tr_tr_tareas                  │    │   vn_asociados   │   │
│  │                 (Task Management)              │    │  (Share Assign.) │   │
│  │                                                 │    │                 │   │
│  │- id (PK)                                        │    │- id (PK)       │   │
│  │- organizacion_id (FK)                           │    │- accion_id(FK) ├─┘   │
│  │- oportunidad_id (FK) ───────────────────────────┘    │- business_     │     │
│  │- asignado_a (FK) ────────────────────────────────┐    │  partner_id(FK)│     │
│  │- relacionado_con_bp (FK) ───────────────────────┼───►│- tipo_asign    │     │
│  │- estado                                          │    │- fecha_inicio  │     │
│  │- prioridad                                      │    │- fecha_fin     │     │
│  └─────────────────────────────────────────────────┘    └─────────────────┘     │
│                                                           ▲                      │
│                                                           │                      │
│  ┌───────────────────────────────────────────────────────┴──────────┐          │
│  │                    vn_relaciones_actores                     │          │
│  │               (Business Partner Relationships)                │          │
│  │                                                                │          │
│  │- id (PK)                                                       │          │
│  │- organizacion_id (FK)                                         │          │
│  │- bp_origen_id (FK) ─────────────────────────────┐            │          │
│  │- bp_destino_id (FK) ────────────────────────────┼───────────►│          │
│  │- tipo_relacion                                    │           │          │
│  │- fecha_inicio                                    │           │          │
│  │- fecha_fin                                       │           │          │
│  │- es_actual                                       │           │          │
│  └──────────────────────────────────────────────────┴───────────┴──────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

Legend:
  ──►  Foreign Key (One-to-Many)
  ◄──►  Bidirectional Foreign Key
  │    Relationship
  ▼    Reference direction
```

---

## Relationship Details

### 1. Organization (Multi-Tenancy Core)

**config_organizaciones** is the heart of multi-tenancy.

#### Relationships:
- **TO → config_organizacion_miembros** (One-to-Many)
  - One organization has many members
  - CASCADE delete: Deleting organization deletes all members

- **TO → dm_actores** (One-to-Many)
  - One organization has many business partners
  - CASCADE delete: Deleting organization deletes all actors

- **TO → dm_acciones** (One-to-Many)
  - One organization has many stock certificates
  - CASCADE delete: Deleting organization deletes all certificates

- **TO → tr_doc_comercial** (One-to-Many)
  - One organization has many opportunities
  - CASCADE delete: Deleting organization deletes all opportunities

- **TO → tr_tr_tareas** (One-to-Many)
  - One organization has many tasks
  - CASCADE delete: Deleting organization deletes all tasks

- **TO → vn_asociados** (One-to-Many)
  - One organization has many share assignments
  - CASCADE delete: Deleting organization deletes all assignments

- **TO → vn_relaciones_actores** (One-to-Many)
  - One organization has many relationships
  - CASCADE delete: Deleting organization deletes all relationships

---

### 2. Authentication & Authorization

#### auth.users → config_organizacion_miembros
- **Relationship:** One-to-Many
- **Description:** One user can belong to multiple config_organizaciones
- **On Delete:** CASCADE
- **Constraint:** UNIQUE(user_id, organization_id) per organization

#### config_organizacion_miembros → config_roles
- **Relationship:** Many-to-One
- **Description:** Each member has one role (owner/admin/member/viewer)
- **Roles:** Predefined in config_roles table

#### config_roles → config_roles_permisos
- **Relationship:** One-to-Many
- **Description:** Each role has multiple permissions
- **Permission Format:** `resource:action` (e.g., `tr_tareas:update`)

---

### 3. Business Partners (dm_actores)

#### dm_actores → config_organizaciones
- **Relationship:** Many-to-One
- **Description:** Each actor belongs to one organization
- **On Delete:** CASCADE

#### dm_actores → config_ciudades
- **Relationship:** Many-to-One (Optional)
- **Description:** Actor's city/location
- **On Delete:** SET NULL (city is optional)

#### dm_actores → tr_doc_comercial (as multiple roles)
- **solicitante_id:** Many-to-One - Who requested the opportunity
- **responsable_id:** Many-to-One - Who is responsible
- **pagador_id:** Many-to-One - Who will pay
- **On Delete:** SET NULL for all

#### dm_actores → tr_tr_tareas (as multiple roles)
- **asignado_a:** Many-to-One - Task assigned to this actor
- **relacionado_con_bp:** Many-to-One - Task related to this actor
- **On Delete:** SET NULL for both

#### dm_actores → vn_asociados
- **business_partner_id:** Many-to-One - Actor assigned to shares
- **On Delete:** CASCADE (assignment removed if actor deleted)

#### dm_actores → vn_relaciones_actores (as two roles)
- **bp_origen_id:** Many-to-One - Source actor in relationship
- **bp_destino_id:** Many-to-One - Target actor in relationship
- **On Delete:** CASCADE for both

---

### 4. Stock Certificates (dm_acciones)

#### dm_acciones → config_organizaciones
- **Relationship:** Many-to-One
- **Description:** Each certificate belongs to one organization
- **On Delete:** CASCADE

#### dm_acciones → vn_asociados
- **accion_id:** One-to-Many
- **Description:** One certificate has multiple assignments (dueño, titular, beneficiarios)
- **On Delete:** CASCADE

---

### 5. Business Opportunities (tr_doc_comercial)

#### tr_doc_comercial → config_organizaciones
- **Relationship:** Many-to-One
- **Description:** Each opportunity belongs to one organization
- **On Delete:** CASCADE

#### tr_doc_comercial → dm_actores
- **asociado_id:** Many-to-One - Main associated actor
- **solicitante_id:** Many-to-One - Requester
- **responsable_id:** Many-to-One - Responsible person
- **pagador_id:** Many-to-One - Payer
- **On Delete:** SET NULL for all

#### tr_doc_comercial → tr_tr_tareas
- **Relationship:** One-to-Many
- **Description:** One opportunity can have multiple tasks
- **On Delete:** SET NULL (orphaned tasks keep opportunity_id NULL)

---

### 6. Tasks (tr_tr_tareas)

#### tr_tr_tareas → config_organizaciones
- **Relationship:** Many-to-One
- **Description:** Each task belongs to one organization
- **On Delete:** CASCADE

#### tr_tr_tareas → tr_doc_comercial
- **oportunidad_id:** Many-to-One - Task related to opportunity
- **On Delete:** SET NULL

#### tr_tr_tareas → dm_actores
- **asignado_a:** Many-to-One - Task assigned to actor
- **relacionado_con_bp:** Many-to-One - Task about this actor
- **On Delete:** SET NULL for both

---

### 7. Share Assignments (vn_asociados)

#### vn_asociados → config_organizaciones
- **Relationship:** Many-to-One
- **Description:** Assignment belongs to organization
- **On Delete:** CASCADE

#### vn_asociados → dm_acciones
- **accion_id:** Many-to-One - Assignment to this certificate
- **On Delete:** CASCADE

#### vn_asociados → dm_actores
- **business_partner_id:** Many-to-One - Assigned to this actor
- **On Delete:** CASCADE

---

### 8. Business Partner Relationships (vn_relaciones_actores)

#### vn_relaciones_actores → config_organizaciones
- **Relationship:** Many-to-One
- **Description:** Relationship within organization
- **On Delete:** CASCADE

#### vn_relaciones_actores → dm_actores (two references)
- **bp_origen_id:** Many-to-One - Source actor
- **bp_destino_id:** Many-to-One - Target actor
- **On Delete:** CASCADE for both

---

## Foreign Key References

### Summary Table

| Child Table | FK Column | Parent Table | PK Column | On Delete |
|-------------|-----------|--------------|-----------|-----------|
| config_organizacion_miembros | organization_id | config_organizaciones | id | CASCADE |
| config_organizacion_miembros | user_id | auth.users | id | CASCADE |
| config_organizacion_miembros | eliminado_por | auth.users | id | SET NULL |
| config_roles_permisos | role | config_roles | role | CASCADE |
| dm_actores | organizacion_id | config_organizaciones | id | CASCADE |
| dm_actores | ciudad_id | config_ciudades | id | SET NULL |
| dm_actores | eliminado_por | auth.users | id | SET NULL |
| dm_acciones | organizacion_id | config_organizaciones | id | CASCADE |
| tr_doc_comercial | organizacion_id | config_organizaciones | id | CASCADE |
| tr_doc_comercial | asociado_id | dm_actores | id | SET NULL |
| tr_doc_comercial | solicitante_id | dm_actores | id | SET NULL |
| tr_doc_comercial | responsable_id | dm_actores | id | SET NULL |
| tr_doc_comercial | pagador_id | dm_actores | id | SET NULL |
| tr_tr_tareas | organizacion_id | config_organizaciones | id | CASCADE |
| tr_tr_tareas | oportunidad_id | tr_doc_comercial | id | SET NULL |
| tr_tr_tareas | asignado_a | dm_actores | id | SET NULL |
| tr_tr_tareas | relacionado_con_bp | dm_actores | id | SET NULL |
| vn_asociados | organizacion_id | config_organizaciones | id | CASCADE |
| vn_asociados | accion_id | dm_acciones | id | CASCADE |
| vn_asociados | business_partner_id | dm_actores | id | CASCADE |
| vn_relaciones_actores | organizacion_id | config_organizaciones | id | CASCADE |
| vn_relaciones_actores | bp_origen_id | dm_actores | id | CASCADE |
| vn_relaciones_actores | bp_destino_id | dm_actores | id | CASCADE |

---

## Table Hierarchies

### Organization Hierarchy

```
config_organizaciones (root)
│
├─── config_organizacion_miembros (members)
│    │
│    └─── config_roles (role definitions)
│         │
│         └─── config_roles_permisos (permissions)
│
├─── dm_actores (business partners)
│
├─── dm_acciones (stock certificates)
│
├─── tr_doc_comercial (opportunities)
│
├─── tr_tr_tareas (tasks)
│
├─── vn_asociados (share assignments)
│
└─── vn_relaciones_actores (relationships)
```

### Business Partner Hierarchy

```
dm_actores (base table)
│
├─── (Referenced by) tr_doc_comercial
│    ├─── solicitante_id
│    ├─── responsable_id
│    └─── pagador_id
│
├─── (Referenced by) tr_tr_tareas
│    ├─── asignado_a
│    └─── relacionado_con_bp
│
├─── (Referenced by) vn_asociados
│    └─── business_partner_id
│
└─── (Referenced by) vn_relaciones_actores
     ├─── bp_origen_id
     └─── bp_destino_id
```

---

## Index Summary

### Partial Indexes (Soft Delete Pattern)

**36 partial indexes** with `WHERE eliminado_en IS NULL`:

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| config_organizaciones | idx_config_organizaciones_activas | (id, creado_en) | Filter active orgs |
| config_organizaciones | idx_config_organizaciones_nombre_activas | (nombre) | Search by name |
| dm_actores | idx_dm_actores_activos | (organizacion_id, eliminado_en, creado_en) | Filter active actors |
| dm_actores | idx_dm_actores_tipo_actor_activos | (tipo_actor, organizacion_id) | Filter by type |
| dm_actores | idx_dm_actores_documento_activos | (tipo_documento, num_documento) | Search by document |
| tr_doc_comercial | idx_tr_doc_comercial_activos | (organizacion_id, estado, creado_en) | Filter active opportunities |
| tr_doc_comercial | idx_tr_doc_comercial_solicitante_activos | (solicitante_id, estado) | By requester |
| tr_doc_comercial | idx_tr_doc_comercial_responsable_activos | (responsable_id, estado) | By responsible |
| tr_doc_comercial | idx_tr_doc_comercial_estado_fecha | (estado, fecha_venc_doc) | Pipeline queries |
| tr_tr_tareas | idx_tr_tr_tareas_activas | (organizacion_id, asignado_a, estado, fecha_vencimiento) | User task list |
| tr_tr_tareas | idx_tr_tr_tareas_oportunidad_activas | (oportunidad_id, estado) | Tasks by opportunity |
| tr_tr_tareas | idx_tr_tr_tareas_relacionado_bp_activas | (relacionado_con_bp, estado) | Tasks by BP |
| tr_tr_tareas | idx_tr_tr_tareas_estado_prioridad | (estado, prioridad, fecha_vencimiento) | Priority sorting |
| vn_asociados | idx_vn_asociados_activas | (organizacion_id, accion_id, tipo_asignacion) | Active assignments |
| vn_asociados | idx_vn_asociados_bp_activas | (business_partner_id, fecha_fin) | By partner |
| vn_relaciones_actores | idx_vn_relaciones_actores_activas | (organizacion_id, bp_origen_id, bp_destino_id) | Active relationships |
| vn_relaciones_actores | idx_vn_relaciones_actores_tipo_activas | (tipo_relacion, es_actual) | By type |
| dm_acciones | idx_dm_acciones_activas | (organizacion_id, codigo_accion, estado) | Active shares |
| config_ciudades | idx_config_ciudades_activas | (country_code, state_name, city_name) | Location search |
| config_ciudades | idx_config_ciudades_search | (search_text) | Full-text search |
| config_roles | idx_config_roles_activos | (role) | Role lookup |
| config_roles_permisos | idx_config_roles_permisos_activos | (role, resource, action) | Permission check |
| config_organizacion_miembros | idx_config_organizacion_miembros_activos | (user_id, organization_id, role) | Membership check |

### Foreign Key Indexes

**10+ indexes** for foreign key performance:

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| tr_doc_comercial | idx_tr_doc_comercial_creado_por | (creado_por) | Audit queries |
| tr_doc_comercial | idx_tr_doc_comercial_actualizado_por | (actualizado_por) | Audit queries |
| tr_doc_comercial | idx_tr_doc_comercial_eliminado_por | (eliminado_por) | Soft delete queries |
| tr_tr_tareas | idx_tr_tr_tareas_creado_por | (creado_por) | Audit queries |
| tr_tr_tareas | idx_tr_tr_tareas_actualizado_por | (actualizado_por) | Audit queries |
| tr_tr_tareas | idx_tr_tr_tareas_eliminado_por | (eliminado_por) | Soft delete queries |
| tr_tr_tareas | idx_tr_tr_tareas_asignado_a | (asignado_a) | JOIN dm_actores |
| tr_tr_tareas | idx_tr_tr_tareas_relacionado_con_bp | (relacionado_con_bp) | JOIN dm_actores |
| tr_doc_comercial | idx_tr_doc_comercial_solicitante_id | (solicitante_id) | JOIN dm_actores |
| tr_doc_comercial | idx_tr_doc_comercial_responsable_id | (responsable_id) | JOIN dm_actores |
| dm_actores | idx_dm_actores_ciudad_id | (ciudad_id) | JOIN config_ciudades |

### Unique Indexes

| Table | Index | Columns | Condition |
|-------|-------|---------|-----------|
| dm_actores | idx_dm_actores_codigo_unique | (codigo_bp) | Always unique |
| dm_actores | idx_dm_actores_documento_org | (organizacion_id, num_documento) | WHERE eliminado_en IS NULL |
| config_organizacion_miembros | idx_om_org_user_unique | (organization_id, user_id) | Always unique |
| vn_asociados | idx_asignaciones_unico_vigente | (accion_id, tipo_asignacion) | WHERE eliminado_en IS NULL AND fecha_fin IS NULL |
| vn_relaciones_actores | idx_bp_relaciones_unique_activa | (bp_origen_id, bp_destino_id, tipo_relacion) | WHERE eliminado_en IS NULL AND es_actual = true |

---

## Function Dependencies

### Triggers

| Trigger | Table | Event | Function | Purpose |
|---------|-------|-------|----------|---------|
| trg_generar_codigo_dm_actores | dm_actores | INSERT | generar_codigo_dm_actores() | Auto-generate codigo_bp |
| trg_actualizar_timestamp_config | config_* tables | UPDATE | actualizar_timestamp_config() | Auto-update audit fields |
| trg_gen_codigo_oportunidad | tr_doc_comercial | INSERT | gen_codigo_oportunidad() | Auto-generate codigo |
| trg_calcular_valor_total_oportunidad | tr_doc_comercial | INSERT/UPDATE | calcular_valor_total_oportunidad() | Compute total |
| trg_generar_codigo_tarea | tr_tr_tareas | INSERT | generar_codigo_tarea() | Auto-generate codigo_tarea |
| trg_generar_codigo_completo_asignacion | vn_asociados | INSERT | generar_codigo_completo_asignacion() | Build full code |
| trg_validar_asignacion_accion | vn_asociados | INSERT/UPDATE | validar_asignacion_accion() | Validate rules |

### Security Functions (SECURITY DEFINER)

| Function | Purpose | Used By |
|----------|---------|---------|
| is_org_member() | Check org membership | RLS policies |
| is_org_admin_v2() | Check admin role | RLS policies |
| has_org_permission() | Check specific permission | Application code |
| can_user_v2() | Legacy permission check | Application code |
| soft_delete_bp() | Soft delete actor | Application code |
| soft_delete_tr_doc_comercial() | Soft delete opportunity | Application code |
| soft_delete_tr_tareas() | Soft delete task | Application code |

### Utility Functions

| Function | Purpose |
|----------|---------|
| calcular_digito_verificacion_nit() | NIT check digit (Colombia) |
| search_locations() | Full-text city search |
| unaccent_lower() | Remove accents for search |
| actualizar_timestamp() | Generic timestamp update |
| set_audit_fields() | Set audit columns |

---

## See Also

- [TABLES.md](TABLES.md) - Complete data dictionary
- [OVERVIEW.md](OVERVIEW.md) - Architecture concepts
- [VIEWS.md](VIEWS.md) - Database views
- [QUERIES.md](QUERIES.md) - Query patterns
- [RLS.md](RLS.md) - Row Level Security policies
