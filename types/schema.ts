import { z } from 'zod'

export const profileSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    full_name: z.string().min(2).optional(),
    avatar_url: z.string().url().optional(),
    updated_at: z.string().datetime().optional(),
})

export const tenantSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(3),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug must be kebab-case'),
    plan: z.enum(['free', 'pro', 'enterprise']),
})

export type Profile = z.infer<typeof profileSchema>
export type Tenant = z.infer<typeof tenantSchema>
