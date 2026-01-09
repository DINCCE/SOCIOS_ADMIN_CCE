# API Documentation - SOCIOS_ADMIN

## Documentación de Endpoints REST (Supabase/PostgREST)

Este documento documenta todos los endpoints REST disponibles en la API de Supabase, incluyendo los CRUD auto-generados por PostgREST y las llamadas RPC a funciones personalizadas.

---

## Índice

1. [Configuración y Autenticación](#1-configuración-y-autenticación)
2. [CRUD Endpoints por Tabla](#2-crud-endpoints-por-tabla)
3. [RPC Functions](#3-rpc-functions)
4. [Ejemplos de Uso](#4-ejemplos-de-uso)
5. [Filtros y Consultas Avanzadas](#5-filtros-y-consultas-avanzadas)
6. [Manejo de Errores](#6-manejo-de-errores)

---

## 1. Configuración y Autenticación

### Base URL

```
https://your-project.supabase.co/rest/v1
```

### Headers Requeridos

```javascript
{
  'apikey': 'YOUR_ANON_KEY',
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json',
  'Prefer': 'return=representation' // Para retornar el registro creado/actualizado
}
```

### Autenticación

La autenticación se maneja vía JWT token en el header `Authorization`. El token se obtiene al iniciar sesión:

```javascript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// El token está en: data.session.access_token
```

---

## 2. CRUD Endpoints por Tabla

### 2.1 Configuración (config_*)

#### config_organizaciones

**Listar organizaciones**
```http
GET /rest/v1/config_organizaciones
```

**Crear organización**
```http
POST /rest/v1/config_organizaciones
```

Body:
```json
{
  "nombre": "Club Deportivo",
  "slug": "club-deportivo",
  "tipo": "club",
  "email": "info@club.com",
  "telefono": "+57 1 123 4567",
  "website": "https://club.com",
  "direccion": {
    "pais": "Colombia",
    "ciudad": "Bogotá",
    "direccion_linea1": "Calle 123 # 45-67"
  }
}
```

**Actualizar organización**
```http
PATCH /rest/v1/config_organizaciones?id=eq.{uuid}
```

**Eliminar organización (soft delete)**
```http
PATCH /rest/v1/config_organizaciones?id=eq.{uuid}
```

Body:
```json
{
  "eliminado_en": "2026-01-09T12:00:00Z"
}
```

---

#### config_organizacion_miembros

**Listar miembros de una organización**
```http
GET /rest/v1/config_organizacion_miembros?organization_id=eq.{uuid}
```

**Agregar miembro a organización**
```http
POST /rest/v1/config_organizacion_miembros
```

Body:
```json
{
  "user_id": "uuid",
  "organization_id": "uuid",
  "role": "admin",
  "atributos": {
    "ui": {
      "theme": "system"
    }
  }
}
```

**Actualizar rol de miembro**
```http
PATCH /rest/v1/config_organizacion_miembros?user_id=eq.{uuid}&organization_id=eq.{uuid}
```

Body:
```json
{
  "role": "owner"
}
```

**Eliminar miembro**
```http
DELETE /rest/v1/config_organizacion_miembros?user_id=eq.{uuid}&organization_id=eq.{uuid}
```

---

#### config_ciudades

**Buscar ciudades**
```http
GET /rest/v1/config_ciudades?city_name=ilike.%bogota%&limit=10
```

**Obtener ciudad por ID**
```http
GET /rest/v1/config_ciudades?id=eq.{uuid}
```

---

### 2.2 Business Partners (dm_*)

#### dm_actores

**Listar actores**
```http
GET /rest/v1/dm_actores?organizacion_id=eq.{uuid}&eliminado_en=is.null
```

**Listar solo personas**
```http
GET /rest/v1/dm_actores?organizacion_id=eq.{uuid}&tipo_actor=eq.persona&eliminado_en=is.null
```

**Listar solo empresas**
```http
GET /rest/v1/dm_actores?organizacion_id=eq.{uuid}&tipo_actor=eq.empresa&eliminado_en=is.null
```

**Listar socios activos**
```http
GET /rest/v1/dm_actores?organizacion_id=eq.{uuid}&es_socio=eq.true&estado_actor=eq.activo
```

**Buscar actor por código**
```http
GET /rest/v1/dm_actores?codigo_bp=eq.ACT-00000001
```

**Buscar actor por nombre o documento**
```http
GET /rest/v1/dm_actores?or=(primer_nombre.ilike.%juan%,primer_apellido.ilike.%pere%,num_documento.eq.12345678)
```

**Crear persona**
```http
POST /rest/v1/dm_actores
```

Body:
```json
{
  "organizacion_id": "uuid",
  "tipo_actor": "persona",
  "nat_fiscal": "natural",
  "tipo_documento": "CC",
  "num_documento": "12345678",
  "primer_nombre": "Juan",
  "segundo_nombre": "Carlos",
  "primer_apellido": "Pérez",
  "segundo_apellido": "García",
  "genero_actor": "masculino",
  "fecha_nacimiento": "1980-05-15",
  "estado_civil": "casado",
  "email_principal": "juan.perez@email.com",
  "telefono_principal": "+57 300 123 4567",
  "direccion_fisica": "Calle 123 # 45-67",
  "ciudad_id": "uuid",
  "es_socio": true,
  "es_cliente": false,
  "es_proveedor": false,
  "estado_actor": "activo",
  "perfil_identidad": {
    "tipo_documento": "CC",
    "lugar_expedicion": "Bogotá",
    "fecha_expedicion": "2010-01-01",
    "nacionalidad": "Colombiana"
  },
  "perfil_profesional_corporativo": {
    "ocupacion": "Ingeniero",
    "sector": "Tecnología",
    "tamano_empresa": "50-100 empleados"
  }
}
```

**Crear empresa**
```http
POST /rest/v1/dm_actores
```

Body:
```json
{
  "organizacion_id": "uuid",
  "tipo_actor": "empresa",
  "nat_fiscal": "jurídica",
  "tipo_documento": "NIT",
  "num_documento": "900123456",
  "razon_social": "Empresa SAS",
  "nombre_comercial": "Mi Empresa",
  "regimen_tributario": "responsable de iva",
  "digito_verificacion": 4,
  "email_principal": "contacto@empresa.com",
  "telefono_principal": "+57 1 123 4567",
  "direccion_fisica": "Carrera 7 # 45-67",
  "ciudad_id": "uuid",
  "es_socio": true,
  "es_cliente": true,
  "es_proveedor": false,
  "estado_actor": "activo",
  "perfil_compliance": {
    "riesgo_bg": "Bajo",
    "estado_fiscal": "Al día",
    "estructura_propiedad": "Persona jurídica"
  }
}
```

**Actualizar actor**
```http
PATCH /rest/v1/dm_actores?id=eq.{uuid}
```

Body:
```json
{
  "email_principal": "nuevo@email.com",
  "telefono_principal": "+57 310 987 6543"
}
```

**Eliminar actor (soft delete)**
```http
PATCH /rest/v1/dm_actores?id=eq.{uuid}
```

Body:
```json
{
  "eliminado_en": "2026-01-09T12:00:00Z"
}
```

---

#### dm_acciones

**Listar acciones**
```http
GET /rest/v1/dm_acciones?organizacion_id=eq.{uuid}&eliminado_en=is.null
```

**Listar acciones disponibles**
```http
GET /rest/v1/dm_acciones?estado=eq.disponible&eliminado_en=is.null
```

**Crear acción**
```http
POST /rest/v1/dm_acciones
```

Body:
```json
{
  "organizacion_id": "uuid",
  "codigo_accion": "0001",
  "estado": "disponible"
}
```

**Actualizar estado de acción**
```http
PATCH /rest/v1/dm_acciones?id=eq.{uuid}
```

Body:
```json
{
  "estado": "asignada"
}
```

---

### 2.3 Relaciones (vn_*)

#### vn_asociados

**Listar asignaciones de acciones**
```http
GET /rest/v1/vn_asociados?organizacion_id=eq.{uuid}&eliminado_en=is.null
```

**Listar asignaciones vigentes**
```http
GET /rest/v1/vn_asociados?organizacion_id=eq.{uuid}&es_vigente=eq.true
```

**Listar acciones de un socio**
```http
GET /rest/v1/vn_asociados?business_partner_id=eq.{uuid}&es_vigente=eq.true
```

**Listar beneficiarios de una acción**
```http
GET /rest/v1/vn_asociados?accion_id=eq.{uuid}&tipo_asignacion=eq.beneficiario
```

**Crear asignación de dueño**
```http
POST /rest/v1/vn_asociados
```

Body:
```json
{
  "organizacion_id": "uuid",
  "accion_id": "uuid",
  "business_partner_id": "uuid",
  "tipo_asignacion": "dueño",
  "subcodigo": "00",
  "fecha_inicio": "2026-01-01"
}
```

**Crear asignación de beneficiario**
```http
POST /rest/v1/vn_asociados
```

Body:
```json
{
  "organizacion_id": "uuid",
  "accion_id": "uuid",
  "business_partner_id": "uuid",
  "tipo_asignacion": "beneficiario",
  "subcodigo": "02",
  "fecha_inicio": "2026-01-01",
  "precio_transaccion": 1500000
}
```

**Finalizar asignación**
```http
PATCH /rest/v1/vn_asociados?id=eq.{uuid}
```

Body:
```json
{
  "fecha_fin": "2026-12-31"
}
```

---

#### vn_relaciones_actores

**Listar relaciones**
```http
GET /rest/v1/vn_relaciones_actores?organizacion_id=eq.{uuid}&eliminado_en=is.null
```

**Listar relaciones vigentes**
```http
GET /rest/v1/vn_relaciones_actores?organizacion_id=eq.{uuid}&es_actual=eq.true
```

**Listar relaciones de un actor**
```http
GET /rest/v1/vn_relaciones_actores?bp_origen_id=eq.{uuid}
```

**Listar relaciones laborales**
```http
GET /rest/v1/vn_relaciones_actores?organizacion_id=eq.{uuid}&tipo_relacion=eq.laboral&es_actual=eq.true
```

**Crear relación**
```http
POST /rest/v1/vn_relaciones_actores
```

Body:
```json
{
  "organizacion_id": "uuid",
  "bp_origen_id": "uuid",
  "bp_destino_id": "uuid",
  "tipo_relacion": "laboral",
  "rol_origen": "Empleado",
  "rol_destino": "Employer",
  "fecha_inicio": "2026-01-01",
  "es_bidireccional": false
}
```

---

### 2.4 Transaccionales (tr_*)

#### tr_doc_comercial

**Listar documentos comerciales**
```http
GET /rest/v1/tr_doc_comercial?organizacion_id=eq.{uuid}&eliminado_en=is.null
```

**Listar oportunidades**
```http
GET /rest/v1/tr_doc_comercial?organizacion_id=eq.{uuid}&tipo=eq.oportunidad
```

**Listar documentos por estado**
```http
GET /rest/v1/tr_doc_comercial?organizacion_id=eq.{uuid}&estado=eq.Ganada
```

**Listar tareas de un responsable**
```http
GET /rest/v1/tr_doc_comercial?responsable_id=eq.{uuid}
```

**Crear oportunidad**
```http
POST /rest/v1/tr_doc_comercial
```

Body:
```json
{
  "organizacion_id": "uuid",
  "fecha_doc": "2026-01-09",
  "estado": "Nueva",
  "tipo": "oportunidad",
  "sub_tipo": "sol_ingreso",
  "solicitante_id": "uuid",
  "pagador_id": "uuid",
  "responsable_id": "uuid",
  "monto_estimado": 5000000,
  "moneda_iso": "COP",
  "items": [
    {
      "descripcion": "Membresía anual",
      "cantidad": 1,
      "valor_unitario": 5000000
    }
  ],
  "valor_neto": 5000000,
  "valor_descuento": 0,
  "valor_impuestos": 950000,
  "notas": "Oportunidad de nuevo socio",
  "tags": ["prioridad-alta", "nuevo-socio"]
}
```

**Actualizar documento**
```http
PATCH /rest/v1/tr_doc_comercial?id=eq.{uuid}
```

Body:
```json
{
  "estado": "Ganada",
  "valor_neto": 4500000,
  "valor_descuento": 500000
}
```

**Eliminar documento (soft delete)**
```http
PATCH /rest/v1/tr_doc_comercial?id=eq.{uuid}
```

Body:
```json
{
  "eliminado_en": "2026-01-09T12:00:00Z"
}
```

---

#### tr_tareas

**Listar tareas**
```http
GET /rest/v1/tr_tareas?organizacion_id=eq.{uuid}&eliminado_en=is.null
```

**Listar tareas pendientes**
```http
GET /rest/v1/tr_tareas?organizacion_id=eq.{uuid}&estado=eq.Pendiente
```

**Listar tareas asignadas a un usuario**
```http
GET /rest/v1/tr_tareas?asignado_a=eq.{uuid}
```

**Listar tareas urgentes**
```http
GET /rest/v1/tr_tareas?organizacion_id=eq.{uuid}&prioridad=eq.Urgente
```

**Listar tareas vencidas**
```http
GET /rest/v1/tr_tareas?organizacion_id=eq.{uuid}&fecha_vencimiento=lt.2026-01-09
```

**Crear tarea**
```http
POST /rest/v1/tr_tareas
```

Body:
```json
{
  "organizacion_id": "uuid",
  "titulo": "Contactar nuevo prospecto",
  "descripcion": "Realizar llamada de seguimiento al interesado en membresía",
  "prioridad": "Alta",
  "estado": "Pendiente",
  "fecha_vencimiento": "2026-01-15",
  "oportunidad_id": "uuid",
  "relacionado_con_bp": "uuid",
  "asignado_a": "uuid",
  "tags": ["llamada", "seguimiento"]
}
```

**Actualizar tarea**
```http
PATCH /rest/v1/tr_tareas?id=eq.{uuid}
```

Body:
```json
{
  "estado": "En Progreso",
  "prioridad": "Urgente"
}
```

**Completar tarea**
```http
PATCH /rest/v1/tr_tareas?id=eq.{uuid}
```

Body:
```json
{
  "estado": "Terminada"
}
```

---

## 3. RPC Functions

Las funciones personalizadas se llaman via POST a `/rpc/{function_name}`.

### 3.1 Utilidades

#### get_enum_values

**Obtener valores de un enum**

```http
POST /rpc/get_enum_values
```

Body:
```json
{
  "p_enum_name": "dm_actor_estado"
}
```

Response:
```json
["activo", "inactivo", "bloqueado"]
```

**Ejemplos de uso:**

```http
POST /rpc/get_enum_values
```

Body:
```json
{ "p_enum_name": "dm_actor_tipo_documento" }
```

Response:
```json
["CC", "CE", "PA", "TI", "RC", "PEP", "PPT", "NIT"]
```

```http
POST /rpc/get_enum_values
```

Body:
```json
{ "p_enum_name": "tr_doc_comercial_estados" }
```

Response:
```json
["Nueva", "En Progreso", "Ganada", "Pérdida", "Descartada"]
```

---

#### search_locations

**Buscar ciudades**

```http
POST /rpc/search_locations
```

Body:
```json
{
  "q": "Bogota",
  "max_results": 10
}
```

Response:
```json
[
  {
    "id": "uuid",
    "city_name": "Bogotá",
    "state_name": "Cundinamarca",
    "country_name": "Colombia",
    "postal_code": "110001",
    "search_text": "bogota cundinamarca colombia"
  }
]
```

---

#### calcular_digito_verificacion_nit

**Calcular dígito de verificación NIT**

```http
POST /rpc/calcular_digito_verificacion_nit
```

Body:
```json
{
  "nit": "900123456"
}
```

Response:
```json
4
```

---

### 3.2 Negocio

#### generar_siguiente_subcodigo

**Generar subcódigo para asignación de acción**

```http
POST /rpc/generar_siguiente_subcodigo
```

Body:
```json
{
  "p_accion_id": "uuid",
  "p_tipo_asignacion": "beneficiario"
}
```

Response:
```json
"02"
```

**Valores retornados:**
- `"00"` - Para tipo_asignacion = "dueño"
- `"01"` - Para tipo_asignacion = "titular"
- `"02"`, `"03"`, etc. - Para tipo_asignacion = "beneficiario" (incremental)

---

## 4. Ejemplos de Uso

### 4.1 JavaScript (Supabase Client)

#### Listar actores con filtros

```javascript
const { data, error } = await supabase
  .from('dm_actores')
  .select('*')
  .eq('organizacion_id', orgId)
  .eq('tipo_actor', 'persona')
  .eq('eliminado_en', null)
  .order('primer_apellido')
```

#### Crear nueva persona

```javascript
const { data, error } = await supabase
  .from('dm_actores')
  .insert({
    organizacion_id: orgId,
    tipo_actor: 'persona',
    nat_fiscal: 'natural',
    tipo_documento: 'CC',
    num_documento: '12345678',
    primer_nombre: 'Juan',
    primer_apellido: 'Pérez',
    email_principal: 'juan@email.com',
    es_socio: true,
    estado_actor: 'activo'
  })
  .select()
```

#### Actualizar estado de documento comercial

```javascript
const { data, error } = await supabase
  .from('tr_doc_comercial')
  .update({
    estado: 'Ganada',
    valor_neto: 4500000,
    valor_descuento: 500000
  })
  .eq('id', docId)
  .select()
```

#### Llamar función RPC

```javascript
const { data, error } = await supabase
  .rpc('get_enum_values', {
    p_enum_name: 'dm_actor_estado'
  })
```

#### Buscar ciudades

```javascript
const { data, error } = await supabase
  .rpc('search_locations', {
    q: 'Bogota',
    max_results: 10
  })
```

#### JOIN entre tablas

```javascript
const { data, error } = await supabase
  .from('vn_asociados')
  .select(`
    id,
    tipo_asignacion,
    fecha_inicio,
    business_partner_id (
      codigo_bp,
      primer_nombre,
      primer_apellido
    ),
    accion_id (
      codigo_accion,
      estado
    )
  `)
  .eq('organizacion_id', orgId)
  .eq('es_vigente', true)
```

---

### 4.2 cURL

#### Listar actores

```bash
curl -X GET 'https://your-project.supabase.co/rest/v1/dm_actores?organizacion_id=eq.{uuid}&eliminado_en=is.null' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Crear actor

```bash
curl -X POST 'https://your-project.supabase.co/rest/v1/dm_actores' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "organizacion_id": "uuid",
    "tipo_actor": "persona",
    "nat_fiscal": "natural",
    "tipo_documento": "CC",
    "num_documento": "12345678",
    "primer_nombre": "Juan",
    "primer_apellido": "Pérez",
    "email_principal": "juan@email.com",
    "es_socio": true,
    "estado_actor": "activo"
  }'
```

#### Llamar RPC

```bash
curl -X POST 'https://your-project.supabase.co/rest/v1/rpc/get_enum_values' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "p_enum_name": "dm_actor_estado"
  }'
```

---

### 4.3 TypeScript

#### Tipo para Actor (Persona)

```typescript
interface ActorPersona {
  id: string
  codigo_bp: string
  organizacion_id: string
  tipo_actor: 'persona'
  nat_fiscal: 'natural'
  tipo_documento: 'CC' | 'CE' | 'PA' | 'TI'
  num_documento: string
  primer_nombre: string
  segundo_nombre?: string
  primer_apellido: string
  segundo_apellido?: string
  genero_actor?: 'masculino' | 'femenino' | 'otro'
  fecha_nacimiento?: string
  estado_civil?: 'soltero' | 'casado' | 'union libre' | 'divorciado' | 'viudo'
  email_principal?: string
  telefono_principal?: string
  es_socio: boolean
  es_cliente: boolean
  es_proveedor: boolean
  estado_actor: 'activo' | 'inactivo' | 'bloqueado'
  perfil_identidad?: any
  perfil_profesional_corporativo?: any
  creado_en: string
  actualizado_en: string
}

// Crear actor
const crearActor = async (actor: Partial<ActorPersona>) => {
  const { data, error } = await supabase
    .from('dm_actores')
    .insert(actor)
    .select()
    .single()

  if (error) throw error
  return data
}
```

---

## 5. Filtros y Consultas Avanzadas

### 5.1 Operadores de Filtrado

| Operador | Descripción | Ejemplo |
|----------|-------------|---------|
| `eq` | Igual a | `?estado=eq.activo` |
| `neq` | No igual a | `?estado=neq.inactivo` |
| `gt` | Mayor que | `?valor_neto=gt.1000000` |
| `gte` | Mayor o igual que | `?valor_neto=gte.1000000` |
| `lt` | Menor que | `?valor_neto=lt.5000000` |
| `lte` | Menor o igual que | `?valor_neto=lte.5000000` |
| `like` | LIKE (case-sensitive) | `?primer_nombre=like.Juan` |
| `ilike` | ILIKE (case-insensitive) | `?primer_nombre=ilike.%juan%` |
| `is` | IS NULL | `?eliminado_en=is.null` |
| `in` | IN (lista) | `?estado=in.(Nueva,En%20Progreso)` |
| `cs` | Contiene JSON array | `?tags=cs.prioridad-alta` |
| `cd` | Contenido en JSON array | `?tags=cs.{prioridad-alta,nuevo-socio}` |
| `or` | OR lógico | `?or=(estado.eq.Nueva,estado.eq.En%20Progreso)` |

### 5.2 Selección de Columnas

**Seleccionar columnas específicas**
```http
GET /rest/v1/dm_actores?select=codigo_bp,primer_nombre,primer_apellido,email_principal
```

**Seleccionar con relaciones (JOIN)**
```http
GET /rest/v1/vn_asociados?select=id,tipo_asignacion,business_partner_id(primer_nombre,primer_apellido),accion_id(codigo_accion,estado)
```

### 5.3 Ordenamiento

**Ordenar ascendentemente**
```http
GET /rest/v1/dm_actores?order=primer_apellido.asc
```

**Ordenar descendentemente**
```http
GET /rest/v1/dm_actores?order=creado_en.desc
```

**Ordenar por múltiples campos**
```http
GET /rest/v1/dm_actores?order=estado_actor.asc,primer_apellido.asc
```

### 5.4 Paginación

**Limit y Offset**
```http
GET /rest/v1/dm_actores?limit=20&offset=0
```

**Rango (para paginación eficiente)**
```http
GET /rest/v1/dm_actores?limit=20
Range: 0-19
```

### 5.5 Consultas Complejas

**Filtros múltiples**
```http
GET /rest/v1/dm_actores?organizacion_id=eq.{uuid}&tipo_actor=eq.persona&estado_actor=eq.activo&eliminado_en=is.null
```

**Búsqueda full-text**
```http
GET /rest/v1/dm_actores?or=(primer_nombre.ilike.%juan%,primer_apellido.ilike.%pere%,email_principal.ilike.%juan%)
```

**Filtrar por JSONB**
```http
GET /rest/v1/dm_actores?perfil_identidad->>nacionalidad=eq.Colombiana
```

**Filtrar por array tags**
```http
GET /rest/v1/tr_tareas?tags=cs.prioridad-alta
```

**Agrupar con count**
```http
GET /rest/v1/dm_actores?organizacion_id=eq.{uuid}&select=estado_actor,count
```

---

## 6. Manejo de Errores

### 6.1 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 OK | Petición exitosa |
| 201 Created | Recurso creado exitosamente |
| 204 No Content | Petición exitosa sin contenido (DELETE) |
| 400 Bad Request | Petición mal formada |
| 401 Unauthorized | No autenticado o token inválido |
| 403 Forbidden | Autenticado pero sin permisos (RLS) |
| 404 Not Found | Recurso no encontrado |
| 409 Conflict | Conflicto (ej: PK duplicada) |
| 500 Internal Server Error | Error del servidor |

### 6.2 Formato de Error

```json
{
  "message": "new row violates row-level security policy",
  "details": "Failing row contains (...)",
  "hint": null,
  "code": "42501"
}
```

### 6.3 Errores Comunes

**Error de RLS (403)**
```json
{
  "message": "new row violates row-level security policy",
  "code": "42501"
}
```
**Solución:** Verificar que el usuario tiene permisos y pertenece a la organización.

**Error de validación (400)**
```json
{
  "message": "null value in column \"email_principal\" violates not-null constraint",
  "code": "23502"
}
```
**Solución:** Enviar todos los campos requeridos.

**Error de duplicado (409)**
```json
{
  "message": "duplicate key value violates unique constraint \"dm_actores_codigo_bp_key\"",
  "code": "23505"
}
```
**Solución:** El código ya existe, generar uno nuevo.

---

## 7. Best Practices

### 7.1 Seguridad

1. **Siempre usar JWT tokens** en el header `Authorization`
2. **Nunca exponer el service_role key** en el cliente
3. **Validar permisos** en el servidor usando RLS
4. **Usar prepared statements** para evitar SQL injection
5. **Implementar rate limiting** para prevenir abuso

### 7.2 Performance

1. **Usar select** para obtener solo columnas necesarias
2. **Implementar paginación** con limit/offset o rangos
3. **Crear índices** en columnas frecuentemente filtradas
4. **Evitar SELECT *** en producción
5. **Usar joins** eficientemente con select anidado

### 7.3 Patrones Recomendados

**Soft Delete**
```javascript
// En lugar de DELETE
await supabase
  .from('dm_actores')
  .delete()
  .eq('id', actorId)

// Usar soft delete
await supabase
  .from('dm_actores')
  .update({ eliminado_en: new Date().toISOString() })
  .eq('id', actorId)
```

**Validar antes de crear**
```javascript
// Obtener valores válidos del enum
const { data: estados } = await supabase
  .rpc('get_enum_values', { p_enum_name: 'dm_actor_estado' })

// Validar
if (!estados.includes(nuevoEstado)) {
  throw new Error(`Estado inválido: ${nuevoEstado}`)
}
```

**Manejo de errores**
```javascript
const { data, error } = await supabase
  .from('dm_actores')
  .insert(actorData)

if (error) {
  // Log para debugging
  console.error('Error creando actor:', error)

  // Mensaje user-friendly
  if (error.code === '23505') {
    throw new Error('El código de actor ya existe')
  }

  throw error
}

return data
```

---

## 8. Documentos Relacionados

- [OVERVIEW.md](OVERVIEW.md) - Visión general de la base de datos
- [TABLES.md](TABLES.md) - Documentación detallada de tablas
- [FUNCTIONS.md](FUNCTIONS.md) - Documentación de funciones y procedimientos
- [RLS.md](RLS.md) - Políticas de seguridad y RLS

---

## 9. Recursos Adicionales

- [Supabase Documentation](https://supabase.com/docs)
- [PostgREST Documentation](https://postgrest.org/en/stable/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
