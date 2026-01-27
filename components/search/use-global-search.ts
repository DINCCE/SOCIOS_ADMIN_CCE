/**
 * Global Search Hook
 *
 * Custom hook for searching across all entities using TanStack Query
 * and the Supabase RPC function search_global.
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { SearchResult } from '@/lib/search/types'
import { SEARCH_MIN_LENGTH, SEARCH_DEBOUNCE_MS, SEARCH_LIMIT } from '@/lib/search/constants'

interface UseGlobalSearchOptions {
  query: string
  orgId: string | null
  enabled?: boolean
}

/**
 * Hook for global search functionality
 *
 * @param options - Search configuration options
 * @returns TanStack Query result with search results
 *
 * @example
 * ```tsx
 * const { data: results, isLoading, isError } = useGlobalSearch({
 *   query: searchQuery,
 *   orgId: organizationId,
 *   enabled: isDialogOpen,
 * })
 * ```
 */
export function useGlobalSearch({
  query,
  orgId,
  enabled = true,
}: UseGlobalSearchOptions) {
  const supabase = createClient()

  return useQuery<SearchResult[]>({
    queryKey: ['global-search', query, orgId],
    queryFn: async () => {
      if (!orgId) {
        throw new Error('Organization ID is required for search')
      }

      const { data, error } = await supabase.rpc('search_global', {
        p_query: query,
        p_org_id: orgId,
        p_limit: SEARCH_LIMIT,
      })

      console.log('🔍 Search RPC call:', { query, orgId, data, error })

      if (error) {
        // Log meaningful error info - handle empty error objects gracefully
        const errorMsg = error.message || error.details || JSON.stringify(error)
        console.error('Search error:', errorMsg)
        throw error
      }

      console.log('✅ Search results:', data)
      return data || []
    },
    enabled: enabled && query.length >= SEARCH_MIN_LENGTH && !!orgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    retry: 1,
  })
}
