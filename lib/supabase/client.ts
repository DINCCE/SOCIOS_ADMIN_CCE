import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                flow: 'pkce',
                storage: window.localStorage, // Explicitly use localStorage
                storageKey: 'sb-ywazlajzxwkmqzjhlmao-auth-token', // Match cookie name
            },
            db: { schema: 'public' },
        }
    )
}
