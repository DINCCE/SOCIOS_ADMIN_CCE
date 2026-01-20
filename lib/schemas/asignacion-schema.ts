import { z } from "zod"

/**
 * Schema Zod para el formulario de asignación de acciones
 * Valida los campos requeridos para crear una asignación usando vn_asociados_crear_asignacion
 */
export const asignacionSchema = z.object({
  // Sección 1: Acción
  accionId: z.string().uuid("Selecciona una acción"),

  // Sección 2: Asociado
  asociadoId: z.string().uuid("Selecciona un asociado"),

  // Sección 3: Tipo de vínculo
  tipoVinculo: z.enum(["propietario", "titular", "beneficiario", "intermediario"], {
    message: "Selecciona el tipo de vínculo",
  }),
  modalidad: z.enum(["propiedad", "comodato", "asignacion_corp", "convenio"], {
    message: "Selecciona la modalidad",
  }),
  planComercial: z.enum(["regular", "plan dorado", "joven ejecutivo", "honorifico"], {
    message: "Selecciona el plan comercial",
  }),

  // Sección 4: Opcionales
  notas: z.string().optional(),
  atributos: z.record(z.string(), z.any()).optional(),
})

export type AsignacionFormValues = z.infer<typeof asignacionSchema>
