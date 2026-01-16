# Database Tables

This document describes all tables in the database schema.

## Table of Contents

- [Auth Schema](#auth-schema)
- [Storage Schema](#storage-schema)
- [Public Schema](#public-schema)
  - [Configuration Tables](#configuration-tables)
  - [Master Data Tables](#master-data-tables)
  - [Transactional Tables](#transactional-tables)
  - [Views](#views)

---

## Auth Schema

### `auth.users`

Stores user login data within a secure schema.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| id | uuid | | No | Primary key |
| instance_id | uuid | | Yes | Instance identifier |
| aud | varchar | | Yes | Audit type |
| role | varchar | | Yes | User role |
| email | varchar | | Yes | User email |
| encrypted_password | varchar | | Yes | Encrypted password |
| email_confirmed_at | timestamptz | | Yes | Email confirmation timestamp |
| invited_at | timestamptz | | Yes | Invitation timestamp |
| confirmation_token | varchar | | Yes | Confirmation token |
| confirmation_sent_at | timestamptz | | Yes | Confirmation sent timestamp |
| recovery_token | varchar | | Yes | Recovery token |
| recovery_sent_at | timestamptz | | Yes | Recovery sent timestamp |
| phone | text | NULL::varchar | Yes | Phone number (unique) |
| phone_confirmed_at | timestamptz | | Yes | Phone confirmation timestamp |
| last_sign_in_at | timestamptz | | Yes | Last sign in timestamp |
| raw_app_meta_data | jsonb | | Yes | Application metadata |
| raw_user_meta_data | jsonb | | Yes | User metadata |
| is_super_admin | boolean | | Yes | Super admin flag |
| created_at | timestamptz | | Yes | Creation timestamp |
| updated_at | timestamptz | | Yes | Update timestamp |
| deleted_at | timestamptz | | Yes | Soft delete timestamp |
| is_anonymous | boolean | false | No | Anonymous user flag |
| is_sso_user | boolean | false | No | SSO user flag |

**Primary Key:** id

**Indexes:**
- phone (unique)

---

### `auth.refresh_tokens`

Store of tokens used to refresh JWT tokens once they expire.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| id | bigint | nextval() | No | Primary key |
| instance_id | uuid | | Yes | Instance identifier |
| token | varchar | | Yes | Refresh token (unique) |
| user_id | varchar | | Yes | User reference |
| revoked | boolean | | Yes | Revoked flag |
| created_at | timestamptz | | Yes | Creation timestamp |
| updated_at | timestamptz | | Yes | Update timestamp |
| parent | varchar | | Yes | Parent token |
| session_id | uuid | | Yes | Session reference |

**Primary Key:** id

**Foreign Keys:**
- session_id → auth.sessions.id

---

### `auth.sessions`

Stores session data associated to a user.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| id | uuid | | No | Primary key |
| user_id | uuid | | No | User reference |
| created_at | timestamptz | | Yes | Creation timestamp |
| updated_at | timestamptz | | Yes | Update timestamp |
| factor_id | uuid | | Yes | MFA factor reference |
| aal | aal_level | | Yes | Authenticator assurance level |
| not_after | timestamptz | | Yes | Session expiration timestamp |
| refreshed_at | timestamp | | Yes | Refresh timestamp |
| user_agent | text | | Yes | User agent string |
| ip | inet | | Yes | IP address |
| tag | text | | Yes | Session tag |
| oauth_client_id | uuid | | Yes | OAuth client reference |
| refresh_token_hmac_key | text | | Yes | HMAC key for signing refresh tokens |
| refresh_token_counter | bigint | | Yes | Last issued refresh token ID |
| scopes | text | | Yes | OAuth scopes |

**Primary Key:** id

**Foreign Keys:**
- user_id → auth.users.id
- oauth_client_id → auth.oauth_clients.id

---

## Storage Schema

### `storage.buckets`

Storage buckets configuration.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| id | text | | No | Primary key |
| name | text | | No | Bucket name (unique) |
| owner | uuid | | Yes | Deprecated owner field |
| created_at | timestamptz | now() | Yes | Creation timestamp |
| updated_at | timestamptz | now() | Yes | Update timestamp |
| public | boolean | false | Yes | Public access flag |
| avif_autodetection | boolean | false | Yes | AVIF autodetection flag |
| file_size_limit | bigint | | Yes | Max file size |
| allowed_mime_types | text[] | | Yes | Allowed MIME types |
| owner_id | text | | Yes | Owner identifier |
| type | buckettype | STANDARD | No | Bucket type (STANDARD, ANALYTICS, VECTOR) |

**Primary Key:** id

---

### `storage.objects`

Storage objects (files).

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| id | uuid | gen_random_uuid() | No | Primary key |
| bucket_id | text | | Yes | Bucket reference |
| name | text | | Yes | Object name |
| owner | uuid | | Yes | Deprecated owner field |
| created_at | timestamptz | now() | Yes | Creation timestamp |
| updated_at | timestamptz | now() | Yes | Update timestamp |
| last_accessed_at | timestamptz | now() | Yes | Last access timestamp |
| metadata | jsonb | | Yes | Object metadata |
| path_tokens | text[] | string_to_array() | Yes (generated) | Path tokens |
| version | text | | Yes | Object version |
| owner_id | text | | Yes | Owner identifier |
| user_metadata | jsonb | | Yes | User metadata |
| level | integer | | Yes | Object depth level |

**Primary Key:** id

**Foreign Keys:**
- bucket_id → storage.buckets.id

---

## Public Schema

### Configuration Tables

#### `config_organizaciones`

Tabla de organizaciones que implementa el sistema multi-tenancy y jerarquía estructural.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| id | uuid | gen_random_uuid() | No | Identificador único (PK) |
| nombre | text | | No | Nombre legal o descriptivo |
| slug | text | | No | Identificador único para URLs (unique) |
| tipo | config_organizacion_tipo | club | Yes | club, asociacion, federacion, fundacion, otro |
| organizacion_padre_id | uuid | | Yes | Referencia a organización superior |
| email | text | | Yes | Email institucional |
| telefono | text | | Yes | Teléfono principal |
| website | text | | Yes | Sitio web oficial |
| direccion | jsonb | {} | Yes | Dirección en JSONB |
| configuracion | jsonb | {} | Yes | Configuración técnica JSONB |
| creado_en | timestamptz | now() | No | Fecha de creación |
| actualizado_en | timestamptz | now() | No | Fecha de actualización |
| creado_por | uuid | auth.uid() | Yes | Usuario que creó |
| actualizado_por | uuid | | Yes | Usuario que actualizó |
| eliminado_por | uuid | | Yes | Usuario que eliminó |
| eliminado_en | timestamptz | | Yes | Soft delete timestamp |

**Primary Key:** id

**Foreign Keys:**
- organizacion_padre_id → config_organizaciones.id (self-reference)
- creado_por → auth.users.id
- actualizado_por → auth.users.id
- eliminado_por → auth.users.id

---

#### `config_organizacion_miembros`

Organization members with multi-tenant RBAC.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| user_id | uuid | | No | User reference (PK part 1) |
| organization_id | uuid | | No | Organization reference (PK part 2) |
| role | text | | No | User role |
| created_at | timestamptz | now() | No | Membership creation timestamp |
| created_by | uuid | | Yes | User who created membership |
| atributos | jsonb | '{"ui": {"theme": "system"}}' | Yes | User preferences JSONB |
| nombres | text | | Yes | Member first names |
| apellidos | text | | Yes | Member last names |
| telefono | text | | Yes | Contact phone |
| cargo | text | | Yes | Job title |
| nombre_completo | text | | Yes | Full name |
| eliminado_en | timestamptz | | Yes | Soft delete timestamp |
| eliminado_por | uuid | | Yes | User who soft deleted |
| creado_en | timestamptz | now() | Yes | Creation timestamp |
| actualizado_en | timestamptz | now() | Yes | Update timestamp |
| creado_por | uuid | auth.uid() | Yes | Creator user |
| actualizado_por | uuid | | Yes | Updater user |

**Primary Key:** (user_id, organization_id)

**Foreign Keys:**
- user_id → auth.users.id
- organization_id → config_organizaciones.id
- created_by → auth.users.id
- actualizado_por → auth.users.id
- eliminado_por → auth.users.id
- creado_por → auth.users.id

---

#### `config_roles`

Role definitions.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| role | text | | No | Role name (PK) |
| eliminado_en | timestamptz | | Yes | Soft delete timestamp |
| eliminado_por | uuid | | Yes | User who soft deleted |
| creado_en | timestamptz | now() | Yes | Creation timestamp |
| actualizado_en | timestamptz | now() | Yes | Update timestamp |
| creado_por | uuid | auth.uid() | Yes | Creator user |
| actualizado_por | uuid | | Yes | Updater user |

**Primary Key:** role

**Foreign Keys:**
- eliminado_por → auth.users.id
- actualizado_por → auth.users.id
- creado_por → auth.users.id

---

#### `config_roles_permisos`

Role permissions. Solo los owners tienen acceso a tablas config_*. Admin/Analyst/Auditor solo acceden a tablas de negocio (dm_*, tr_*, vn_*).

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| role | text | | No | Role reference (PK part 1) |
| resource | text | | No | Resource name (PK part 2) |
| action | text | | No | Action name (PK part 3) |
| allow | boolean | true | No | Permission granted |
| eliminado_en | timestamptz | | Yes | Soft delete timestamp |
| eliminado_por | uuid | | Yes | User who soft deleted |
| creado_en | timestamptz | now() | Yes | Creation timestamp |
| actualizado_en | timestamptz | now() | Yes | Update timestamp |
| creado_por | uuid | auth.uid() | Yes | Creator user |
| actualizado_por | uuid | | Yes | Updater user |

**Primary Key:** (role, resource, action)

**Foreign Keys:**
- role → config_roles.role
- eliminado_por → auth.users.id
- actualizado_por → auth.users.id
- creado_por → auth.users.id

---

#### `config_ciudades`

Catálogo de ciudades y ubicaciones geográficas.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| id | uuid | gen_random_uuid() | No | Identificador único (PK) |
| country_code | text | | No | Código de país |
| country_name | text | | No | Nombre del país |
| state_name | text | | No | Nombre del estado/provincia |
| city_name | text | | No | Nombre de la ciudad |
| city_code | text | | Yes | Código de ciudad |
| search_text | text | | No | Texto para búsquedas |
| eliminado_en | timestamptz | | Yes | Soft delete timestamp |
| eliminado_por | uuid | | Yes | Usuario que eliminó |
| creado_en | timestamptz | now() | Yes | Fecha de creación |
| actualizado_en | timestamptz | now() | Yes | Fecha de actualización |
| creado_por | uuid | auth.uid() | Yes | Usuario que creó |
| actualizado_por | uuid | | Yes | Usuario que actualizó |

**Primary Key:** id

**Foreign Keys:**
- creado_por → auth.users.id
- actualizado_por → auth.users.id
- eliminado_por → auth.users.id

---

### Master Data Tables (dm_*)

#### `dm_actores`

Entidad base (Actor) del patrón Class Table Inheritance (CTI). Agrupa campos comunes de personas y empresas.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| id | uuid | gen_random_uuid() | No | Identificador único (PK) |
| codigo_bp | text | auto | No | Código único ACT-00000001 (unique) |
| organizacion_id | uuid | | No | Organización (multi-tenancy) |
| tipo_actor | tipo_actor_enum | persona | No | Tipo: persona o empresa |
| nat_fiscal | dm_actor_naturaleza_fiscal | | Yes | Naturaleza: natural o jurídica |
| tipo_documento | dm_actor_tipo_documento | | Yes | CC, CE, PA, TI, RC, PEP, PPT, NIT |
| regimen_tributario | dm_actor_regimen_tributario | | Yes | Régimen tributario |
| num_documento | text | | Yes | Número de documento único |
| digito_verificacion | smallint | | Yes | Dígito de verificación NIT |
| email_facturacion | text | | Yes | Email para facturación electrónica |
| razon_social | text | | Yes | Nombre legal (empresas) |
| nombre_comercial | text | | Yes | Nombre de marca |
| primer_nombre | text | | Yes | Primer nombre |
| segundo_nombre | text | | Yes | Segundo nombre |
| primer_apellido | text | | Yes | Primer apellido |
| segundo_apellido | text | | Yes | Segundo apellido |
| email_principal | text | | Yes | Email de acceso |
| email_secundario | text | | Yes | Email de respaldo |
| telefono_principal | text | | Yes | Celular principal |
| telefono_secundario | text | | Yes | Línea alterna |
| direccion_fisica | text | | Yes | Dirección física |
| ciudad_id | uuid | | Yes | Ciudad de ubicación |
| es_socio | boolean | false | No | Indica si es socio |
| es_cliente | boolean | false | No | Indica si es cliente |
| es_proveedor | boolean | false | No | Indica si es proveedor |
| estado_actor | dm_actor_estado | activo | No | Estado: activo, inactivo, bloqueado |
| genero_actor | dm_actor_genero | | Yes | Género: masculino, femenino, otro, no aplica |
| fecha_nacimiento | date | | Yes | Fecha de nacimiento |
| estado_civil | dm_actor_estado_civil | | Yes | Soltero, casado, unión libre, divorciado, viudo |
| perfil_identidad | jsonb | {} | No | Datos de identidad |
| perfil_profesional_corporativo | jsonb | {} | No | Datos profesionales |
| perfil_salud | jsonb | {} | No | Datos de salud |
| perfil_contacto | jsonb | {} | No | Contactos de emergencia |
| perfil_intereses | jsonb | {} | No | Intereses personales |
| perfil_preferencias | jsonb | {} | No | Preferencias de servicio |
| perfil_redes | jsonb | {} | No | Redes sociales |
| perfil_compliance | jsonb | {} | No | Cumplimiento legal |
| perfil_referencias | jsonb | {} | No | Referencias |
| tags | text[] | | Yes | Etiquetas |
| creado_en | timestamptz | now() | No | Fecha de creación |
| creado_por | uuid | auth.uid() | Yes | Usuario que creó |
| actualizado_en | timestamptz | now() | No | Fecha de actualización |
| actualizado_por | uuid | | Yes | Usuario que actualizó |
| eliminado_en | timestamptz | | Yes | Soft delete timestamp |
| eliminado_por | uuid | | Yes | Usuario que eliminó |

**Primary Key:** id

**Foreign Keys:**
- organizacion_id → config_organizaciones.id
- ciudad_id → config_ciudades.id
- creado_por → auth.users.id
- actualizado_por → auth.users.id
- eliminado_por → auth.users.id

---

#### `dm_acciones`

Tabla maestra de acciones del club (títulos de valor). No contiene dueños directamente.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| id | uuid | gen_random_uuid() | No | Identificador único (PK) |
| organizacion_id | uuid | | No | Organización |
| codigo_accion | text | | No | Código de 4 dígitos (unique) |
| estado | dm_accion_estado | disponible | No | disponible, asignada, arrendada, bloqueada, inactiva |
| creado_en | timestamptz | now() | Yes | Fecha de creación |
| creado_por | uuid | auth.uid() | Yes | Usuario que creó |
| actualizado_en | timestamptz | now() | Yes | Fecha de actualización |
| actualizado_por | uuid | | Yes | Usuario que actualizó |
| eliminado_en | timestamptz | | Yes | Soft delete timestamp |
| eliminado_por | uuid | | Yes | Usuario que eliminó |

**Primary Key:** id

**Foreign Keys:**
- organizacion_id → config_organizaciones.id
- creado_por → auth.users.id
- actualizado_por → auth.users.id
- eliminado_por → auth.users.id

---

### Transactional Tables (tr_*)

#### `tr_doc_comercial`

Oportunidades, ofertas y pedidos con estructura comercial completa.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| id | uuid | gen_random_uuid() | No | Identificador único (PK) |
| codigo | text | auto | No | Código único DOC-00000001 |
| fecha_doc | date | CURRENT_DATE | No | Fecha del documento |
| fecha_venc_doc | date | | Yes | Fecha de vencimiento |
| tipo | tr_doc_comercial_tipo | oportunidad | No | oportunidad, oferta, pedido_venta, reserva |
| sub_tipo | tr_doc_comercial_subtipo | | Yes | sol_ingreso, sol_retiro, oferta_eventos, pedido_eventos |
| estado | tr_doc_comercial_estados | Nueva | No | Nueva, En Progreso, Ganada, Pérdida, Descartada |
| titulo | text | | Yes | Título del documento |
| organizacion_id | uuid | | No | Organización |
| asociado_id | uuid | | Yes | Asociado relacionado |
| solicitante_id | uuid | | No | Solicitante (actor) |
| pagador_id | uuid | | Yes | Pagador (actor) |
| responsable_id | uuid | | No | Responsable (usuario) |
| documento_origen_id | uuid | | Yes | Documento de origen (self-reference) |
| items | jsonb | [] | No | Ítems del documento |
| moneda_iso | config_moneda | COP | Yes | Moneda (ISO 4217) |
| valor_neto | numeric | 0 | No | Subtotal antes de impuestos |
| valor_descuento | numeric | 0 | No | Total descuentos |
| valor_impuestos | numeric | 0 | No | Total impuestos |
| valor_total | numeric | 0 | No | Valor final a pagar |
| monto_estimado | numeric | | Yes | Monto estimado (legacy) |
| notas | text | | Yes | Notas adicionales |
| tags | text[] | | Yes | Etiquetas |
| atributos | jsonb | {} | No | Atributos adicionales |
| creado_en | timestamptz | now() | No | Fecha de creación |
| creado_por | uuid | auth.uid() | Yes | Usuario que creó |
| actualizado_en | timestamptz | now() | No | Fecha de actualización |
| actualizado_por | uuid | | Yes | Usuario que actualizó |
| eliminado_en | timestamptz | | Yes | Soft delete timestamp |
| eliminado_por | uuid | | Yes | Usuario que eliminó |

**Primary Key:** id

**Foreign Keys:**
- organizacion_id → config_organizaciones.id
- asociado_id → vn_asociados.id
- solicitante_id → dm_actores.id
- pagador_id → dm_actores.id
- responsable_id → auth.users.id
- documento_origen_id → tr_doc_comercial.id (self-reference)
- creado_por → auth.users.id
- actualizado_por → auth.users.id
- eliminado_por → auth.users.id

---

#### `tr_tareas`

Task management for opportunities and business processes.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| id | uuid | gen_random_uuid() | No | Identificador único (PK) |
| codigo_tarea | text | auto | Yes | Código TSK-00000001 (unique) |
| titulo | text | | No | Título de la tarea |
| descripcion | text | | Yes | Descripción |
| prioridad | tr_tareas_prioridad | Media | No | Baja, Media, Alta, Urgente |
| estado | tr_tareas_estado | Pendiente | No | Pendiente, En Progreso, Terminada, Pausada, Cancelada |
| fecha_vencimiento | date | | Yes | Fecha de vencimiento |
| organizacion_id | uuid | | No | Organización |
| oportunidad_id | uuid | | Yes | Oportunidad relacionada |
| relacionado_con_bp | uuid | | Yes | Business partner relacionado |
| asignado_a | uuid | | No | Usuario asignado |
| tags | text[] | | Yes | Etiquetas |
| creado_en | timestamptz | now() | No | Fecha de creación |
| creado_por | uuid | auth.uid() | Yes | Usuario que creó |
| actualizado_en | timestamptz | now() | No | Fecha de actualización |
| actualizado_por | uuid | | Yes | Usuario que actualizó |
| eliminado_en | timestamptz | | Yes | Soft delete timestamp |
| eliminado_por | uuid | | Yes | Usuario que eliminó |

**Primary Key:** id

**Foreign Keys:**
- organizacion_id → config_organizaciones.id
- oportunidad_id → tr_doc_comercial.id
- relacionado_con_bp → dm_actores.id
- asignado_a → auth.users.id
- creado_por → auth.users.id
- actualizado_por → auth.users.id
- eliminado_por → auth.users.id

---

### Views (vn_*)

#### `vn_relaciones_actores`

Gestiona los vínculos (laborales, familiares, comerciales) entre socios de negocio.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| id | uuid | gen_random_uuid() | No | Identificador único (PK) |
| organizacion_id | uuid | | No | Organización |
| bp_origen_id | uuid | | No | Actor que inicia la relación |
| bp_destino_id | uuid | | No | Actor que recibe la relación |
| tipo_relacion | dm_actores_tipo_relacion | | No | familiar, laboral, referencia, membresia, comercial, otra |
| rol_origen | vn_relacion_actores_rol | | No | cónyuge, padre, madre, hijo/a, suegro, suegra, hermano/a, otro, yerno, nuera |
| rol_destino | vn_relacion_actores_rol | | No | cónyuge, padre, madre, hijo/a, suegro, suegra, hermano/a, otro, yerno, nuera |
| atributos | jsonb | {} | No | Atributos adicionales |
| fecha_inicio | date | | Yes | Fecha de inicio |
| fecha_fin | date | | Yes | Fecha de fin |
| es_actual | boolean | (fecha_fin IS NULL) | Yes (generated) | true si no tiene fecha_fin |
| es_bidireccional | boolean | false | No | Indica si es bidireccional |
| notas | text | | Yes | Notas adicionales |
| creado_en | timestamptz | now() | No | Fecha de creación |
| actualizado_en | timestamptz | now() | No | Fecha de actualización |
| eliminado_en | timestamptz | | Yes | Soft delete timestamp |
| creado_por | uuid | auth.uid() | Yes | Usuario que creó |
| actualizado_por | uuid | | Yes | Usuario que actualizó |
| eliminado_por | uuid | | Yes | Usuario que eliminó |

**Primary Key:** id

**Foreign Keys:**
- organizacion_id → config_organizaciones.id
- bp_origen_id → dm_actores.id
- bp_destino_id → dm_actores.id
- creado_por → auth.users.id
- actualizado_por → auth.users.id
- eliminado_por → auth.users.id

---

#### `vn_asociados`

Asignaciones de acciones a business partners con historial temporal.

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| id | uuid | gen_random_uuid() | No | Identificador único (PK) |
| accion_id | uuid | | No | Acción asignada |
| asociado_id | uuid | | No | Business partner |
| subcodigo | text | | No | Subcódigo de 2 dígitos |
| codigo_completo | text | | No | Código completo (acción + subcódigo) |
| tipo_vinculo | vn_asociados_tipo_vinculo | | Yes | propietario, titular, beneficiario, intermediario |
| modalidad | vn_asociados_modalidad | | Yes | propiedad, comodato, asignacion_corp, convenio |
| plan_comercial | vn_asociados_plan_comercial | | Yes | regular, plan dorado, joven ejecutivo, honorifico |
| asignacion_padre_id | uuid | | Yes | Asignación padre (jerarquía) |
| fecha_inicio | date | CURRENT_DATE | No | Fecha de inicio |
| fecha_fin | date | | Yes | Fecha de fin |
| es_vigente | boolean | (fecha_fin IS NULL) | Yes (generated) | true si está vigente |
| organizacion_id | uuid | | No | Organización |
| notas | text | | Yes | Notas adicionales |
| atributos | jsonb | {} | Yes | Atributos JSONB |
| creado_en | timestamptz | now() | No | Fecha de creación |
| creado_por | uuid | auth.uid() | Yes | Usuario que creó |
| actualizado_en | timestamptz | now() | No | Fecha de actualización |
| actualizado_por | uuid | | Yes | Usuario que actualizó |
| eliminado_en | timestamptz | | Yes | Soft delete timestamp |
| eliminado_por | uuid | | Yes | Usuario que eliminó |

**Primary Key:** id

**Foreign Keys:**
- accion_id → dm_acciones.id
- asociado_id → dm_actores.id
- organizacion_id → config_organizaciones.id
- asignacion_padre_id → vn_asociados.id (self-reference)
- creado_por → auth.users.id
- actualizado_por → auth.users.id
- eliminado_por → auth.users.id

---

## Enum Types

### Configuration Enums

- `config_organizacion_tipo`: club, asociacion, federacion, fundacion, otro
- `config_moneda`: COP, MXN, ARS, BRL, CLP, PEN, USD, EUR, GBP, CAD, JPY, CHF, AUD, NZD, CNY, INR, KRW, SGD, HKD, SEK, NOK, DKK, PLN, TRY, ZAR, RUB, AED, SAR, ILS, CZK, HUF, RON, BGN, HRK, MYR, THB, IDR, PHP, VND, TWD, ISK

### Actor Enums (dm_actor_*)

- `tipo_actor_enum`: persona, empresa
- `dm_actor_naturaleza_fiscal`: natural, jurídica
- `dm_actor_tipo_documento`: CC, CE, PA, TI, RC, PEP, PPT, NIT
- `dm_actor_regimen_tributario`: responsable de iva, no responsable de iva, regimen simple tributacion, gran contribuyente, no sujeta a impuesto
- `dm_actor_estado`: activo, inactivo, bloqueado
- `dm_actor_genero`: masculino, femenino, otro, no aplica
- `dm_actor_estado_civil`: soltero, casado, union libre, divorciado, viudo
- `dm_actores_tipo_relacion`: familiar, laboral, referencia, membresía, comercial, otra

### Shares Enums (dm_accion, vn_asociados)

- `dm_accion_estado`: disponible, asignada, arrendada, bloqueada, inactiva
- `vn_asociados_tipo_vinculo`: propietario, titular, beneficiario, intermediario
- `vn_asociados_modalidad`: propiedad, comodato, asignacion_corp, convenio
- `vn_asociados_plan_comercial`: regular, plan dorado, joven ejecutivo, honorifico
- `vn_relacion_actores_rol`: cónyuge, padre, madre, hijo/a, suegro, suegra, hermano/a, otro, yerno, nuera

### Commercial Documents Enums (tr_doc_comercial)

- `tr_doc_comercial_estados`: Nueva, En Progreso, Ganada, Pérdida, Descartada
- `tr_doc_comercial_tipo`: oportunidad, oferta, pedido_venta, reserva
- `tr_doc_comercial_subtipo`: sol_ingreso, sol_retiro, oferta_eventes, pedido_eventos

### Tasks Enums (tr_tareas)

- `tr_tareas_prioridad`: Baja, Media, Alta, Urgente
- `tr_tareas_estado`: Pendiente, En Progreso, Terminada, Pausada, Cancelada

---

## Sequences

- `seq_dm_actores_codigo`: Generates actor codes (ACT-00000001)
- `seq_tr_doc_comercial_codigo`: Generates document codes (DOC-00000001)
- `seq_tr_tareas_codigo`: Generates task codes (TSK-00000001)

---

## Generated Columns

Several tables have generated (computed) columns:

- `dm_actores.codigo_bp`: Auto-generated from sequence
- `tr_doc_comercial.codigo`: Auto-generated from sequence
- `tr_tareas.codigo_tarea`: Auto-generated from sequence
- `vn_relaciones_actores.es_actual`: Computed as (fecha_fin IS NULL)
- `vn_asociados.es_vigente`: Computed as (fecha_fin IS NULL)
- `storage.objects.path_tokens`: Computed as string_to_array(name, '/')

---

**Last updated:** 2026-01-15
