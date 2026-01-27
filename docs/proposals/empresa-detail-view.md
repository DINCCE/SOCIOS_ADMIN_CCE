# Proposal: Empresa Detail View

## Overview

Create a comprehensive detail view for empresas (companies) that mirrors the persona detail view architecture while adapting the content for corporate entities. Both personas and empresas share the `dm_actores` database table, differentiated by `tipo_actor` and `nat_fiscal`.

## Key Differences from Persona Detail View

### Fields That Are NOT Applicable to Companies
- **Grupo Familiar** - Family relationships tab and sidebar section
- **Comunicaciones** - Individual communication logs
- **Personal Identity Data** - First/last name, gender, birth date, blood type, marital status
- **Health & Emergency** - Medical information, emergency contacts
- **Professional Profile** - Education, occupation (for individuals)

### Company-Specific Fields (from `dm_actores` + `perfil_profesional_corporativo` JSONB)
- `razon_social` - Legal company name
- `nombre_comercial` - Trade/brand name
- `nit` + `digito_verificacion` - Tax ID
- `tipo_sociedad` - Company type (SAS, SA, Ltda, etc.)
- `fecha_constitucion` - Incorporation date
- `numero_registro` - Registration number
- `codigo_ciiu` - Industry code
- `sector_industria` - Industry sector
- `actividad_economica` - Economic activity
- `tamano_empresa` - Company size (micro, small, medium, large)
- `representante_legal_id` - Legal representative (FK to dm_actores)
- `cargo_representante` - Representative's title
- `ingresos_anuales` - Annual revenue
- `numero_empleados` - Employee count
- `logo_url` - Company logo

---

## Proposed Tab Structure

### Primary Tabs (Always Visible)

| Tab | Icon | Description | Content |
|-----|------|-------------|---------|
| **Resumen** | LayoutDashboard | Overview dashboard | Alerts + Company metrics (replaces persona dashboard) |
| **Perfil** | Building | Corporate profile | Legal, registration, and business information |
| **Relaciones** | Link | Corporate relations | Associated stakeholders, representatives, subsidiaries |

### Secondary Tabs (In "Más" Dropdown)

| Tab | Icon | Description | Status |
|-----|------|-------------|--------|
| **Timeline** | Clock | Audit history | Reuse from persona |
| **Documentos** | FileText | Company documents | New - Chamber of commerce, RUT, etc. |
| **Oportunidades** | Briefcase | Business opportunities | New - Link to `tr_doc_comercial` |
| **Configuración** | Settings | Account settings | Reuse from persona |

**Removed from Persona:**
- ~~Grupo Familiar~~ → Replaced by Relaciones with company-specific relationships
- ~~Comunicaciones~~ → Individual-focused, not applicable
- ~~Consumos~~ → Could be added later if B2B consumption tracking exists

---

## Component Structure

```
app/admin/socios/empresas/[id]/
├── page.tsx                              # Server component - data fetching
└── empresa-page-client.tsx              # (Optional) client wrapper

components/socios/empresas/
├── empresa-detail-header.tsx            # Header with logo, name, status
├── company-identity-panel.tsx           # Sidebar with contact & legal info
├── empresa-tabs-content.tsx             # Main tabs content
├── edit-company-section-sheet.tsx       # Inline edit modal
└── dashboard-cards/
    ├── business-metrics-card.tsx        # NEW: Revenue, employees, industry
    ├── relationship-summary-card.tsx    # NEW: Stakeholders, subsidiaries
    └── compliance-status-card.tsx       # NEW: Documents, certifications
```

---

## Layout Architecture (Same as Persona)

```
┌─────────────────────────────────────────────────────────────────┐
│  PageShell                                                      │
│  ├─────────────────────────────────────────────────────────────│
│  │  [Empresa Detail Header] - Logo, name, status, actions      │
│  ├─────────────────────────────────────────────────────────────│
│  │  PageDetailLayout                                           │
│  │  ┌──────────────────────┬──────────────────────────────────┐│
│  │  │  PageDetailSidebar   │  PageDetailMain                  ││
│  │  │                      │                                  ││
│  │  │  ┌────────────────┐  │  ┌────────────────────────────┐ ││
│  │  │  │ Company Identity│  │  │  Tabs: Resumen Perfil ...  │ ││
│  │  │  │ Panel           │  │  │  ─────────────────────────  │ ││
│  │  │  │                │  │  │                            │ ││
│  │  │  │ - Contact info  │  │  │  [Tab Content]             │ ││
│  │  │  │ - Legal info    │  │  │                            │ ││
│  │  │  │ - Social links  │  │  │                            │ ││
│  │  │  │ - Quick actions │  │  │                            │ ││
│  │  │  └────────────────┘  │  └────────────────────────────┘ ││
│  │  └──────────────────────┴──────────────────────────────────┘│
│  └─────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

---

## Tab Content Details

### 1. Resumen (Overview)

**Purpose:** At-a-glance company intelligence

**Alerts Section:**
- Document expiration alerts (chamber of commerce, RUT)
- Membership renewal reminders
- Compliance warnings

**Dashboard Cards (3-column grid):**

| Card | Content |
|------|---------|
| **Business Metrics** | Annual revenue, employee count, company size, industry sector, CIIU code |
| **Relationship Summary** | Legal representative, shareholders count, subsidiaries, associated companies |
| **Compliance Status** | Document completion %, certification status, last update date |

> **Note:** These cards use mock data initially. Real data queries to be implemented later.

### 2. Perfil (Profile)

**Purpose:** Complete corporate information and registration

**Sections with inline edit capability:**

#### Section 1: Identidad Legal
- Razón Social (legal name)
- Nombre Comercial (trade name)
- NIT con dígito de verificación
- Tipo de Sociedad (SAS, SA, Ltda, etc.)
- Fecha de Constitución
- País de Constitución

#### Section 2: Registro Tributario
- Número de Registro (mercantil)
- Código CIIU
- Sector Industria
- Actividad Económica
- Tamaño Empresa (micro, pequeña, mediana, grande)

#### Section 3: Representación Legal
- Representante Legal (link to persona detail)
- Cargo del Representante
- Datos de contacto del representante

#### Section 4: Datos de Contacto
- Email Principal
- Email Secundario
- Teléfono Principal
- Teléfono Secundario
- WhatsApp corporativo
- Dirección física

#### Section 5: Presencia Digital
- Sitio Web
- LinkedIn Company URL
- Facebook URL
- Instagram Handle
- Twitter/X Handle
- Logo URL

#### Section 6: Métricas de Negocio
- Ingresos Anuales
- Número de Empleados
- Clasificación por tamaño

### 3. Relaciones (Relationships)

**Purpose:** Manage corporate relationships

**Relationship Types:**
- **Representante Legal** - Links to persona (required)
- **Acciones/Propiedad** - Shareholders
- **Subsidiarias** - Subsidiary companies
- **Matriz** - Parent company
- **Asociadas** - Associated companies
- **Proveedores** - Supplier relationships
- **Clientes** - Client relationships

**UI:** Reuse `FamilyGroupSection` pattern but with company-specific roles

### 4. Timeline (Secondary Tab)

**Purpose:** Audit trail

Reuse from persona with company-appropriate events:
- Company registration
- Profile updates
- Status changes
- Document uploads
- Representative changes

### 5. Documentos (Secondary Tab - NEW)

**Purpose:** Company document management

**Document Types:**
- Cámara de comercio (current)
- RUT (tax ID)
- Certificados de existencia
- Poderes de representación
- Estados financieros
- Certificados de cumplimiento

**UI:** Card with placeholder for now - document management to be implemented

### 6. Oportunidades (Secondary Tab - NEW)

**Purpose:** Link business opportunities

**Content:** Link to `tr_doc_comercial` filtered by this company
- Commercial documents
- Offers/quotations
- Orders
- Contracts

**UI:** Reuse existing document list patterns

### 7. Configuración (Secondary Tab)

**Purpose:** Account settings

Reuse from persona with company-appropriate options:
- Access management (who can modify company data)
- Privacy settings
- Notification preferences
- Tags management

---

## Header Component

**File:** `components/socios/empresas/empresa-detail-header.tsx`

**Differences from Persona:**
- Shows company logo instead of avatar initials
- Displays "Razón Social" as primary name
- Shows "Nombre Comercial" as subtitle if different
- Status badge shows company status
- "Empresa" label instead of "Titular"

**Actions:**
- Actividad - Recent interactions
- Editar - Quick edit
- Nueva Acción - Create document/opportunity
- Menu:
  - Imprimir Certificado
  - Descargar PDF
  - Suspender Empresa
  - Cambiar Representante

---

## Sidebar Identity Panel

**File:** `components/socios/empresas/company-identity-panel.tsx`

**Sections:**

1. **Contacto Corporativo**
   - Email principal/secundario
   - Teléfonos con badges (WA)
   - Website (clickable)

2. **Identidad Legal**
   - NIT + DV
   - Tipo de Sociedad
   - País de constitución
   - Fecha de constitución (with age in years)

3. **Representación**
   - Representante legal name (clickable link to persona)
   - Cargo del representante

4. **Relaciones Rápidas**
   - Shareholders (top 3)
   - Subsidiaries count
   - Link to full relationships tab

5. **Presencia Digital**
   - Social media buttons (LinkedIn, Facebook, Instagram, Twitter, Website)

---

## Schema Updates

**File:** `features/socios/types/socios-schema.ts`

The `empresaSchema` already exists but needs alignment with actual `dm_actores` table structure:

```typescript
// Update empresaSchema to match actual dm_actores fields
export const empresaSchema = z.object({
  // Core identity (from dm_actores)
  id: z.string().uuid(),
  codigo_bp: z.string(),
  organizacion_id: z.string().uuid(),
  tipo_actor: z.literal("empresa"),
  nat_fiscal: z.literal("jurídica"),
  estado_actor: z.enum(["activo", "inactivo", "bloqueado"]),

  // Company names (from dm_actores)
  razon_social: z.string(),
  nombre_comercial: z.string().nullable(),

  // Document (from dm_actores)
  tipo_documento: z.literal("NIT"),
  num_documento: z.string(),
  digito_verificacion: z.number().nullable(),

  // Contact (from dm_actores)
  email_principal: z.string().nullable(),
  email_secundario: z.string().nullable(),
  telefono_principal: z.string().nullable(),
  telefono_secundario: z.string().nullable(),

  // Company data from perfil_profesional_corporativo JSONB
  tipo_sociedad: z.string().nullable(),
  fecha_constitucion: z.string().nullable(),
  ciudad_constitucion: z.string().nullable(),
  pais_constitucion: z.string().nullable(),
  numero_registro: z.string().nullable(),
  codigo_ciiu: z.string().nullable(),
  sector_industria: z.string().nullable(),
  actividad_economica: z.string().nullable(),
  tamano_empresa: z.string().nullable(),
  representante_legal_id: z.string().uuid().nullable(),
  cargo_representante: z.string().nullable(),
  ingresos_anuales: z.number().nullable(),
  numero_empleados: z.number().nullable(),
  logo_url: z.string().nullable(),
  website: z.string().nullable(),
  linkedin_url: z.string().nullable(),
  facebook_url: z.string().nullable(),
  instagram_handle: z.string().nullable(),
  twitter_handle: z.string().nullable(),
  whatsapp: z.string().nullable(),

  // Business classifications
  es_socio: z.boolean(),
  es_cliente: z.boolean(),
  es_proveedor: z.boolean(),

  // Metadata
  tags: z.array(z.string()).default([]),
  atributos: z.record(z.string(), z.any()).default({},
  perfil_compliance: z.record(z.string(), z.any()).default({}),

  // Computed
  nit_completo: z.string().nullable(),
  nombre_representante_legal: z.string().nullable(),

  // Timestamps
  creado_en: z.string(),
  actualizado_en: z.string(),
  eliminado_en: z.string().nullable(),
})

export type Empresa = z.infer<typeof empresaSchema>
```

---

## Dashboard Cards Specification

### Card 1: Business Metrics Card

**File:** `components/socios/empresas/dashboard-cards/business-metrics-card.tsx`

```typescript
// Layout structure (similar to FinancialEcosystemCard)
┌──────────────────────────────────────┐
│ Header: 💼 Negocio & Operaciones     │
├──────────────────────────────────────┤
│ Ingresos Anuales                     │
│ $ 2.500.000.000                      │
│ +12% vs año anterior                 │
├──────────────────────────────────────┤
│ Clasificación                        │
│ ● Mediana (50-200 empleados)        │
│ ● Sector: Servicios                  │
├──────────────────────────────────────┤
│ Empleados │ CIIU                     │
│ 125       │ 8299                     │
└──────────────────────────────────────┘
```

### Card 2: Relationship Summary Card

**File:** `components/socios/empresas/dashboard-cards/relationship-summary-card.tsx`

```typescript
┌──────────────────────────────────────┐
│ Header: 🔗 Relaciones Corporativas   │
├──────────────────────────────────────┤
│ Representante Legal                 │
│ Juan Pérez García                   │
│ [Gerente General] → View            │
├──────────────────────────────────────┤
│ Estructura de Propiedad              │
│ ████████░░ 80% Accionistas          │
│ ░░██████░░░ 20% Otros                │
├──────────────────────────────────────┤
│ Subsidiarias │ Vinculadas           │
│ 3           │ 7                     │
└──────────────────────────────────────┘
```

### Card 3: Compliance Status Card

**File:** `components/socios/empresas/dashboard-cards/compliance-status-card.tsx`

```typescript
┌──────────────────────────────────────┐
│ Header: ✓ Documentación & Cumplim.   │
├──────────────────────────────────────┤
│ Estado Documental                    │
│ Completo al 75%                      │
│ ████████░░░░░                        │
├──────────────────────────────────────┤
│ Próximos Vencimientos                │
│ • Camara Comercio: 30 días           │
│ • RUT: Vigente                       │
├──────────────────────────────────────┤
│ Certificaciones                      │
│ ISO 9001 │ SASB │ B Corp             │
└──────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Core Structure (Priority 1)
1. Create `app/admin/socios/empresas/[id]/page.tsx`
2. Create `empresa-detail-header.tsx` (logo, name, status)
3. Create `company-identity-panel.tsx` (sidebar)
4. Create `empresa-tabs-content.tsx` with basic tabs
5. Update `empresaSchema` for detail view

### Phase 2: Resumen Tab (Priority 1)
1. Create alerts section
2. Create `business-metrics-card.tsx`
3. Create `relationship-summary-card.tsx`
4. Create `compliance-status-card.tsx`

### Phase 3: Perfil Tab (Priority 2)
1. Create profile sections
2. Create `edit-company-section-sheet.tsx`
3. Implement inline edit functionality

### Phase 4: Secondary Tabs (Priority 3)
1. Timeline (reuse from persona)
2. Documentos (placeholder)
3. Oportunidades (link to tr_doc_comercial)
4. Configuración (reuse from persona)

### Phase 5: Relations Tab (Priority 2)
1. Adapt `FamilyGroupSection` for company relationships
2. Add company-specific role types
3. Link to legal representative detail

---

## Open Questions

1. **Dashboard for Companies?**
   - The persona dashboard focuses on individual consumption and attendance
   - Companies need business-oriented metrics: revenue, contracts, opportunities
   - **Recommendation:** Yes, but with business-focused cards as proposed above

2. **Should we track company communications?**
   - Individual communications (WhatsApp, email) don't apply
   - Could track corporate communications: newsletters, commercial emails
   - **Recommendation:** Skip for now, add if business need arises

3. **Should we have a "Grupo Empresarial" feature?**
   - Track parent/subsidiary relationships
   - Could be part of the Relations tab
   - **Recommendation:** Start with individual company relations, expand later if needed

4. **How to handle legal representative?**
   - Currently stored as `representante_legal_id` in JSONB
   - Should be clickable link to persona detail
   - **Recommendation:** Show as linked field, allow selection via search

---

## File Creation Checklist

- [ ] `app/admin/socios/empresas/[id]/page.tsx`
- [ ] `components/socios/empresas/empresa-detail-header.tsx`
- [ ] `components/socios/empresas/company-identity-panel.tsx`
- [ ] `components/socios/empresas/empresa-tabs-content.tsx`
- [ ] `components/socios/empresas/edit-company-section-sheet.tsx`
- [ ] `components/socios/empresas/dashboard-cards/business-metrics-card.tsx`
- [ ] `components/socios/empresas/dashboard-cards/relationship-summary-card.tsx`
- [ ] `components/socios/empresas/dashboard-cards/compliance-status-card.tsx`
- [ ] Update `features/socios/types/socios-schema.ts` - empresaSchema

---

## References

- Persona detail page: `app/admin/socios/personas/[id]/page.tsx`
- Persona tabs: `components/socios/personas/person-tabs-content.tsx`
- Persona dashboard: `components/socios/personas/dashboard-cards/`
- Empresa list: `app/admin/socios/empresas/page.tsx`
- Empresa schema: `features/socios/types/socios-schema.ts`
- Company form: `components/socios/empresas/new-company-sheet.tsx`
