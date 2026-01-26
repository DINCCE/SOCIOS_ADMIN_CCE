# Auditoría de Campos - Perfil de Personas

**Fecha:** 2026-01-26
**Propósito:** Mapeo preciso de campos del tab "Perfil" en la vista de detalle de personas, identificando la estructura JSONB y su relación con la UI para implementar validaciones.

---

## Resumen Ejecutivo

El tab **Perfil** de personas tiene 3 secciones editables mediante drawers:
1. **Identificación Personal** (`identity`) → `EditIdentityForm`
2. **Vinculación & Contacto** (`profile`) → `EditProfileForm`
3. **Salud & Emergencia** (`security`) → `EditSecurityForm`

### Distribución de Campos:
- **11 campos directos (1:1)** en `dm_actores` - Datos nucleares
- **15 campos JSONB** distribuidos en 5 perfiles activos
- **4 campos UUID** que son FKs a otras tablas

---

## SECCIÓN 1: Identificación Personal

**Drawer:** `EditIdentityForm` → `updatePersonaIdentity()`
**Sección en UI:** "Identificación Personal"

### Campos Directos (1:1) en `dm_actores`

| Campo UI | Campo BD | Tipo BD | Validación Zod | Server Action |
|----------|----------|---------|----------------|---------------|
| Tipo de Documento | `tipo_documento` | enum | `z.enum(["CC", "CE", "TI", "PA", "RC", "NIT", "PEP", "PPT", "DNI", "NUIP"])` | ✅ Direct update |
| Número de Documento | `num_documento` | text | `z.string().min(1)` | ✅ Direct update |
| Primer Nombre | `primer_nombre` | text | `z.string().min(1)` | ✅ Direct update |
| Segundo Nombre | `segundo_nombre` | text | `z.string().optional().nullable()` | ✅ Direct update |
| Primer Apellido | `primer_apellido` | text | `z.string().min(1)` | ✅ Direct update |
| Segundo Apellido | `segundo_apellido` | text | `z.string().optional().nullable()` | ✅ Direct update |
| Género | `genero_actor` | enum | `z.enum(["masculino", "femenino", "otro", "no aplica"])` | ✅ Direct update (como `genero`) |
| Fecha de Nacimiento | `fecha_nacimiento` | date | `z.string()` | ✅ Direct update |
| Estado Civil | `estado_civil` | enum | `z.enum(["soltero", "casado", "union libre", "divorciado", "viudo"])` | ✅ Direct update |

### Campos JSONB en `perfil_identidad`

| Campo UI | Campo JSONB | Tipo JSONB | Validación Zod | Server Action | Observaciones |
|----------|-------------|------------|----------------|---------------|---------------|
| Fecha de Expedición | `fecha_expedicion` | string (date) | `z.string().optional().nullable()` | ❌ **BUG**: Actualiza columna directa en lugar de JSONB | El server action usa `.update()` directo a `dm_actores.fecha_expedicion` |
| Lugar de Expedición | `lugar_expedicion` | string (legacy) | `z.string().optional().nullable()` | ❌ **BUG**: Actualiza columna directa en lugar de JSONB | Campo legacy para backward compatibility |
| Lugar de Expedición ID | `lugar_expedicion_id` | uuid (FK) | `z.string().uuid().optional().nullable()` | ❌ **BUG**: Actualiza columna directa en lugar de JSONB | FK → `config_ciudades.id` |
| Lugar de Nacimiento | `lugar_nacimiento` | string (legacy) | `z.string().optional().nullable()` | ❌ **BUG**: Actualiza columna directa en lugar de JSONB | Campo legacy para backward compatibility |
| Lugar de Nacimiento ID | `lugar_nacimiento_id` | uuid (FK) | `z.string().uuid().optional().nullable()` | ❌ **BUG**: Actualiza columna directa en lugar de JSONB | FK → `config_ciudades.id` |
| Nacionalidad | `nacionalidad` | string (ISO code) | `z.string().optional().nullable()` | ❌ **BUG**: Actualiza columna directa en lugar de JSONB | Default: "Colombia" |

### 🚨 Problema Crítico Identificado

**INCONSISTENCIA DE DATOS:** Los campos JSONB de `perfil_identidad` se están actualizando como columnas directas en `dm_actores` en lugar de actualizarse dentro del JSONB.

**Código actual problemático:**
```typescript
// app/actions/personas.ts - updatePersonaIdentity()
const { error } = await supabase
  .from('dm_actores')
  .update({
    fecha_expedicion: data.fecha_expedicion,        // ❌ Columna directa
    lugar_expedicion: data.lugar_expedicion,        // ❌ Columna directa
    lugar_expedicion_id: data.lugar_expedicion_id,  // ❌ Columna directa
    lugar_nacimiento: data.lugar_nacimiento,        // ❌ Columna directa
    lugar_nacimiento_id: data.lugar_nacimiento_id,  // ❌ Columna directa
    nacionalidad: data.nacionalidad,                // ❌ Columna directa
  })
```

**Debería ser:**
```typescript
const { error } = await supabase
  .from('dm_actores')
  .update({
    perfil_identidad: {
      fecha_expedicion: data.fecha_expedicion,
      lugar_expedicion: data.lugar_expedicion,
      lugar_expedicion_id: data.lugar_expedicion_id,
      lugar_nacimiento: data.lugar_nacimiento,
      lugar_nacimiento_id: data.lugar_nacimiento_id,
      nacionalidad: data.nacionalidad,
    }
  })
```

---

## SECCIÓN 2: Vinculación & Contacto

**Drawer:** `EditProfileForm` → `updatePersonaProfile()`
**Sección en UI:** "Vinculación & Contacto"

### Subsección 2.1: Datos Institucionales

| Campo UI | Campo BD | Tipo BD | Validación Zod | Server Action | Observaciones |
|----------|----------|---------|----------------|---------------|---------------|
| Código Socio | `codigo_bp` | text | - | Read-only | Auto-generado |
| Estado del Socio | `estado_actor` | enum | `z.enum(["activo", "inactivo", "bloqueado"])` | ✅ Direct update (como `estado`) | |

### Subsección 2.2: Fechas del Club (JSONB)

| Campo UI | Campo JSONB | Tipo JSONB | Validación Zod | Server Action | Observaciones |
|----------|-------------|------------|----------------|---------------|---------------|
| Fecha de Ingreso | `fecha_socio` | string (date) | `z.string().optional().nullable()` | ❌ **BUG**: Actualiza columna directa | Debe ir en `perfil_preferencias` |
| Fecha de Aniversario | `fecha_aniversario` | string (date) | `z.string().optional().nullable()` | ❌ **BUG**: Actualiza columna directa | Debe ir en `perfil_preferencias` |

### Subsección 2.3: Perfil Profesional (JSONB)

| Campo UI | Campo JSONB | Tipo JSONB | Validación Zod | Server Action | Observaciones |
|----------|-------------|------------|----------------|---------------|---------------|
| Nivel Educativo | `nivel_educacion` | enum | `z.enum(["sin estudios", "primaria", "bachillerato", "técnica", "profesional", "especialización", "maestría", "doctorado"])` | ❌ **BUG**: Actualiza columna directa | Debe ir en `perfil_profesional_corporativo` |
| Profesión | `profesion` | string | `z.string().optional().nullable()` | ❌ **BUG**: Actualiza columna directa | Debe ir en `perfil_profesional_corporativo` |
| Ocupación Actual | `ocupacion` | string | `z.string().optional().nullable()` | ❌ **BUG**: Actualiza columna directa | Debe ir en `perfil_profesional_corporativo` |

### Subsección 2.4: Redes Sociales (JSONB)

| Campo UI | Campo JSONB | Tipo JSONB | Validación Zod | Server Action | Observaciones |
|----------|-------------|------------|----------------|---------------|---------------|
| LinkedIn | `linkedin` | string (URL) | `z.string().url().optional().nullable().or(z.literal(""))` | ⚠️ **PARCIAL**: Actualiza `linkedin_url` (columna directa) | Debe ir en `perfil_redes.linkedin` |
| Facebook | `facebook` | string (URL) | `z.string().url().optional().nullable().or(z.literal(""))` | ⚠️ **PARCIAL**: Actualiza `facebook_url` (columna directa) | Debe ir en `perfil_redes.facebook` |
| Instagram | `instagram` | string (handle) | `z.string().optional().nullable()` | ⚠️ **PARCIAL**: Actualiza `instagram_handle` (columna directa) | Debe ir en `perfil_redes.instagram` |
| Twitter/X | `twitter` | string (handle) | `z.string().optional().nullable()` | ⚠️ **PARCIAL**: Actualiza `twitter_handle` (columna directa) | Debe ir en `perfil_redes.twitter` |

**Transformación en el form:**
```typescript
// El form usa nombres camelCase para UI
linkedin_url → linkedin (en cleanedData)
instagram_handle → instagram (en cleanedData)
twitter_handle → twitter (en cleanedData)
facebook_url → facebook (en cleanedData)
```

### Subsección 2.5: Medios de Contacto (Directos)

| Campo UI | Campo BD | Tipo BD | Validación Zod | Server Action | Observaciones |
|----------|----------|---------|----------------|---------------|---------------|
| Email Principal | `email_principal` | text (email) | `z.string().email("Email inválido").optional().nullable()` | ✅ Direct update | Con validación de email |
| Teléfono Principal | `telefono_principal` | text (phone) | `z.string().optional().nullable()` | ✅ Direct update | Con regex phone en BD |
| Email Secundario | `email_secundario` | text (email) | `z.string().email().optional().nullable().or(z.literal(""))` | ✅ Direct update | Con validación de email |
| Teléfono Secundario | `telefono_secundario` | text (phone) | `z.string().optional().nullable()` | ✅ Direct update | Con regex phone en BD |
| WhatsApp | `whatsapp` | string | `z.string().optional().nullable()` | ⚠️ **PARCIAL**: Actualiza columna directa | También está en `perfil_redes.whatsapp` |

### 🚨 Problema Crítico Identificado

**INCONSISTENCIA DE DATOS:** Los campos que deberían ir en JSONB se están actualizando como columnas directas.

**Código actual problemático:**
```typescript
// app/actions/personas.ts - updatePersonaProfile()
const { error: personaError } = await supabase
  .from('dm_actores')
  .update({
    fecha_socio: data.fecha_socio,                          // ❌ Columna directa
    fecha_aniversario: data.fecha_aniversario,              // ❌ Columna directa
    nivel_educacion: data.nivel_educacion,                  // ❌ Columna directa
    profesion: data.profesion,                              // ❌ Columna directa
    linkedin_url: data.linkedin_url,                        // ❌ Columna directa
    instagram_handle: data.instagram,                       // ❌ Columna directa
    twitter_handle: data.twitter,                           // ❌ Columna directa
    facebook_url: data.facebook,                            // ❌ Columna directa
  })
```

**Debería ser:**
```typescript
const { error: personaError } = await supabase
  .from('dm_actores')
  .update({
    perfil_preferencias: {
      fecha_socio: data.fecha_socio,
      fecha_aniversario: data.fecha_aniversario,
    },
    perfil_profesional_corporativo: {
      nivel_educacion: data.nivel_educacion,
      profesion: data.profesion,
      ocupacion: data.ocupacion,
    },
    perfil_redes: {
      linkedin: data.linkedin_url,
      facebook: data.facebook,
      instagram: data.instagram,
      twitter: data.twitter,
      whatsapp: data.whatsapp,
    },
  })
```

---

## SECCIÓN 3: Salud & Emergencia

**Drawer:** `EditSecurityForm` → `updatePersonaSecurity()`
**Sección en UI:** "Salud & Emergencia"

### Subsección 3.1: Información Médica (JSONB)

| Campo UI | Campo JSONB | Tipo JSONB | Validación Zod | Server Action | Observaciones |
|----------|-------------|------------|----------------|---------------|---------------|
| Grupo Sanguíneo | `tipo_sangre` | string (enum) | `z.string().optional().nullable()` | ❌ **BUG**: Actualiza columna directa | Debe ir en `perfil_salud.tipo_sangre` |
| EPS / Prepagada | `eps` | string | `z.string().optional().nullable()` | ❌ **BUG**: Actualiza columna directa | Debe ir en `perfil_salud.eps` |

**Opciones validadas para tipo_sangre:**
- O+, O-, A+, A-, B+, B-, AB+, AB-

**Opciones de EPS:** Constante `EPS_OPTIONS` en `lib/constants.ts`

### Subsección 3.2: Contacto de Emergencia (JSONB)

| Campo UI | Campo JSONB | Tipo JSONB | Validación Zod | Server Action | Observaciones |
|----------|-------------|------------|----------------|---------------|---------------|
| Parentesco | `relacion_emergencia` | string (enum) | `z.string().optional().nullable()` | ❌ **BUG**: Actualiza columna directa | Debe ir en `perfil_contacto.relacion_emergencia` |
| ID Contacto | `contacto_emergencia_id` | uuid (FK) | `z.string().uuid().optional().nullable()` | ❌ **BUG**: Actualiza columna directa | Debe ir en `perfil_contacto.contacto_emergencia_id`. FK → `dm_actores.id` |

**Opciones validadas para parentesco:**
- conyuge, padre, madre, hijo, hermano, amigo, otro

**Nota en UI:**
> "Selecciona el parentesco con el contacto de emergencia. El sistema de búsqueda de contactos será implementado en una futura versión."

### 🚨 Problema Crítico Identificado

**INCONSISTENCIA DE DATOS:** Los campos médicos y de emergencia se están actualizando como columnas directas.

**Código actual problemático:**
```typescript
// app/actions/personas.ts - updatePersonaSecurity()
const { error } = await supabase
  .from('dm_actores')
  .update({
    tipo_sangre: data.tipo_sangre,                    // ❌ Columna directa
    eps: data.eps,                                    // ❌ Columna directa
    contacto_emergencia_id: data.contacto_emergencia_id, // ❌ Columna directa
    relacion_emergencia: data.relacion_emergencia,    // ❌ Columna directa
  })
```

**Debería ser:**
```typescript
const { error } = await supabase
  .from('dm_actores')
  .update({
    perfil_salud: {
      tipo_sangre: data.tipo_sangre,
      eps: data.eps,
    },
    perfil_contacto: {
      contacto_emergencia_id: data.contacto_emergencia_id,
      relacion_emergencia: data.relacion_emergencia,
    },
  })
```

---

## Estructura JSONB Definitiva por Perfil

### `perfil_identidad`
```jsonb
{
  "nacionalidad": "string (ISO code, default: 'CO')",
  "fecha_expedicion": "string (ISO date)",
  "lugar_expedicion": "string (legacy, backward compatibility)",
  "lugar_expedicion_id": "uuid (FK → config_ciudades.id)",
  "lugar_nacimiento": "string (legacy, backward compatibility)",
  "lugar_nacimiento_id": "uuid (FK → config_ciudades.id)"
}
```
**Total:** 6 campos
**Usados en UI:** 6 campos (100%)
**Campos con FK:** 2

---

### `perfil_preferencias`
```jsonb
{
  "fecha_socio": "string (ISO date)",
  "fecha_aniversario": "string (ISO date)"
}
```
**Total:** 2 campos
**Usados en UI:** 2 campos (100%)
**Sección:** Datos Institucionales

---

### `perfil_profesional_corporativo`
```jsonb
{
  "ocupacion": "string",
  "profesion": "string",
  "nivel_educacion": "enum: sin estudios | primaria | bachillerato | técnica | profesional | especialización | maestría | doctorado"
}
```
**Total:** 3 campos
**Usados en UI:** 3 campos (100%)
**Sección:** Perfil Profesional

---

### `perfil_redes`
```jsonb
{
  "linkedin": "string (URL)",
  "facebook": "string (URL)",
  "instagram": "string (handle, @usuario)",
  "twitter": "string (handle, @usuario)",
  "foto_url": "string (URL)",
  "whatsapp": "string (phone number)"
}
```
**Total:** 6 campos
**Usados en UI:** 5 campos (83%)
**No usado en Perfil:** `foto_url` (se usa en header)
**Sección:** Redes Sociales

---

### `perfil_salud`
```jsonb
{
  "tipo_sangre": "enum: O+ | O- | A+ | A- | B+ | B- | AB+ | AB-",
  "eps": "string",
  "estado_vital": "enum: vivo | fallecido | desconocido (default: vivo)"
}
```
**Total:** 3 campos
**Usados en UI:** 2 campos (67%)
**No usado en form:** `estado_vital` (se muestra en UI pero no es editable)
**Sección:** Información Médica

---

### `perfil_contacto`
```jsonb
{
  "contacto_emergencia_id": "uuid (FK → dm_actores.id)",
  "relacion_emergencia": "enum: conyuge | padre | madre | hijo | hermano | amigo | otro"
}
```
**Total:** 2 campos
**Usados en UI:** 2 campos (100%)
**Campos con FK:** 1
**Sección:** Contacto de Emergencia

---

## Mapa de Transformación UI ↔ BD

### Form → Server Action → JSONB

#### `EditIdentityForm` → `updatePersonaIdentity()`

```typescript
// Form fields (camelCase)
tipo_documento      → dm_actores.tipo_documento (directo) ✅
numero_documento    → dm_actores.num_documento (directo) ✅
fecha_expedicion    → perfil_identidad.fecha_expedicion ❌
lugar_expedicion    → perfil_identidad.lugar_expedicion ❌
lugar_expedicion_id → perfil_identidad.lugar_expedicion_id ❌
primer_nombre       → dm_actores.primer_nombre (directo) ✅
segundo_nombre      → dm_actores.segundo_nombre (directo) ✅
primer_apellido     → dm_actores.primer_apellido (directo) ✅
segundo_apellido    → dm_actores.segundo_apellido (directo) ✅
genero              → dm_actores.genero_actor (directo) ✅
fecha_nacimiento    → dm_actores.fecha_nacimiento (directo) ✅
lugar_nacimiento    → perfil_identidad.lugar_nacimiento ❌
lugar_nacimiento_id → perfil_identidad.lugar_nacimiento_id ❌
nacionalidad        → perfil_identidad.nacionalidad ❌
estado_civil        → dm_actores.estado_civil (directo) ✅
```

#### `EditProfileForm` → `updatePersonaProfile()`

```typescript
// Form fields (camelCase)
estado               → dm_actores.estado_actor (directo) ✅
fecha_socio          → perfil_preferencias.fecha_socio ❌
fecha_aniversario    → perfil_preferencias.fecha_aniversario ❌
nivel_educacion      → perfil_profesional_corporativo.nivel_educacion ❌
profesion            → perfil_profesional_corporativo.profesion ❌
ocupacion            → perfil_profesional_corporativo.ocupacion ❌
linkedin_url         → perfil_redes.linkedin ❌
instagram_handle     → perfil_redes.instagram ❌
twitter_handle       → perfil_redes.twitter ❌
facebook_url         → perfil_redes.facebook ❌
email_principal      → dm_actores.email_principal (directo) ✅
telefono_principal   → dm_actores.telefono_principal (directo) ✅
email_secundario     → dm_actores.email_secundario (directo) ✅
telefono_secundario  → dm_actores.telefono_secundario (directo) ✅
whatsapp             → perfil_redes.whatsapp ❌
```

#### `EditSecurityForm` → `updatePersonaSecurity()`

```typescript
// Form fields (camelCase)
tipo_sangre           → perfil_salud.tipo_sangre ❌
eps                   → perfil_salud.eps ❌
contacto_emergencia_id → perfil_contacto.contacto_emergencia_id ❌
relacion_emergencia   → perfil_contacto.relacion_emergencia ❌
```

---

## Estado Actual de Validaciones

### ✅ Validaciones Implementadas (Zod en Forms)

#### `EditIdentityForm` (`identitySchema`)
```typescript
tipo_documento: enum (10 valores)
numero_documento: min(1)
fecha_expedicion: string.optional.nullable
lugar_expedicion: string.optional.nullable
lugar_expedicion_id: uuid.optional.nullable
primer_nombre: min(1)
segundo_nombre: optional.nullable
primer_apellido: min(1)
segundo_apellido: optional.nullable
genero: enum (4 valores)
fecha_nacimiento: string
lugar_nacimiento: string.optional.nullable
lugar_nacimiento_id: uuid.optional.nullable
nacionalidad: string.optional.nullable
estado_civil: enum (5 valores)
```

#### `EditProfileForm` (`profileSchema`)
```typescript
estado: enum (3 valores)
fecha_socio: string.optional.nullable
fecha_aniversario: string.optional.nullable
nivel_educacion: enum (8 valores)
profesion: string.optional.nullable
ocupacion: string.optional.nullable
linkedin_url: url.optional.nullable.or(literal(""))
instagram_handle: string.optional.nullable
twitter_handle: string.optional.nullable
facebook_url: url.optional.nullable.or(literal(""))
email_principal: email.optional.nullable
telefono_principal: string.optional.nullable
email_secundario: email.optional.nullable.or(literal(""))
telefono_secundario: string.optional.nullable
whatsapp: string.optional.nullable
```

#### `EditSecurityForm` (`securitySchema`)
```typescript
tipo_sangre: string.optional.nullable (con opciones UI específicas)
eps: string.optional.nullable (con opciones EPS_OPTIONS)
contacto_emergencia_id: uuid.optional.nullable
relacion_emergencia: string.optional.nullable (con opciones UI específicas)
```

### ❌ Validaciones Faltantes

1. **Validación de URLs en redes sociales**
   - Actualmente: `z.string().url()` solo para linkedin y facebook
   - Falta: Validar formato específico de cada red (ej: linkedin.com/in/, instagram.com/)

2. **Validación de FKs en JSONB**
   - `lugar_expedicion_id`, `lugar_nacimiento_id`: No verifican existencia en `config_ciudades`
   - `contacto_emergencia_id`: No verifica existencia en `dm_actores`

3. **Validación de enums en JSONB**
   - `tipo_sangre`: Enum hardcodeado en UI, no en schema Zod
   - `nivel_educacion`: Diferencia entre schema y opciones UI
   - `relacion_emergencia`: Enum hardcodeado en UI, no en schema Zod

4. **Validación de formatos específicos**
   - Instagram handle: Debería empezar con @
   - Twitter handle: Debería empezar con @
   - WhatsApp: Debería validar formato internacional

---

## Problemas Críticos Identificados

### 🔴 CRÍTICO: Inconsistencia de Datos en JSONB

**Descripción:**
Los campos que deberían almacenarse en JSONB se están guardando como columnas directas en `dm_actores`, causando:

1. **Duplicación de datos:** Mismo dato en columna directa y JSONB
2. **Pérdida de datos:** Al leer de JSONB (helper) y guardar en columna directa
3. **Inconsistencia:** UI muestra datos del JSONB pero guarda en columna directa
4. **Confusión:** No se sabe cuál es la fuente de verdad

**Archivos afectados:**
- `app/actions/personas.ts` - Server Actions
- `lib/utils/jsonb-helpers.ts` - Helper de extracción
- `features/socios/types/socios-schema.ts` - Schema TypeScript

**Impacto:**
- 15 campos JSONB afectados
- 3 secciones del perfil con problemas
- Posible pérdida de datos al editar

### 🟡 IMPORTANTE: Validaciones Incompletas

**Descripción:**
Los validadores Zod en los forms no coinciden con las restricciones de negocio:

1. **Schema vs UI mismatch:**
   - `nivel_educacion` en schema tiene 8 valores
   - UI tiene opciones diferentes (incluye "tecnologo", "pregrado", "posgrado")
   - Falta alineación entre schema y constantes

2. **Hardcoded options:**
   - `tipo_sangre` en UI no está en schema Zod
   - `relacion_emergencia` en UI no está en schema Zod
   - Falta centralización de constantes

### 🟢 MENOR: Campos No Utilizados

**Perfiles JSONB sin uso en tab Perfil:**
- `perfil_intereses` - No tiene UI en el tab Perfil
- `perfil_compliance` - No tiene UI en el tab Perfil
- `perfil_referencias` - No tiene UI en el tab Perfil
- `perfil_redes.foto_url` - Se usa en header pero no en form de edición

---

## Recomendaciones

### 1. CORREGIR Server Actions para JSONB (URGENTE)

Actualizar los 3 Server Actions para que guarden en la estructura JSONB correcta:

```typescript
// app/actions/personas.ts

export async function updatePersonaIdentity(id: string, data: IdentityData) {
  const supabase = await createClient()

  // Obtener datos actuales para preservar otros campos del JSONB
  const { data: current } = await supabase
    .from('dm_actores')
    .select('perfil_identidad')
    .eq('id', id)
    .single()

  const currentPerfil = current?.perfil_identidad || {}

  const { error } = await supabase
    .from('dm_actores')
    .update({
      // Campos directos
      tipo_documento: data.tipo_documento,
      num_documento: data.numero_documento,
      primer_nombre: data.primer_nombre,
      segundo_nombre: data.segundo_nombre,
      primer_apellido: data.primer_apellido,
      segundo_apellido: data.segundo_apellido,
      genero_actor: data.genero,
      fecha_nacimiento: data.fecha_nacimiento,
      estado_civil: data.estado_civil,
      // JSONB: merge con datos existentes
      perfil_identidad: {
        ...currentPerfil,
        nacionalidad: data.nacionalidad,
        fecha_expedicion: data.fecha_expedicion,
        lugar_expedicion: data.lugar_expedicion,
        lugar_expedicion_id: data.lugar_expedicion_id,
        lugar_nacimiento: data.lugar_nacimiento,
        lugar_nacimiento_id: data.lugar_nacimiento_id,
      },
    })
    .eq('id', id)

  // ...
}
```

### 2. Crear Schemas Zod por Perfil JSONB

```typescript
// lib/schemas/perfil-identidad-schema.ts
export const perfilIdentidadSchema = z.object({
  nacionalidad: z.string().max(100).nullable(),
  fecha_expedicion: z.string().datetime().nullable(),
  lugar_expedicion: z.string().max(200).nullable(),
  lugar_expedicion_id: z.string().uuid().nullable(),
  lugar_nacimiento: z.string().max(200).nullable(),
  lugar_nacimiento_id: z.string().uuid().nullable(),
})

// lib/schemas/perfil-profesional-schema.ts
export const perfilProfesionalSchema = z.object({
  ocupacion: z.string().max(200).nullable(),
  profesion: z.string().max(200).nullable(),
  nivel_educacion: z.enum([
    "sin estudios", "primaria", "bachillerato",
    "técnica", "profesional", "especialización",
    "maestría", "doctorado"
  ]).nullable(),
})

// lib/schemas/perfil-salud-schema.ts
const TIPO_SANGRE_OPTIONS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const

export const perfilSaludSchema = z.object({
  tipo_sangre: z.enum(TIPO_SANGRE_OPTIONS).nullable(),
  eps: z.string().max(200).nullable(),
  estado_vital: z.enum(["vivo", "fallecido", "desconocido"]).default("vivo"),
})

// lib/schemas/perfil-redes-schema.ts
export const perfilRedesSchema = z.object({
  linkedin: z.string().url().nullable().or(z.literal("")),
  facebook: z.string().url().nullable().or(z.literal("")),
  instagram: z.string().regex(/^@?[\w.]+$/).nullable(),
  twitter: z.string().regex(/^@?[\w.]+$/).nullable(),
  foto_url: z.string().url().nullable(),
  whatsapp: z.string().regex(/^\+?\d{10,15}$/).nullable(),
})

// lib/schemas/perfil-contacto-schema.ts
const PARENTESCO_OPTIONS = [
  "conyuge", "padre", "madre", "hijo",
  "hermano", "amigo", "otro"
] as const

export const perfilContactoSchema = z.object({
  contacto_emergencia_id: z.string().uuid().nullable(),
  relacion_emergencia: z.enum(PARENTESCO_OPTIONS).nullable(),
})

// lib/schemas/perfil-preferencias-schema.ts
export const perfilPreferenciasSchema = z.object({
  fecha_socio: z.string().datetime().nullable(),
  fecha_aniversario: z.string().datetime().nullable(),
})
```

### 3. Implementar Validación de FKs

```typescript
// lib/validations/fk-validation.ts

export async function validateCiudadId(ciudadId: string | null): Promise<boolean> {
  if (!ciudadId) return true
  const supabase = await createClient()
  const { data } = await supabase
    .from('config_ciudades')
    .select('id')
    .eq('id', ciudadId)
    .is('eliminado_en', null)
    .single()
  return !!data
}

export async function validateActorId(actorId: string | null): Promise<boolean> {
  if (!actorId) return true
  const supabase = await createClient()
  const { data } = await supabase
    .from('dm_actores')
    .select('id')
    .eq('id', actorId)
    .is('eliminado_en', null)
    .single()
  return !!data
}
```

### 4. Migración de Datos

Script para migrar datos de columnas directas a JSONB:

```sql
-- Migrar perfil_identidad
UPDATE dm_actores
SET perfil_identidad = jsonb_set(
  COALESCE(perfil_identidad, '{}'::jsonb),
  '{nacionalidad}',
  COALESCE(to_jsonb(nacionalidad), 'null'::jsonb)
)
WHERE nacionalidad IS NOT NULL;

-- Migrar perfil_profesional_corporativo
UPDATE dm_actores
SET perfil_profesional_corporativo = jsonb_set(
  COALESCE(perfil_profesional_corporativo, '{}'::jsonb),
  '{nivel_educacion}',
  COALESCE(to_jsonb(nivel_educacion), 'null'::jsonb)
)
WHERE nivel_educacion IS NOT NULL;

-- Similar para otros campos...
```

---

## Próximos Pasos

1. ✅ **Auditoría completada** (este documento)
2. ⏳ **Corregir Server Actions** para usar JSONB correctamente
3. ⏳ **Crear schemas Zod** para cada perfil JSONB
4. ⏳ **Implementar validación de FKs** en Server Actions
5. ⏳ **Ejecutar migración de datos** para mover a JSONB
6. ⏳ **Actualizar types** en `socios-schema.ts`
7. ⏳ **Agregar pruebas** para validaciones JSONB
8. ⏳ **Documentar estructura JSONB** en docs/database/

---

## Métricas Finales

| Métrica | Valor | Estado |
|---------|-------|--------|
| Campos totales en tab Perfil | 26 | - |
| Campos 1:1 (directos) | 11 | ✅ Funcionales |
| Campos JSONB (deben ser) | 15 | 🔴 **Guardan como columnas directas** |
| Perfiles JSONB usados | 5 de 9 | ⚠️ 4 sin uso |
| Server Actions con bugs | 3 de 3 | 🔴 **100% afectados** |
| Campos con validación Zod | 26 | ✅ Completos |
| Campos con validación FK | 0 | ❌ **Sin validar** |
