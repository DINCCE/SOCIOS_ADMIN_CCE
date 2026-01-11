# Tablas de la Base de Datos - SOCIOS_ADMIN

## Documentación Detallada por Tabla

Este documento proporciona información detallada de cada tabla en la base de datos, incluyendo columnas, tipos, restricciones y relaciones.

---

## Índice de Tablas

### Configuración (config_*)
- [config_organizaciones](#config_organizaciones) - Organizaciones y multi-tenancy
- [config_organizacion_miembros](#config_organizacion_miembros) - Miembros de organizaciones
- [config_roles](#config_roles) - Definición de roles
- [config_roles_permisos](#config_roles_permisos) - Permisos RBAC
- [config_ciudades](#config_ciudades) - Catálogo de ubicaciones

### Entidades de Negocio (dm_*)
- [dm_actores](#dm_actores) - Business Partners (CTI unificado)
- [dm_acciones](#dm_acciones) - Acciones del club

### Relaciones y Vistas (vn_*)
- [vn_asociados](#vn_asociados) - Asignaciones de acciones
- [vn_relaciones_actores](#vn_relaciones_actores) - Relaciones entre actores

### Transaccionales (tr_*)
- [tr_doc_comercial](#tr_doc_comercial) - Documentos comerciales
- [tr_tareas](#tr_tareas) - Tareas del sistema

---

## Tablas de Configuración

### config_organizaciones

**Propósito**: Implementa multi-tenancy y jerarquía estructural

**PK**: `id` (uuid)

**Filas**: 1

**Columnas (16)**:

| # | Columna | Tipo | Nullable | Default | Descripción |
|---|---------|------|----------|---------|-------------|
| 1 | id | uuid | NO | gen_random_uuid() | Identificador único (PK) de la organización |
| 2 | nombre | text | NO | - | Nombre legal o descriptivo de la organización |
| 3 | slug | text | NO | - | Identificador único para URLs y selección rápida |
| 4 | tipo | enum | SÍ | 'club' | Clasificación: club, asociación, federación, fundación, otro |
| 5 | organizacion_padre_id | uuid | SÍ | - | Referencia a la organización superior en la jerarquía |
| 6 | email | text | SÍ | - | Email institucional de la organización |
| 7 | telefono | text | SÍ | - | Teléfono principal de contacto |
| 8 | website | text | SÍ | - | Sitio web oficial |
| 9 | direccion | jsonb | SÍ | '{}'::jsonb | Objeto JSONB con país, ciudad, dirección_linea1, etc |
| 10 | configuracion | jsonb | SÍ | '{}'::jsonb | Configuración técnica y funcional específica |
| 11 | creado_en | timestamptz | NO | now() | Fecha y hora de creación del registro |
| 12 | actualizado_en | timestamptz | NO | now() | Fecha y hora de la última modificación |
| 13 | creado_por | uuid | SÍ | auth.uid() | Usuario que creó el registro |
| 14 | actualizado_por | uuid | SÍ | - | Usuario que actualizó el registro |
| 15 | eliminado_por | uuid | SÍ | - | Usuario que eliminó el registro |
| 16 | eliminado_en | timestamptz | SÍ | - | Marca de tiempo para soft delete |

**Foreign Keys (4)**:
- organizacion_padre_id → config_organizaciones(id) [self-reference]
- creado_por → auth.users(id)
- actualizado_por → auth.users(id)
- eliminado_por → auth.users(id)

**Unique Constraints**:
- slug

**Triggers**:
- set_actualizado_por_en() ON UPDATE
- set_deleted_by_on_soft_delete() ON UPDATE

**Campos Enum en esta tabla**:

| Campo               | Tipo Enum                   | Valores Válidos                                              |
|---------------------|-----------------------------|--------------------------------------------------------------|
| tipo                | config_organizacion_tipo    | `club`, `asociación`, `federación`, `fundación`, `otro`      |

**💡 Para obtener estos valores programáticamente:**

```sql
SELECT * FROM get_enum_values('config_organizacion_tipo');
```

---

### config_organizacion_miembros

**Propósito**: Miembros de organizaciones con roles RBAC

**PK Compuesta**: `(user_id, organization_id)`

**Columnas (17)**:

| # | Columna | Tipo | Nullable | Default | Descripción |
|---|---------|------|----------|---------|-------------|
| 1 | user_id | uuid | NO | - | Usuario miembro |
| 2 | organization_id | uuid | NO | - | Organización a la que pertenece |
| 3 | role | text | NO | - | Rol del usuario (owner, admin, analyst, auditor) |
| 4 | created_at | timestamptz | NO | now() | Timestamp de creación |
| 5 | created_by | uuid | SÍ | - | Usuario que creó la membresía |
| 6 | atributos | jsonb | SÍ | '{"ui": {"theme": "system"}}'::jsonb | Preferencias de usuario (theme, etc) |
| 7 | nombres | text | SÍ | - | Nombres del miembro de la organización |
| 8 | apellidos | text | SÍ | - | Apellidos del miembro de la organización |
| 9 | telefono | text | SÍ | - | Número de teléfono de contacto |
| 10 | cargo | text | SÍ | - | Cargo o título del puesto |
| 11 | nombre_completo | text | SÍ | - | Nombre completo (puede ser calculado en la aplicación) |
| 12 | eliminado_en | timestamptz | SÍ | - | Soft delete timestamp - miembro borrado |
| 13 | eliminado_por | uuid | SÍ | - | Usuario que soft deleteó el miembro |
| 14 | creado_en | timestamptz | SÍ | now() | Timestamp de creación de membresía |
| 15 | actualizado_en | timestamptz | SÍ | now() | Timestamp de última actualización |
| 16 | creado_por | uuid | SÍ | auth.uid() | Usuario que creó la membresía |
| 17 | actualizado_por | uuid | SÍ | - | Usuario que actualizó la membresía |

**Foreign Keys (6)**:
- user_id → auth.users(id)
- organization_id → config_organizaciones(id)
- role → config_roles(role)
- creado_por → auth.users(id)
- actualizado_por → auth.users(id)
- eliminado_por → auth.users(id)

**Triggers**:
- om_prevent_key_change() - Previene cambios en PK compuesta

---

### config_roles

**Propósito**: Definición de roles del sistema

**PK**: `role` (text)

**Filas**: 4 (owner, admin, analyst, auditor)

**Columnas (7)**:

| # | Columna | Tipo | Nullable | Default | Descripción |
|---|---------|------|----------|---------|-------------|
| 1 | role | text | NO | - | Nombre del rol (PK) |
| 2 | eliminado_en | timestamptz | SÍ | - | Soft delete timestamp - rol borrado |
| 3 | eliminado_por | uuid | SÍ | - | Usuario que soft deleteó el rol |
| 4 | creado_en | timestamptz | SÍ | now() | Timestamp de creación del rol |
| 5 | actualizado_en | timestamptz | SÍ | now() | Timestamp de última actualización |
| 6 | creado_por | uuid | SÍ | auth.uid() | Usuario que creó el rol |
| 7 | actualizado_por | uuid | SÍ | - | Usuario que actualizó el rol |

**Foreign Keys (3)**:
- creado_por → auth.users(id)
- actualizado_por → auth.users(id)
- eliminado_por → auth.users(id)

**Valores en tabla**:
- owner
- admin
- analyst
- auditor

---

### config_roles_permisos

**Propósito**: Permisos granulares RBAC (role, resource, action)

**PK Compuesta**: `(role, resource, action)`

**Filas**: 92 permisos configurados

**Columnas (10)**:

| # | Columna | Tipo | Nullable | Default | Descripción |
|---|---------|------|----------|---------|-------------|
| 1 | role | text | NO | - | Rol al que aplica el permiso |
| 2 | resource | text | NO | - | Recurso (tabla o entidad) |
| 3 | action | text | NO | - | Acción (create, read, update, delete, etc) |
| 4 | allow | boolean | NO | true | Si el permiso está concedido |
| 5 | eliminado_en | timestamptz | SÍ | - | Soft delete timestamp - permiso borrado |
| 6 | eliminado_por | uuid | SÍ | - | Usuario que soft deleteó el permiso |
| 7 | creado_en | timestamptz | SÍ | now() | Timestamp de creación del permiso |
| 8 | actualizado_en | timestamptz | SÍ | now() | Timestamp de última actualización |
| 9 | creado_por | uuid | SÍ | auth.uid() | Usuario que creó el permiso |
| 10 | actualizado_por | uuid | SÍ | - | Usuario que actualizó el permiso |

**Foreign Keys (4)**:
- role → config_roles(role)
- creado_por → auth.users(id)
- actualizado_por → auth.users(id)
- eliminado_por → auth.users(id)

**Nota**: Solo owners tienen acceso a tablas config_*. Admin/Analyst/Auditor solo acceden a tablas de negocio (dm_*, tr_*, vn_*).

---

### config_ciudades

**Propósito**: Catálogo de ciudades y ubicaciones geográficas

**PK**: `id` (uuid)

**Filas**: 1367 ciudades

**Columnas (13)**:

| # | Columna | Tipo | Nullable | Default | Descripción |
|---|---------|------|----------|---------|-------------|
| 1 | id | uuid | NO | gen_random_uuid() | Identificador único de la ciudad (UUID) |
| 2 | country_code | text | NO | - | Código ISO de país |
| 3 | country_name | text | NO | - | Nombre del país |
| 4 | state_name | text | NO | - | Nombre del estado/provincia |
| 5 | city_name | text | NO | - | Nombre de la ciudad |
| 6 | city_code | text | SÍ | - | Código de ciudad |
| 7 | search_text | text | NO | - | Texto normalizado para búsqueda |
| 8 | eliminado_en | timestamptz | SÍ | - | Soft delete timestamp - registro borrado |
| 9 | eliminado_por | uuid | SÍ | - | Usuario que soft deleteó el registro |
| 10 | creado_en | timestamptz | SÍ | now() | Timestamp de creación del registro |
| 11 | actualizado_en | timestamptz | SÍ | now() | Timestamp de última actualización |
| 12 | creado_por | uuid | SÍ | auth.uid() | Usuario que creó el registro |
| 13 | actualizado_por | uuid | SÍ | - | Usuario que actualizó el registro |

**Foreign Keys (3)**:
- creado_por → auth.users(id)
- actualizado_por → auth.users(id)
- eliminado_por → auth.users(id)

**Índices**:
- search_text con unaccent para búsqueda acentuada

**Triggers**:
- config_ciudades_build_search_text() - Recalcula search_text

---

## Tablas de Entidades de Negocio

### dm_actores

**Propósito**: Entidad base CTI para personas y empresas (Class Table Inheritance - Tabla Unificada)

**PK**: `id` (uuid)

**Código autogenerado**: `codigo_bp` (ACT-00000001)

**Filas**: 1

**Columnas (44)**:

| # | Columna | Tipo | Nullable | Default | Descripción |
|---|---------|------|----------|---------|-------------|
| 1 | id | uuid | NO | gen_random_uuid() | Identificador único (PK) de negocio |
| 2 | codigo_bp | text | NO | ACT-00000001 (seq) | Código único autogenerado |
| 4 | organizacion_id | uuid | NO | - | ID de la organización a la que pertenece |
| 8 | creado_en | timestamptz | NO | now() | Fecha y hora de creación |
| 9 | creado_por | uuid | SÍ | auth.uid() | UUID del usuario/app que creó el registro |
| 10 | actualizado_en | timestamptz | NO | now() | Fecha y hora de la última modificación |
| 11 | actualizado_por | uuid | SÍ | - | UUID del usuario/app que actualizó el registro |
| 12 | eliminado_en | timestamptz | SÍ | - | Marca de tiempo para Soft Delete |
| 13 | eliminado_por | uuid | SÍ | - | UUID del usuario que realizó la eliminación soft |
| 15 | tipo_actor | enum | NO | 'persona' | Tipo de actor (persona o empresa) |
| 16 | nat_fiscal | enum | SÍ | - | Naturaleza fiscal (natural, jurídica) |
| 17 | tipo_documento | enum | SÍ | - | Tipo de documento de identificación |
| 18 | regimen_tributario | enum | SÍ | - | Régimen tributario del actor |
| 19 | num_documento | text | SÍ | - | Número de identificación único por organización |
| 20 | digito_verificacion | smallint | SÍ | - | Dígito de verificación para NITs en Colombia |
| 21 | email_facturacion | text | SÍ | - | Correo electrónico para facturación electrónica |
| 22 | razon_social | text | SÍ | - | Nombre legal para empresas y personas jurídicas |
| 23 | nombre_comercial | text | SÍ | - | Nombre de marca o establecimiento |
| 24 | primer_nombre | text | SÍ | - | Primer nombre para personas naturales |
| 25 | segundo_nombre | text | SÍ | - | Segundo nombre para personas naturales |
| 26 | primer_apellido | text | SÍ | - | Primer apellido para personas naturales |
| 27 | segundo_apellido | text | SÍ | - | Segundo apellido para personas naturales |
| 28 | email_principal | text | SÍ | - | Correo de acceso y notificaciones oficiales |
| 29 | email_secundario | text | SÍ | - | Correo de respaldo |
| 30 | telefono_principal | text | SÍ | - | Celular o línea principal de contacto |
| 31 | telefono_secundario | text | SÍ | - | Línea alterna o fija |
| 32 | direccion_fisica | text | SÍ | - | Dirección física de ubicación |
| 33 | ciudad_id | uuid | SÍ | - | Ciudad de ubicación (FK a config_ciudades) |
| 34 | es_socio | boolean | NO | false | Indica si es socio de la organización |
| 35 | es_cliente | boolean | NO | false | Indica si es cliente de la organización |
| 36 | es_proveedor | boolean | NO | false | Indica si es proveedor de la organización |
| 37 | estado_actor | enum | NO | 'activo' | Estado del actor (activo, inactivo, bloqueado) |
| 38 | genero_actor | enum | SÍ | - | Género del actor para personas naturales |
| 39 | fecha_nacimiento | date | SÍ | - | Fecha de nacimiento para personas naturales |
| 40 | estado_civil | enum | SÍ | - | Estado civil del actor |
| 41 | perfil_identidad | jsonb | NO | '{}'::jsonb | Documentos, nacionalidad, fechas expedición/vencimiento |
| 42 | perfil_profesional_corporativo | jsonb | NO | '{}'::jsonb | Actividad económica, formación, ocupación, sector |
| 43 | perfil_salud | jsonb | NO | '{}'::jsonb | Seguridad médica, regímenes, condiciones clínicas |
| 44 | perfil_contacto | jsonb | NO | '{}'::jsonb | Contactos de emergencia, administración, contabilidad |
| 45 | perfil_intereses | jsonb | NO | '{}'::jsonb | Preferencias personales, áreas de interés social/deportivo |
| 46 | perfil_preferencias | jsonb | NO | '{}'::jsonb | Configuración personalizada de servicios, tallas, restricciones |
| 47 | perfil_redes | jsonb | NO | '{}'::jsonb | Redes sociales, presencia de marca, sitios web |
| 48 | perfil_compliance | jsonb | NO | '{}'::jsonb | Riesgos, cumplimiento legal, estructura de propiedad |
| 49 | perfil_referencias | jsonb | NO | '{}'::jsonb | Validaciones sociales, personales o comerciales |

**Foreign Keys (5)**:
- organizacion_id → config_organizaciones(id)
- ciudad_id → config_ciudades(id)
- creado_por → auth.users(id)
- actualizado_por → auth.users(id)
- eliminado_por → auth.users(id)

**Unique Constraints**:
- codigo_bp

**Perfiles JSONB - Estructura sugerida**:

```jsonb
-- perfil_identidad
{
  "tipo_documento": "CC",
  "lugar_expedicion": "Bogotá",
  "fecha_expedicion": "2010-01-01",
  "nacionalidad": "Colombiana"
}

-- perfil_profesional_corporativo
{
  "ocupacion": "Ingeniero",
  "sector": "Tecnología",
  "tamano_empresa": "50-100 empleados",
  "formacion": ["Ingeniería de Sistemas", "MBA"]
}

-- perfil_salud
{
  "tipo_sangre": "O+",
  "alergias": ["Penicilina"],
  "contacto_emergencia": "María Pérez - Esposa"
}

-- perfil_contacto
{
  "contacto_administrativo": "Juan Pérez - Contador",
  "email_administrativo": "admin@empresa.com"
}

-- perfil_intereses
{
  "deportes": ["Golf", "Tenis"],
  "areas_patrocinio": ["Juvenil", "Femenino"],
  "eventos_interes": ["Torneos anuales"]
}

-- perfil_preferencias
{
  "talla_camisa": "M",
  "preferencia_comunicacion": "Email",
  "frecuencia_contacto": "Semanal"
}

-- perfil_redes
{
  "linkedin": "https://linkedin.com/in/usuario",
  "twitter": "@usuario",
  "website": "https://empresa.com"
}

-- perfil_compliance
{
  "riesgo_bg": "Bajo",
  "estado_fiscal": "Al día",
  "estructura_propiedad": "Persona natural"
}

-- perfil_referencias
{
  "referencias_comerciales": ["Empresa ABC", "Empresa XYZ"],
  "referencias_personales": ["Carlos García"]
}
```

**Campos Enum en esta tabla**:

| Campo                | Tipo Enum                        | Valores Válidos                                                                                                                                                             |
|----------------------|----------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| tipo_actor           | dm_actor_tipo                    | `persona`, `empresa`                                                                                                                                                         |
| nat_fiscal           | dm_actor_naturaleza_fiscal       | `natural`, `jurídica`                                                                                                                                                        |
| tipo_documento       | dm_actor_tipo_documento          | `CC`, `CE`, `PA`, `TI`, `RC`, `PEP`, `PPT`, `NIT`                                                                                                                           |
| regimen_tributario   | dm_actor_regimen_tributario      | `responsable de iva`, `no responsable de iva`, `regimen simple tributacion`, `gran contribuyente`, `no sujeta a impuesto`                                                   |
| estado_actor         | dm_actor_estado                  | `activo`, `inactivo`, `bloqueado`                                                                                                                                            |
| genero_actor         | dm_actor_genero                  | `masculino`, `femenino`, `otro`, `no aplica`                                                                                                                                |
| estado_civil         | dm_actor_estado_civil            | `soltero`, `casado`, `union libre`, `divorciado`, `viudo`                                                                                                                    |

**💡 Para obtener estos valores programáticamente:**

```sql
-- Tipo de actor
SELECT * FROM get_enum_values('dm_actor_tipo');

-- Naturaleza fiscal
SELECT * FROM get_enum_values('dm_actor_naturaleza_fiscal');

-- Tipo de documento
SELECT * FROM get_enum_values('dm_actor_tipo_documento');

-- Régimen tributario
SELECT * FROM get_enum_values('dm_actor_regimen_tributario');

-- Estado del actor
SELECT * FROM get_enum_values('dm_actor_estado');

-- Género del actor
SELECT * FROM get_enum_values('dm_actor_genero');

-- Estado civil
SELECT * FROM get_enum_values('dm_actor_estado_civil');
```

---

### dm_acciones

**Propósito**: Acciones del club (títulos de valor), maestra sin dueños directos

**PK**: `id` (uuid)

**Filas**: 25

**Columnas (10)**:

| # | Columna | Tipo | Nullable | Default | Descripción |
|---|---------|------|----------|---------|-------------|
| 1 | id | uuid | NO | gen_random_uuid() | Identificador único |
| 2 | organizacion_id | uuid | NO | - | Organización propietaria |
| 3 | codigo_accion | text | NO | - | Código numérico único de 4 dígitos |
| 4 | estado | enum | NO | 'disponible' | Estado: disponible, asignada, arrendada, bloqueada, inactiva |
| 5 | creado_en | timestamptz | SÍ | now() | Fecha y hora de creación |
| 6 | creado_por | uuid | SÍ | auth.uid() | Usuario que creó el registro |
| 7 | actualizado_en | timestamptz | SÍ | now() | Fecha y hora de la última actualización |
| 8 | actualizado_por | uuid | SÍ | - | Usuario que actualizó el registro |
| 9 | eliminado_en | timestamptz | SÍ | - | Marca de tiempo para soft delete |
| 10 | eliminado_por | uuid | SÍ | - | Usuario que realizó la eliminación soft |

**Foreign Keys (4)**:
- organizacion_id → config_organizaciones(id)
- creado_por → auth.users(id)
- actualizado_por → auth.users(id)
- eliminado_por → auth.users(id)

**Unique Constraints**:
- codigo_accion

**Relaciones**:
- Muchos a muchos con dm_actores a través de vn_asociados

**Campos Enum en esta tabla**:

| Campo | Tipo Enum          | Valores Válidos                                                          |
|-------|--------------------|--------------------------------------------------------------------------|
| estado | dm_accion_estado   | `disponible`, `asignada`, `arrendada`, `bloqueada`, `inactiva`           |

**💡 Para obtener estos valores programáticamente:**

```sql
SELECT * FROM get_enum_values('dm_accion_estado');
```

---

## Tablas de Relaciones y Vistas

### vn_asociados

**Propósito**: Asignaciones de acciones a socios con historial temporal

**PK**: `id` (uuid)

**Columnas (20)**:

| # | Columna | Tipo | Nullable | Default | Descripción |
|---|---------|------|----------|---------|-------------|
| 1 | id | uuid | NO | gen_random_uuid() | Identificador único (UUID) de la asignación |
| 2 | accion_id | uuid | NO | - | Referencia a la acción asignada |
| 3 | business_partner_id | uuid | NO | - | Referencia al business partner (persona o empresa) |
| 4 | tipo_asignacion | text | NO | - | Tipo: dueño (00), titular (01), o beneficiario (02+) |
| 5 | subtipo_beneficiario | text | SÍ | - | Clasificación de beneficiarios (conyuge, hijo/a, etc) |
| 6 | subcodigo | text | NO | - | Subcódigo de 2 dígitos: 00, 01, 02+ |
| 7 | codigo_completo | text | NO | - | Código completo: codigo_accion + subcodigo |
| 8 | fecha_inicio | date | NO | CURRENT_DATE | Fecha de inicio de vigencia |
| 9 | fecha_fin | date | SÍ | - | Fecha de fin de vigencia (NULL = vigente) |
| 10 | es_vigente | boolean | SÍ | - | Columna generada: true si fecha_fin IS NULL |
| 11 | precio_transaccion | numeric | SÍ | - | Precio de la transacción (compra/venta/arriendo) |
| 12 | organizacion_id | uuid | NO | - | Organización propietaria (multi-tenancy) |
| 13 | notas | text | SÍ | - | Notas adicionales sobre la asignación |
| 14 | atributos | jsonb | SÍ | '{}'::jsonb | Campos personalizados en formato JSONB |
| 15 | creado_en | timestamptz | NO | now() | Fecha y hora de creación del registro |
| 16 | creado_por | uuid | SÍ | auth.uid() | Usuario que creó el registro |
| 17 | actualizado_en | timestamptz | NO | now() | Fecha y hora de la última actualización |
| 18 | actualizado_por | uuid | SÍ | - | Usuario que realizó la última actualización |
| 19 | eliminado_en | timestamptz | SÍ | - | Fecha y hora de eliminación lógica (soft delete) |
| 20 | eliminado_por | uuid | SÍ | - | Usuario que realizó la eliminación lógica |

**Foreign Keys (6)**:
- organizacion_id → config_organizaciones(id)
- accion_id → dm_acciones(id)
- business_partner_id → dm_actores(id)
- creado_por → auth.users(id)
- actualizado_por → auth.users(id)
- eliminado_por → auth.users(id)

**Columnas Generadas**:
- es_vigente: (fecha_fin IS NULL)

**Check Constraints**:
- subcodigo ~ '^[0-9]{2}$' (formato de 2 dígitos)

**Lógica de subcódigos**:
- 00 = dueño (único por acción)
- 01 = titular (único por acción)
- 02, 03, 04... = beneficiarios (múltiples, secuenciales)

---

### vn_relaciones_actores

**Propósito**: Gestiona los vínculos (laborales, familiares, comerciales) entre socios de negocio

**PK**: `id` (uuid)

**Filas**: 0

**Columnas (19)**:

| # | Columna | Tipo | Nullable | Default | Descripción |
|---|---------|------|----------|---------|-------------|
| 1 | id | uuid | NO | gen_random_uuid() | Identificador único |
| 2 | organizacion_id | uuid | NO | - | Organización propietaria |
| 3 | bp_origen_id | uuid | NO | - | Actor que inicia la relación |
| 4 | bp_destino_id | uuid | NO | - | Actor que recibe la relación |
| 5 | tipo_relacion | enum | NO | - | Categoría: familiar, laboral, referencia, membresia, comercial, otra |
| 6 | rol_origen | text | NO | - | Rol específico del origen en el contexto |
| 7 | rol_destino | text | NO | - | Rol específico del destino en el contexto |
| 8 | atributos | jsonb | NO | '{}'::jsonb | Atributos adicionales de la relación |
| 9 | fecha_inicio | date | SÍ | - | Inicio de vigencia |
| 10 | fecha_fin | date | SÍ | - | Fin de vigencia (NULL = vigente) |
| 11 | es_actual | boolean | SÍ | - | Columna generada: true si fecha_fin IS NULL |
| 12 | es_bidireccional | boolean | NO | false | Si la relación funciona en ambos sentidos |
| 13 | notas | text | SÍ | - | Notas adicionales |
| 14 | creado_en | timestamptz | NO | now() | Fecha y hora de creación |
| 15 | actualizado_en | timestamptz | NO | now() | Fecha y hora de la última actualización |
| 16 | eliminado_en | timestamptz | SÍ | - | Soft delete: timestamp de eliminación lógica |
| 17 | creado_por | uuid | SÍ | auth.uid() | Usuario que creó el registro |
| 18 | actualizado_por | uuid | SÍ | - | Usuario que actualizó el registro |
| 19 | eliminado_por | uuid | SÍ | - | Usuario que eliminó el registro |

**Foreign Keys (6)**:
- organizacion_id → config_organizaciones(id)
- bp_origen_id → dm_actores(id)
- bp_destino_id → dm_actores(id)
- creado_por → auth.users(id)
- actualizado_por → auth.users(id)
- eliminado_por → auth.users(id)

**Columnas Generadas**:
- es_actual: (fecha_fin IS NULL)

**Check Constraints**:
- bp_origen_id != bp_destino_id (no auto-relación)
- fecha_fin >= fecha_inicio OR fecha_fin IS NULL

**Campos Enum en esta tabla**:

| Campo          | Tipo Enum                       | Valores Válidos                                                                      |
|----------------|---------------------------------|--------------------------------------------------------------------------------------|
| tipo_relacion  | dm_actores_tipo_relacion        | `familiar`, `laboral`, `referencia`, `membresia`, `comercial`, `otra`               |

**💡 Para obtener estos valores programáticamente:**

```sql
SELECT * FROM get_enum_values('dm_actores_tipo_relacion');
```

---

## Tablas Transaccionales

### tr_doc_comercial

**Propósito**: Oportunidades, ofertas, pedidos y reservas

**PK**: `id` (uuid)

**Código autogenerado**: `codigo` (DOC-00000001)

**Filas**: 0

**Estructura lógica de columnas**:

1. **IDENTIDAD Y CLASIFICACIÓN** (El "Qué" y "Cuándo")
2. **ACTORES Y RESPONSABILIDADES** (El "Quién")
3. **CONTENIDO FINANCIERO** (El "Cuánto")
4. **CONTEXTO Y EXTENSIONES** (El "Detalle")
5. **AUDITORÍA Y CONTROL** (El "Rastro")

**Columnas (30)**:

| # | Columna | Tipo | Nullable | Default | Descripción |
|---|---------|------|----------|---------|-------------|
| 1 | id | uuid | NO | gen_random_uuid() | Identificador único |
| 2 | codigo | text | NO | DOC-00000001 (seq) | Código único autogenerado |
| 3 | titulo | text | NO | - | Título descriptivo del documento |
| 4 | fecha_doc | date | NO | CURRENT_DATE | Fecha del documento |
| 5 | estado | enum | NO | 'Nueva' | Nueva, En Progreso, Ganada, Pérdida, Descartada |
| 6 | solicitante_id | uuid | NO | - | Referencia a dm_actores |
| 7 | responsable_id | uuid | NO | - | Usuario responsable |
| 8 | organizacion_id | uuid | NO | - | Organización propietaria |
| 9 | monto_estimado | numeric | SÍ | - | Monto estimado inicial |
| 10 | notas | text | SÍ | - | Notas adicionales |
| 11 | atributos | jsonb | NO | '{}'::jsonb | Metadatos adicionales |
| 12 | creado_en | timestamptz | NO | now() | Fecha y hora de creación |
| 13 | creado_por | uuid | SÍ | auth.uid() | Usuario que creó el registro |
| 14 | actualizado_en | timestamptz | NO | now() | Fecha y hora de la última actualización |
| 15 | actualizado_por | uuid | SÍ | - | Usuario que actualizó el registro |
| 16 | eliminado_en | timestamptz | SÍ | - | Marca de tiempo para soft delete |
| 17 | eliminado_por | uuid | SÍ | - | Usuario que realizó la eliminación soft |
| 18 | tags | text[] | SÍ | ARRAY[]::text[] | Etiquetas |
| 19 | moneda_iso | enum | SÍ | 'COP' | Código ISO 4217 de la moneda |
| 20 | valor_neto | numeric | NO | 0 | Subtotal antes de impuestos y descuentos |
| 21 | valor_descuento | numeric | NO | 0 | Total de descuentos aplicados |
| 22 | valor_impuestos | numeric | NO | 0 | Total de impuestos (IVA, tasas) |
| 23 | valor_total | numeric | NO | 0 | Valor final a pagar |
| 24 | fecha_venc_doc | date | SÍ | - | Fecha de vencimiento del documento |
| 26 | asociado_id | uuid | SÍ | - | Referencia a vn_asociados |
| 27 | pagador_id | uuid | SÍ | - | Referencia a dm_actores (puede diferir del solicitante) |
| 28 | documento_origen_id | uuid | SÍ | - | ID del documento de origen (autoreferencia) |
| 29 | items | jsonb | NO | '[]'::jsonb | Ítems de la oportunidad (JSONB) |
| 30 | tipo | enum | NO | 'oportunidad' | oportunidad, oferta, pedido_venta, reserva |
| 31 | sub_tipo | enum | SÍ | - | sol_ingreso, sol_retiro, oferta_eventos, pedido_eventos |

**Foreign Keys (9)**:
- organizacion_id → config_organizaciones(id)
- asociado_id → vn_asociados(id)
- solicitante_id → dm_actores(id)
- pagador_id → dm_actores(id)
- responsable_id → auth.users(id)
- documento_origen_id → tr_doc_comercial(id) [autoreferencia]
- creado_por → auth.users(id)
- actualizado_por → auth.users(id)
- eliminado_por → auth.users(id)

**Unique Constraints**:
- codigo

**Cálculo automático**:
```sql
valor_total = valor_neto - valor_descuento + valor_impuestos
```

**Triggers**:
- tr_doc_comercial_calcular_total() ON INSERT/UPDATE

**Campos Enum en esta tabla**:

| Campo       | Tipo Enum                     | Valores Válidos                                                                 |
|-------------|-------------------------------|---------------------------------------------------------------------------------|
| tipo        | tr_doc_comercial_tipo         | `oportunidad`, `oferta`, `pedido_venta`, `reserva`                              |
| sub_tipo    | tr_doc_comercial_subtipo      | `sol_ingreso`, `sol_retiro`, `oferta_eventos`, `pedido_eventos`                 |
| estado      | tr_doc_comercial_estados      | `Nueva`, `En Progreso`, `Ganada`, `Pérdida`, `Descartada`                        |
| moneda_iso  | config_moneda                 | `COP`, `MXN`, `ARS`, `BRL`, `CLP`, `PEN`, `USD`, `EUR`, `GBP`, `CAD`, `JPY`, `CHF`, `AUD`, `NZD`, `CNY`, `INR`, `KRW`, `SGD`, `HKD`, `SEK`, `NOK`, `DKK`, `PLN`, `TRY`, `ZAR`, `RUB`, `AED`, `SAR`, `ILS`, `CZK`, `HUF`, `RON`, `BGN`, `HRK`, `MYR`, `THB`, `IDR`, `PHP`, `VND`, `TWD`, `ISK` |

**💡 Para obtener estos valores programáticamente:**

```sql
-- Tipo de documento comercial
SELECT * FROM get_enum_values('tr_doc_comercial_tipo');

-- Subtipo de documento comercial
SELECT * FROM get_enum_values('tr_doc_comercial_subtipo');

-- Estado del documento comercial
SELECT * FROM get_enum_values('tr_doc_comercial_estados');

-- Moneda ISO
SELECT * FROM get_enum_values('config_moneda');
```

---

### tr_tareas

**Propósito**: Tareas del sistema con relación a oportunidades y actores

**PK**: `id` (uuid)

**Código autogenerado**: `codigo_tarea` (TSK-00000001)

**Filas**: 0

**Columnas (18)**:

| # | Columna | Tipo | Nullable | Default | Descripción |
|---|---------|------|----------|---------|-------------|
| 1 | id | uuid | NO | gen_random_uuid() | Identificador único |
| 2 | titulo | text | NO | - | Título de la tarea |
| 3 | descripcion | text | SÍ | - | Descripción detallada |
| 4 | prioridad | enum | NO | 'Media' | Baja, Media, Alta, Urgente |
| 5 | estado | enum | NO | 'Pendiente' | Pendiente, En Progreso, Terminada, Pausada, Cancelada |
| 6 | fecha_vencimiento | date | SÍ | - | Fecha de vencimiento |
| 7 | oportunidad_id | uuid | SÍ | - | Referencia a tr_doc_comercial |
| 8 | asignado_a | uuid | NO | - | Usuario asignado |
| 9 | organizacion_id | uuid | NO | - | Organización propietaria |
| 10 | relacionado_con_bp | uuid | SÍ | - | Referencia a dm_actores |
| 11 | creado_en | timestamptz | NO | now() | Fecha y hora de creación |
| 12 | creado_por | uuid | SÍ | auth.uid() | Usuario que creó el registro |
| 13 | actualizado_en | timestamptz | NO | now() | Fecha y hora de la última actualización |
| 14 | actualizado_por | uuid | SÍ | - | Usuario que actualizó el registro |
| 15 | eliminado_en | timestamptz | SÍ | - | Marca de tiempo para soft delete |
| 16 | eliminado_por | uuid | SÍ | - | Usuario que realizó la eliminación soft |
| 17 | tags | text[] | SÍ | ARRAY[]::text[] | Etiquetas |
| 18 | codigo_tarea | text | SÍ | TSK-00000001 (seq) | Código autogenerado de tarea |

**Foreign Keys (7)**:
- organizacion_id → config_organizaciones(id)
- oportunidad_id → tr_doc_comercial(id)
- relacionado_con_bp → dm_actores(id)
- asignado_a → auth.users(id)
- creado_por → auth.users(id)
- actualizado_por → auth.users(id)
- eliminado_por → auth.users(id)

**Unique Constraints**:
- codigo_tarea

**Campos Enum en esta tabla**:

| Campo     | Tipo Enum              | Valores Válidos                                             |
|-----------|------------------------|-------------------------------------------------------------|
| prioridad | tr_tareas_prioridad    | `Baja`, `Media`, `Alta`, `Urgente`                          |
| estado    | tr_tareas_estado       | `Pendiente`, `En Progreso`, `Terminada`, `Pausada`, `Cancelada` |

**💡 Para obtener estos valores programáticamente:**

```sql
-- Prioridad de tarea
SELECT * FROM get_enum_values('tr_tareas_prioridad');

-- Estado de tarea
SELECT * FROM get_enum_values('tr_tareas_estado');
```

---

## Índice General de Tipos de Datos

### Tipos Comunes

| Tipo | Uso | Ejemplo |
|------|-----|---------|
| uuid | Identificadores únicos, PKs, FKs | gen_random_uuid() |
| text | Texto variable | Nombres, descripciones, códigos |
| boolean | Banderas, estados binarios | true, false |
| date | Fechas sin hora | 2025-01-09 |
| timestamptz | Fechas con hora y zona horaria | now() |
| jsonb | Datos estructurados flexibles | '{"key": "value"}' |
| numeric | Valores monetarios, precisión decimal | 12345.67 |
| smallint | Enteros pequeños | Dígito verificación |
| text[] | Arreglos de texto | Etiquetas |
| enum | Valores restringidos predefinidos | Estados, tipos |

### Enums Utilizados

- **config_moneda**: COP, USD, EUR, etc. (40 monedas)
- **config_organizacion_tipo**: club, asociación, federación, fundación, otro
- **dm_actor_estado**: activo, inactivo, bloqueado
- **dm_actor_estado_civil**: soltero, casado, union libre, divorciado, viudo
- **dm_actor_genero**: masculino, femenino, otro, no aplica
- **dm_actor_naturaleza_fiscal**: natural, jurídica
- **dm_actor_regimen_tributario**: responsable de iva, no responsable, etc.
- **dm_actor_tipo_documento**: CC, CE, PA, TI, RC, PEP, PPT, NIT
- **dm_actores_tipo_relacion**: familiar, laboral, referencia, membresía, comercial, otra
- **dm_accion_estado**: disponible, asignada, arrendada, bloqueada, inactiva
- **tr_doc_comercial_estados**: Nueva, En Progreso, Ganada, Pérdida, Descartada
- **tr_doc_comercial_subtipo**: sol_ingreso, sol_retiro, oferta_eventos, pedido_eventos
- **tr_doc_comercial_tipo**: oportunidad, oferta, pedido_venta, reserva
- **tr_tareas_estado**: Pendiente, En Progreso, Terminada, Pausada, Cancelada
- **tr_tareas_prioridad**: Baja, Media, Alta, Urgente

---

## Patrones de Campos

### Campos de Auditoría (Estándar)

Todas las tablas incluyen estos 6 campos:

| Campo | Tipo | Default | Trigger |
|-------|------|---------|---------|
| creado_en | timestamptz | now() | - |
| creado_por | uuid | auth.uid() | - |
| actualizado_en | timestamptz | now() | set_actualizado_por_en() |
| actualizado_por | uuid | - | set_actualizado_por_en() |
| eliminado_en | timestamptz | NULL | Manual |
| eliminado_por | uuid | NULL | set_deleted_by_on_soft_delete() |

### Multi-Tenancy

Todas las tablas de negocio incluyen:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| organizacion_id | uuid (FK) | Organización propietaria |

### Códigos Autogenerados

| Tabla | Campo | Formato | Secuencia |
|-------|-------|---------|-----------|
| dm_actores | codigo_bp | ACT-00000001 | seq_dm_actores_codigo |
| dm_acciones | codigo_accion | 0000 | - |
| tr_doc_comercial | codigo | DOC-00000001 | seq_tr_doc_comercial_codigo |
| tr_tareas | codigo_tarea | TSK-00000001 | seq_tr_tareas_codigo |

---

## Documentos Relacionados

- [OVERVIEW.md](OVERVIEW.md) - Visión general de la base de datos
- [FUNCTIONS.md](FUNCTIONS.md) - Documentación de funciones y procedimientos
- [VIEWS.md](VIEWS.md) - Documentación de vistas de base de datos
- [ENUMS.md](ENUMS.md) - Documentación de tipos enumerados
- [RLS.md](RLS.md) - Políticas de seguridad y RLS
- [API.md](API.md) - Ejemplos de consultas SQL comunes
