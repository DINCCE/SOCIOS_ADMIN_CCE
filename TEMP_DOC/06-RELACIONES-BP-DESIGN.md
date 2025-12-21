# Sistema de Relaciones entre Business Partners - Diseño Final

**Proyecto:** SOCIOS_ADMIN
**Fecha:** 2024-12-20
**Versión:** 1.0 - Diseño Final

---

## 1. Contexto

El proyecto ya implementó el sistema Business Partners con patrón CTI:
- ✅ `organizations` - Multi-tenancy
- ✅ `business_partners` - Tabla base (CTI)
- ✅ `personas` - Especialización para personas naturales
- ✅ `empresas` - Especialización para empresas

**Ahora necesitamos:** Sistema de relaciones entre Business Partners.

---

## 2. Objetivos

Crear un sistema que permita:

1. ✅ Modelar relaciones familiares (padre-hijo, hermanos, cónyuge) con historial
2. ✅ Modelar relaciones laborales (empleado-empresa) con fechas y cargo
3. ✅ Ser extensible para nuevos tipos sin cambiar schema
4. ✅ Mantener integridad referencial y validaciones
5. ✅ Soportar ~5000 relaciones con buena performance
6. ✅ **Claridad en roles:** cada actor tiene su rol específico en la relación

---

## 3. Conceptos Técnicos Fundamentales

### 3.1 Soft Delete (Borrado Suave)

**¿Qué es?**

Marcar registros como "eliminados" sin borrarlos físicamente de la base de datos.

**Implementación:**

```sql
-- En lugar de:
DELETE FROM bp_relaciones WHERE id = 'xxx';

-- Hacemos:
UPDATE bp_relaciones
SET eliminado_en = NOW()
WHERE id = 'xxx';
```

**Ventajas:**

- ✅ Auditoría completa (qué, cuándo, quién)
- ✅ Recuperación fácil si fue error
- ✅ Mantiene integridad referencial
- ✅ Permite análisis histórico
- ✅ Cumplimiento de regulaciones

**En queries:**

```sql
-- Solo activos (patrón estándar):
SELECT * FROM bp_relaciones WHERE eliminado_en IS NULL;

-- Todo (incluyendo eliminados):
SELECT * FROM bp_relaciones;

-- Solo eliminados:
SELECT * FROM bp_relaciones WHERE eliminado_en IS NOT NULL;
```

---

### 3.2 Bidireccionalidad

**Concepto:**

Algunas relaciones son **simétricas** (bidireccionales), otras son **asimétricas** (direccionales).

**Ejemplos:**

- **Bidireccional:** Juan es hermano de María ↔ María es hermana de Juan
- **Direccional:** Juan es padre de María → María NO es padre de Juan

**Solución Elegida:**

Un solo registro + flag `es_bidireccional` + vista helper que genera automáticamente el registro inverso.

**Ejemplo:**

```sql
-- Guardas UN registro:
INSERT INTO bp_relaciones (
    bp_origen_id, bp_destino_id,
    tipo_relacion,
    rol_origen, rol_destino,
    es_bidireccional
) VALUES (
    'juan-uuid', 'carlos-uuid',
    'familiar',
    'Hermano', 'Hermano',
    true  -- ← Bidireccional
);

-- La vista v_relaciones_bidireccionales AUTOMÁTICAMENTE genera:
-- 1. Juan → Carlos (Hermano) [direccion: 'directo']
-- 2. Carlos → Juan (Hermano) [direccion: 'inverso'] ← generado automáticamente
```

**Vista Helper:**

```sql
CREATE VIEW v_relaciones_bidireccionales AS
-- Registros directos
SELECT *, 'directo' AS direccion
FROM bp_relaciones
WHERE eliminado_en IS NULL

UNION ALL

-- Registros inversos (solo si es_bidireccional = true)
SELECT
    id,
    organizacion_id,
    bp_destino_id AS bp_origen_id,  -- Invierte
    bp_origen_id AS bp_destino_id,  -- Invierte
    tipo_relacion,
    invertir_rol(rol_destino) AS rol_origen,  -- Convierte rol
    invertir_rol(rol_origen) AS rol_destino,  -- Convierte rol
    atributos,
    fecha_inicio,
    fecha_fin,
    es_actual,
    'inverso' AS direccion
FROM bp_relaciones
WHERE es_bidireccional = true
  AND eliminado_en IS NULL;
```

**Beneficio:**

- ✅ Un solo registro en la tabla (no duplicación)
- ✅ Consistencia automática
- ✅ Queries bidireccionales transparentes usando la vista

---

### 3.3 Función `invertir_rol()`

**Propósito:**

Convertir un rol a su inverso cuando se genera el registro bidireccional.

**Implementación:**

```sql
CREATE FUNCTION invertir_rol(rol TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE rol
        -- Relaciones familiares
        WHEN 'Padre' THEN 'Hijo'
        WHEN 'Madre' THEN 'Hija'
        WHEN 'Hijo' THEN 'Padre'
        WHEN 'Hija' THEN 'Madre'
        WHEN 'Hermano' THEN 'Hermano'
        WHEN 'Hermana' THEN 'Hermana'
        WHEN 'Cónyuge' THEN 'Cónyuge'
        WHEN 'Abuelo' THEN 'Nieto'
        WHEN 'Abuela' THEN 'Nieta'
        WHEN 'Nieto' THEN 'Abuelo'
        WHEN 'Nieta' THEN 'Abuela'
        WHEN 'Tío' THEN 'Sobrino'
        WHEN 'Tía' THEN 'Sobrina'
        WHEN 'Sobrino' THEN 'Tío'
        WHEN 'Sobrina' THEN 'Tía'
        WHEN 'Primo' THEN 'Primo'
        WHEN 'Prima' THEN 'Prima'

        -- Relaciones laborales
        WHEN 'Empleado' THEN 'Empleador'
        WHEN 'Empleador' THEN 'Empleado'
        WHEN 'Jefe' THEN 'Subordinado'
        WHEN 'Subordinado' THEN 'Jefe'

        -- Si no hay mapeo, devuelve el mismo
        ELSE rol
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Uso:**

La vista `v_relaciones_bidireccionales` usa esta función para convertir roles al generar registros inversos.

---

## 4. Decisión de Diseño: `rol_origen` + `rol_destino`

### 4.1 Opciones Evaluadas

**Opción A: Campo único `subtipo`**

```sql
tipo_relacion: 'familiar'
subtipo: 'padre-hijo'  -- Ambiguo: ¿quién es quién?
```

✅ Ventajas: Más simple, un solo campo
❌ Desventajas: Ambiguo, necesita siempre función helper

**Opción B: Dos campos `rol_origen` + `rol_destino` (ELEGIDA)**

```sql
tipo_relacion: 'familiar'
rol_origen: 'Padre'    -- Claro: el origen es el padre
rol_destino: 'Hijo'    -- Claro: el destino es el hijo
```

✅ Ventajas: Explícito, auto-documentado, claro
✅ Más flexible para roles complejos
❌ Desventajas: Dos campos (mínimo impacto: ~250 KB para 5000 registros)

### 4.2 Razón de la Elección

**Claridad > Simplicidad técnica**

En 6 meses, cuando alguien vea un query:

```sql
-- Con subtipo único:
SELECT subtipo FROM bp_relaciones WHERE id = 'xxx';
-- Resultado: "padre"
-- ❓ ¿Quién es padre? ¿El origen o el destino?

-- Con roles separados:
SELECT rol_origen, rol_destino FROM bp_relaciones WHERE id = 'xxx';
-- Resultado: rol_origen='Padre', rol_destino='Hijo'
-- ✅ Claro: el origen (BP 1) es el padre, el destino (BP 2) es el hijo
```

**Conclusión:** El código auto-documentado vale más que ahorrar un campo.

---

## 5. Schema Final: Tabla `bp_relaciones`

### 5.1 Definición Completa

```sql
-- ENUM para tipos de relación base
CREATE TYPE tipo_relacion_bp AS ENUM (
    'familiar',      -- Relaciones familiares
    'laboral',       -- Empleado-Empresa
    'referencia',    -- Referencias personales
    'membresia',     -- Membresías en clubes, juntas, asociaciones
    'comercial',     -- Relaciones comerciales/proveedores
    'otra'           -- Tipo customizable
);

-- Tabla principal de relaciones
CREATE TABLE bp_relaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Business Partners involucrados
    bp_origen_id UUID NOT NULL REFERENCES business_partners(id) ON DELETE CASCADE,
    bp_destino_id UUID NOT NULL REFERENCES business_partners(id) ON DELETE CASCADE,

    -- Tipo de relación y roles específicos
    tipo_relacion tipo_relacion_bp NOT NULL,
    rol_origen TEXT NOT NULL,      -- ← Rol del BP origen (ej: "Padre", "Empleado")
    rol_destino TEXT NOT NULL,     -- ← Rol del BP destino (ej: "Hijo", "Empresa")

    -- Metadata flexible por tipo de relación
    atributos JSONB DEFAULT '{}'::jsonb,

    -- Temporalidad
    fecha_inicio DATE,
    fecha_fin DATE,
    es_actual BOOLEAN GENERATED ALWAYS AS (fecha_fin IS NULL) STORED,

    -- Direccionalidad
    es_bidireccional BOOLEAN DEFAULT false,

    -- Observaciones
    notas TEXT,

    -- Audit trail
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    eliminado_en TIMESTAMPTZ,  -- Soft delete

    -- Constraints
    CHECK (bp_origen_id != bp_destino_id),  -- No auto-relaciones
    CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);
```

### 5.2 Índices para Performance

```sql
-- Índices parciales (solo registros activos)
CREATE INDEX idx_bp_relaciones_origen
    ON bp_relaciones(bp_origen_id)
    WHERE eliminado_en IS NULL;

CREATE INDEX idx_bp_relaciones_destino
    ON bp_relaciones(bp_destino_id)
    WHERE eliminado_en IS NULL;

CREATE INDEX idx_bp_relaciones_tipo
    ON bp_relaciones(tipo_relacion)
    WHERE eliminado_en IS NULL;

CREATE INDEX idx_bp_relaciones_org
    ON bp_relaciones(organizacion_id)
    WHERE eliminado_en IS NULL;

CREATE INDEX idx_bp_relaciones_actual
    ON bp_relaciones(es_actual)
    WHERE eliminado_en IS NULL AND es_actual = true;

-- Índice compuesto para queries bidireccionales
CREATE INDEX idx_bp_relaciones_bidireccional
    ON bp_relaciones(bp_origen_id, bp_destino_id, tipo_relacion)
    WHERE eliminado_en IS NULL;

-- Prevenir relaciones duplicadas activas
CREATE UNIQUE INDEX idx_bp_relaciones_unique_activa
    ON bp_relaciones(bp_origen_id, bp_destino_id, tipo_relacion, rol_origen, rol_destino)
    WHERE eliminado_en IS NULL AND es_actual = true;
```

### 5.3 RLS (Row Level Security)

```sql
ALTER TABLE bp_relaciones ENABLE ROW LEVEL SECURITY;

-- Policy básica: usuarios ven relaciones de su organización
CREATE POLICY "Users can view bp_relaciones of their organization"
    ON bp_relaciones FOR SELECT
    USING (
        organizacion_id IN (
            SELECT organizacion_id
            FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

-- Más policies según necesidad (INSERT, UPDATE, DELETE)
```

---

## 6. Funciones y Triggers

### 6.1 Trigger para actualizar timestamp

```sql
CREATE TRIGGER actualizar_bp_relaciones_timestamp
    BEFORE UPDATE ON bp_relaciones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();
```

### 6.2 Validación de tipos compatibles

```sql
CREATE FUNCTION validar_tipo_relacion_compatible()
RETURNS TRIGGER AS $$
BEGIN
    -- Relación familiar: ambos deben ser personas
    IF NEW.tipo_relacion = 'familiar' THEN
        IF NOT EXISTS (
            SELECT 1 FROM business_partners
            WHERE id IN (NEW.bp_origen_id, NEW.bp_destino_id)
            AND tipo_actor = 'persona'
        ) THEN
            RAISE EXCEPTION 'Relaciones familiares solo pueden ser entre personas';
        END IF;
    END IF;

    -- Relación laboral: origen persona, destino empresa
    IF NEW.tipo_relacion = 'laboral' THEN
        IF NOT EXISTS (
            SELECT 1 FROM business_partners
            WHERE id = NEW.bp_origen_id AND tipo_actor = 'persona'
        ) THEN
            RAISE EXCEPTION 'En relación laboral, origen debe ser persona';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM business_partners
            WHERE id = NEW.bp_destino_id AND tipo_actor = 'empresa'
        ) THEN
            RAISE EXCEPTION 'En relación laboral, destino debe ser empresa';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validar_relacion_compatible
    BEFORE INSERT OR UPDATE ON bp_relaciones
    FOR EACH ROW
    EXECUTE FUNCTION validar_tipo_relacion_compatible();
```

---

## 7. Estructura de `atributos` JSONB por Tipo

### 7.1 Relaciones Familiares

```json
{
  "linea": "paterna",  // o "materna"
  "es_biologico": true,
  "es_adoptivo": false,
  "parentesco_politico": false
}
```

### 7.2 Relaciones Laborales

```json
{
  "cargo": "Gerente de Ventas",
  "departamento": "Comercial",
  "tipo_contrato": "indefinido",
  "jornada": "completa",
  "es_principal": true
}
```

### 7.3 Membresías

```json
{
  "tipo_membresia": "junta_directiva",
  "cargo_membresia": "Presidente",
  "entidad": "Junta Directiva Club Social",
  "estado_membresia": "activa"
}
```

### 7.4 Referencias

```json
{
  "tipo_referencia": "personal",
  "relacion": "amigo cercano",
  "años_conocidos": 15
}
```

---

## 8. Ejemplos de Uso

### 8.1 Relación Familiar (Padre-Hijo)

```sql
INSERT INTO bp_relaciones (
    organizacion_id,
    bp_origen_id,
    bp_destino_id,
    tipo_relacion,
    rol_origen,
    rol_destino,
    atributos,
    es_bidireccional,
    fecha_inicio
) VALUES (
    'org-uuid',
    'juan-uuid',
    'maria-uuid',
    'familiar',
    'Padre',      -- ← Claro: Juan es el padre
    'Hija',       -- ← Claro: María es la hija
    '{"linea": "paterna", "es_biologico": true}'::jsonb,
    false,        -- ← No es simétrico
    '2000-05-15'
);
```

### 8.2 Relación Laboral (Empleado-Empresa)

```sql
INSERT INTO bp_relaciones (
    organizacion_id,
    bp_origen_id,
    bp_destino_id,
    tipo_relacion,
    rol_origen,
    rol_destino,
    atributos,
    fecha_inicio
) VALUES (
    'org-uuid',
    'pedro-uuid',
    'empresa-abc-uuid',
    'laboral',
    'Empleado',   -- ← Pedro es empleado
    'Empleador',  -- ← Empresa ABC es empleador
    '{"cargo": "Gerente de Ventas", "departamento": "Comercial", "tipo_contrato": "indefinido"}'::jsonb,
    '2023-01-15'
);
```

### 8.3 Relación entre Hermanos (Bidireccional)

```sql
INSERT INTO bp_relaciones (
    organizacion_id,
    bp_origen_id,
    bp_destino_id,
    tipo_relacion,
    rol_origen,
    rol_destino,
    es_bidireccional,
    fecha_inicio
) VALUES (
    'org-uuid',
    'juan-uuid',
    'carlos-uuid',
    'familiar',
    'Hermano',    -- ← Ambos tienen rol 'Hermano'
    'Hermano',
    true,         -- ← ES simétrico
    '1985-01-01'
);
```

---

## 9. Queries Comunes

### 9.1 Todas las relaciones de una persona

```sql
SELECT
    r.*,
    bp_dest.tipo_actor,
    CASE
        WHEN bp_dest.tipo_actor = 'persona' THEN p.nombres || ' ' || p.apellidos
        WHEN bp_dest.tipo_actor = 'empresa' THEN e.razon_social
    END AS nombre_destino
FROM bp_relaciones r
INNER JOIN business_partners bp_dest ON r.bp_destino_id = bp_dest.id
LEFT JOIN personas p ON bp_dest.id = p.id AND bp_dest.tipo_actor = 'persona'
LEFT JOIN empresas e ON bp_dest.id = e.id AND bp_dest.tipo_actor = 'empresa'
WHERE r.bp_origen_id = 'persona-uuid'
  AND r.eliminado_en IS NULL
ORDER BY r.tipo_relacion, r.fecha_inicio DESC;
```

### 9.2 Relaciones familiares actuales

```sql
SELECT
    r.*,
    r.rol_destino AS parentesco,
    p.nombres || ' ' || p.apellidos AS familiar
FROM bp_relaciones r
INNER JOIN business_partners bp ON r.bp_destino_id = bp.id
INNER JOIN personas p ON bp.id = p.id
WHERE r.bp_origen_id = 'persona-uuid'
  AND r.tipo_relacion = 'familiar'
  AND r.es_actual = true
  AND r.eliminado_en IS NULL;
```

### 9.3 Empleados actuales de una empresa

```sql
SELECT
    r.*,
    r.atributos->>'cargo' AS cargo,
    r.atributos->>'departamento' AS departamento,
    p.nombres || ' ' || p.apellidos AS empleado,
    p.numero_documento
FROM bp_relaciones r
INNER JOIN business_partners bp ON r.bp_origen_id = bp.id
INNER JOIN personas p ON bp.id = p.id
WHERE r.bp_destino_id = 'empresa-uuid'
  AND r.tipo_relacion = 'laboral'
  AND r.es_actual = true
  AND r.eliminado_en IS NULL
ORDER BY r.atributos->>'cargo';
```

### 9.4 Historial laboral de una persona

```sql
SELECT
    r.fecha_inicio,
    r.fecha_fin,
    r.atributos->>'cargo' AS cargo,
    e.razon_social AS empresa,
    CASE
        WHEN r.es_actual THEN 'Actual'
        ELSE 'Finalizado'
    END AS estado
FROM bp_relaciones r
INNER JOIN business_partners bp ON r.bp_destino_id = bp.id
INNER JOIN empresas e ON bp.id = e.id
WHERE r.bp_origen_id = 'persona-uuid'
  AND r.tipo_relacion = 'laboral'
  AND r.eliminado_en IS NULL
ORDER BY r.fecha_inicio DESC;
```

### 9.5 Queries Bidireccionales (usando vista)

```sql
-- Obtener TODAS las relaciones de Juan (directas + inversas)
SELECT
    direccion,
    tipo_relacion,
    rol_origen,
    rol_destino,
    bp_destino_id
FROM v_relaciones_bidireccionales
WHERE bp_origen_id = 'juan-uuid'
  AND tipo_relacion = 'familiar'
ORDER BY rol_destino;

-- Resultado incluye:
-- 1. Juan → María (Padre → Hija) [direccion: 'directo']
-- 2. Juan → Carlos (Hermano → Hermano) [direccion: 'directo']
-- 3. Juan → María (como destino en relación inversa) [direccion: 'inverso']
```

---

## 10. Migración de Datos Existentes

### 10.1 Contactos de Emergencia

Migrar el campo `personas.contacto_emergencia_id` a la tabla de relaciones:

```sql
INSERT INTO bp_relaciones (
    organizacion_id,
    bp_origen_id,
    bp_destino_id,
    tipo_relacion,
    rol_origen,
    rol_destino,
    atributos,
    es_bidireccional,
    fecha_inicio
)
SELECT
    bp.organizacion_id,
    p.id AS bp_origen_id,
    p.contacto_emergencia_id AS bp_destino_id,
    'referencia'::tipo_relacion_bp,
    'Persona',
    'Contacto de Emergencia',
    '{"tipo": "emergencia"}'::jsonb,
    false,
    p.creado_en::date
FROM personas p
INNER JOIN business_partners bp ON p.id = bp.id
WHERE p.contacto_emergencia_id IS NOT NULL
  AND p.eliminado_en IS NULL;

-- Nota: Mantener campo contacto_emergencia_id por compatibilidad
-- o eliminarlo en migración futura una vez validado
```

---

## 11. Ventajas del Diseño Final

1. ✅ **Claridad Absoluta:** Roles explícitos por actor (no hay ambigüedad)
2. ✅ **Flexibilidad con Validación:** ENUM para tipos + JSONB para atributos
3. ✅ **Performance:** Índices parciales + columna generada `es_actual`
4. ✅ **Historial Completo:** Soft delete + fechas inicio/fin
5. ✅ **Bidireccionalidad Automática:** Vista helper + función `invertir_rol()`
6. ✅ **Multi-tenancy:** Campo `organizacion_id` + RLS
7. ✅ **Extensibilidad:** Agregar tipo = modificar ENUM (simple)
8. ✅ **Mantenibilidad:** Código auto-documentado, fácil de entender en el futuro

---

## 12. Próximos Pasos de Implementación

### Orden de ejecución:

1. ✅ Crear ENUM `tipo_relacion_bp`
2. ✅ Crear tabla `bp_relaciones` con todos los campos
3. ✅ Crear índices para performance
4. ✅ Crear función `invertir_rol()`
5. ✅ Crear función `validar_tipo_relacion_compatible()`
6. ✅ Crear trigger `validar_relacion_compatible`
7. ✅ Crear trigger `actualizar_bp_relaciones_timestamp`
8. ✅ Crear vista `v_relaciones_bidireccionales`
9. ✅ Habilitar RLS y crear policies
10. ✅ Migrar datos existentes (contactos emergencia)
11. ✅ Actualizar documentación en `/docs/database/`
12. ✅ Crear tests de validación

---

## 13. Consideraciones Futuras

### 13.1 Performance con > 10k relaciones

- Considerar particionamiento por `organizacion_id`
- Evaluar índices GIN en JSONB si queries por atributos son frecuentes

### 13.2 Validaciones Adicionales

- Reglas de negocio específicas (ej: edad mínima para relación laboral)
- Prevenir relaciones circulares familiares inválidas

### 13.3 Eventos y Notificaciones

- Trigger para notificar cambios en relaciones críticas
- Webhook para integraciones externas

### 13.4 Visualización

- Grafo de relaciones para UI
- Árbol genealógico automático

### 13.5 Tabla de Acciones/Membresías Societarias

**IMPORTANTE:** Las relaciones societarias (acciones del club, participación en equity) NO van en `bp_relaciones`.

Deben ir en tabla separada: `acciones` o `membresias_club` con:
- Relación: `bp_id` → `accion_id`
- Porcentaje de participación
- Fechas de vigencia
- Estado de la membresía

---

## 14. Archivos a Modificar/Crear

### 14.1 Nuevos archivos SQL

- Migration: `supabase/migrations/YYYYMMDD_create_bp_relaciones.sql`

### 14.2 Documentación a actualizar

- `docs/database/SCHEMA.md` - Agregar ERD y sección de relaciones
- `docs/database/TABLES.md` - Documentar tabla `bp_relaciones`
- `docs/database/QUERIES.md` - Agregar ejemplos de queries de relaciones
- `docs/database/OVERVIEW.md` - Mencionar sistema de relaciones en roadmap
- `docs/MIGRATIONS.md` - Documentar migración de relaciones

---

**Fin del Documento**
