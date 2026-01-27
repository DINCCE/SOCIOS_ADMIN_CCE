'use client'

import { cn } from '@/lib/utils'

interface SearchSkeletonProps {
    count?: number
}

/**
 * Premium shimmer skeleton for search results
 * Matches the layout and dimensions of SearchResultItem
 */
export function SearchSkeleton({ count = 4 }: SearchSkeletonProps) {
    return (
        <div className="space-y-1 py-2">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        'flex items-center gap-3 px-4 py-3',
                        'mx-2 my-1 rounded-md animate-pulse'
                    )}
                >
                    {/* Skeleton Icon */}
                    <div className="w-9 h-9 rounded-full bg-muted shrink-0" />

                    {/* Skeleton Content */}
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-muted rounded" />
                        <div className="h-3 w-1/2 bg-muted/60 rounded" />
                    </div>

                    {/* Skeleton Action Icon */}
                    <div className="w-4 h-4 rounded bg-muted/40 shrink-0" />
                </div>
            ))}
        </div>
    )
}
