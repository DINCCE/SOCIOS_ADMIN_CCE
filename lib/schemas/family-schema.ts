import { z } from "zod"

export const familyFormSchema = z.object({
    persona_id: z.string().min(1, "Debes seleccionar un familiar."),
    relacion: z.enum(["esposo_a", "hijo_a", "padre_madre", "hermano_a", "nieto_a", "otro"]),
})

export type FamilyFormValues = z.infer<typeof familyFormSchema>
