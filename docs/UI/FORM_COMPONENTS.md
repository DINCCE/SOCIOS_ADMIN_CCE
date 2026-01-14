# Form Components Guide

Guía oficial de componentes para formularios en SOCIOS_ADMIN.

## Índice

- [DatePicker](#datepicker)
- [PhoneInput](#phoneinput)
- [Email Input](#email-input)
- [Select/Dropdown](#selectdropdown)
- [Text Input](#text-input)

---

## DatePicker

**Componente**: `@/components/ui/date-picker`

**Librería base**: React DayPicker v9 + shadcn Select

### Configuración Estándar

```tsx
import { DatePicker } from "@/components/ui/date-picker"

<FormField
  control={form.control}
  name="fecha_nacimiento"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
        Fecha de Nacimiento
      </FormLabel>
      <FormControl>
        <DatePicker
          value={field.value as any}
          onChange={field.onChange}
          placeholder="Seleccionar fecha"
          captionLayout="dropdown"
          fromYear={1900}
          toYear={new Date().getFullYear()}
          className={cn(
            "h-11 bg-muted/30 border-muted-foreground/20 focus:ring-primary/20",
            fieldState.invalid && "border-destructive focus-visible:ring-destructive"
          )}
        />
      </FormControl>
      <FormMessage className="text-[10px]" />
    </FormItem>
  )}
/>
```

### Props Importantes

| Prop | Valor | Descripción |
|------|-------|-------------|
| `value` | `field.value as any` | Valor del campo (del form) |
| `onChange` | `field.onChange` | Handler de cambio (del form) |
| `placeholder` | `"Seleccionar fecha"` | Texto placeholder |
| `captionLayout` | `"dropdown"` | Muestra dropdowns para mes/año |
| `fromYear` | `1900` | Año mínimo seleccionable |
| `toYear` | `new Date().getFullYear()` | Año máximo (año actual) |
| `className` | Ver arriba | Estilos consistentes |

### Validación Zod

```tsx
fecha_nacimiento: z.preprocess(
  (val) => (typeof val === "string" && val !== "" ? new Date(val) : val),
  z.date({ message: "La fecha es obligatoria" })
    .max(new Date(), "La fecha no puede ser en el futuro")
)
```

### Características

- ✅ Locale español (date-fns)
- ✅ Dropdowns con shadcn Select
- ✅ Auto-cierre al seleccionar fecha
- ✅ Formato de salida: `yyyy-MM-dd` (string)
- ✅ Validación de rango de fechas

---

## PhoneInput

**Componente**: `@/components/ui/phone-input`

**Librería base**: `react-phone-number-input` + wrapper shadcn

### Configuración Estándar (React Hook Form)

```tsx
import { PhoneInput } from "@/components/ui/phone-input"

<PhoneInput
  name="telefono_principal"
  label="Teléfono / WhatsApp"
  defaultCountry="CO"
  className="bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20"
/>
```

### Configuración Standalone (sin FormField)

```tsx
import { PhoneInputControlled } from "@/components/ui/phone-input"

const [phone, setPhone] = useState<string>()

<PhoneInputControlled
  value={phone}
  onChange={setPhone}
  defaultCountry="CO"
  international
  placeholder="+57 300 123 4567"
  error={customError}
/>
```

### Props Importantes

| Prop | Valor | Descripción |
|------|-------|-------------|
| `name` | `"telefono_principal"` | Nombre del campo en el formulario |
| `label` | `"Teléfono / WhatsApp"` | Etiqueta del campo |
| `defaultCountry` | `"CO"` | País por defecto (Colombia) |
| `international` | `true` | Formato internacional |
| `className` | Ver arriba | Estilos consistentes |

### Validación Zod

Usar el schema `phoneSchema` de `@/schemas/telefono`:

```tsx
import { phoneSchema } from "@/schemas/telefono"

telefono_principal: phoneSchema.refine((val) => val !== null && val !== "", {
  message: "El teléfono es obligatorio",
})
```

### Características

- ✅ Selector de país con bandera
- ✅ Validación E.164 (formato internacional)
- ✅ Formato automático: `+573001234567`
- ✅ Integración con react-hook-form
- ✅ Validación con `libphonenumber-js`
- ✅ Soporte para todos los países

### Schema Completo

El `phoneSchema` incluye:
- Transformación de string vacío → `null`
- Validación de formato E.164
- Validación de longitud (7-15 dígitos)
- Normalización automática a formato internacional

---

## Email Input

**Componente**: `@/components/ui/input` (shadcn)

### Configuración Estándar

```tsx
import { Input } from "@/components/ui/input"

<FormField
  control={form.control}
  name="email_principal"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
        Correo Electrónico
      </FormLabel>
      <FormControl>
        <Input
          className={cn(
            "h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
            fieldState.invalid && "border-destructive focus-visible:ring-destructive"
          )}
          type="email"
          placeholder="usuario@ejemplo.com"
          {...field}
        />
      </FormControl>
      <FormMessage className="text-[10px]" />
    </FormItem>
  )}
/>
```

### Validación Zod

```tsx
email_principal: z.string()
  .min(1, "El correo electrónico es obligatorio")
  .email("Correo inválido")
```

### Props Importantes

| Prop | Valor | Descripción |
|------|-------|-------------|
| `type` | `"email"` | Tipo HTML5 para email |
| `placeholder` | `"usuario@ejemplo.com"` | Texto placeholder |
| `className` | Ver arriba | Altura fija h-11 |

---

## Select/Dropdown

**Componente**: `@/components/ui/select` (shadcn)

### Configuración Estándar con Enums

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<FormField
  control={form.control}
  name="genero"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
        Género
      </FormLabel>
      <Select onValueChange={field.onChange} value={field.value}>
        <FormControl>
          <SelectTrigger className={cn(
            "h-11 bg-muted/30 border-muted-foreground/20 focus:ring-primary/20",
            fieldState.invalid && "border-destructive focus-visible:ring-destructive"
          )}>
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="masculino">Masculino</SelectItem>
          <SelectItem value="femenino">Femenino</SelectItem>
          <SelectItem value="otro">Otro</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage className="text-[10px]" />
    </FormItem>
  )}
/>
```

### Validación Zod con Enums

```tsx
genero: z.enum(["masculino", "femenino", "otro"], {
  message: "Selecciona un género"
})
```

### Props Importantes

| Prop | Valor | Descripción |
|------|-------|-------------|
| `onValueChange` | `field.onChange` | Handler de cambio |
| `value` | `field.value` | Valor actual |
| `placeholder` | `"Seleccionar..."` | Texto placeholder |

---

## Text Input

**Componente**: `@/components/ui/input` (shadcn)

### Configuración Estándar

```tsx
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

<FormField
  control={form.control}
  name="primer_nombre"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
        Primer Nombre
      </FormLabel>
      <FormControl>
        <Input
          className={cn(
            "h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
            fieldState.invalid && "border-destructive focus-visible:ring-destructive"
          )}
          placeholder="Ej: Juan"
          {...field}
        />
      </FormControl>
      <FormMessage className="text-[10px]" />
    </FormItem>
  )}
/>
```

### Validación Zod - Solo Letras

```tsx
const SOLO_LETRAS_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/

primer_nombre: z.string()
  .min(1, "El primer nombre es obligatorio")
  .regex(SOLO_LETRAS_REGEX, "El nombre solo puede contener letras")
```

### Validación Zod - Solo Números

```tsx
const SOLO_NUMEROS_REGEX = /^[0-9]+$/

numero_documento: z.string()
  .min(3, "El número de documento es obligatorio")
  .regex(SOLO_NUMEROS_REGEX, "Solo se permiten números")
```

### Props Importantes

| Prop | Valor | Descripción |
|------|-------|-------------|
| `className` | Ver arriba | Altura fija h-11 |
| `placeholder` | `"Ej: Juan"` | Texto placeholder |
| `inputMode` | `"text"` o `"numeric"` | Tipo de teclado en móviles |

---

## Patrones de Estilo Consistentes

### FormLabel (Etiqueta)

```tsx
<FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
  NOMBRE DEL CAMPO
</FormLabel>
```

### Input/Select/DatePicker (Estilo base)

```tsx
className={cn(
  "h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20",
  fieldState.invalid && "border-destructive focus-visible:ring-destructive"
)}
```

### FormMessage (Mensaje de error)

```tsx
<FormMessage className="text-[10px]" />
```

### Grid Layouts

**2 columnas** (iguales):
```tsx
<div className="grid grid-cols-2 gap-6">
```

**10 columnas** (proporción 50/50):
```tsx
<div className="grid grid-cols-10 gap-4">
  <div className="col-span-5">{/* Campo 1 */}</div>
  <div className="col-span-5">{/* Campo 2 */}</div>
</div>
```

---

## Notas Importantes

1. **Usar siempre FormField** para integración con react-hook-form
2. **Mantener consistencia en nombres de campos** (snake_case en DB, camelCase en frontend)
3. **Validación en el cliente** con Zod antes de enviar al servidor
4. **Transformación de datos**: Fecha → string (yyyy-MM-dd), Teléfono → E.164
5. **Estilos de error**: `border-destructive` y `focus-visible:ring-destructive`

---

## Referencias

- Drawer de nueva persona: `components/socios/personas/new-person-sheet.tsx`
- Schema de persona: `lib/schemas/person-schema.ts`
- Schema de teléfono: `schemas/telefono.ts`
- DatePicker component: `components/ui/date-picker.tsx`
- PhoneInput component: `components/ui/phone-input.tsx`
