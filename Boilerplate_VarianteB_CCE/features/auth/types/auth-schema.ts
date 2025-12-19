import { z } from 'zod'

export const userAuthSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type UserAuthFormValues = z.infer<typeof userAuthSchema>
