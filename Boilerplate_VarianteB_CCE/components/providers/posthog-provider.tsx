'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
        const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

        // Strict check: boilerplates often launch without all keys.
        // We don't want to crash or spam errors if keys are missing.
        if (key && host) {
            posthog.init(key, {
                api_host: host,
                person_profiles: 'identified_only', // Optimized for privacy/performance
                capture_pageview: false, // We'll handle this manually if needed, or let auto-capture work
                // persistence: 'localStorage+cookie',
            })
        } else if (process.env.NODE_ENV === 'development') {
            console.warn(
                'PostHog Analytics: Skipping initialization (NEXT_PUBLIC_POSTHOG_KEY or HOST missing)'
            )
        }
    }, [])

    return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
