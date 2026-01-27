/**
 * Recent Search Hook
 *
 * Custom hook for managing recent search items using TanStack Query
 * and Supabase RPC functions.
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { RecentSearchItem } from '@/lib/search/types'
import type { SearchResult } from '@/lib/search/types'

interface UseRecentSearchOptions {
  enabled?: boolean
  limit?: number
}

/**
 * Hook for recent search functionality
 *
 * @param options - Configuration options
 * @returns TanStack Query results with recent items and mutation
 *
 * @example
 * ```tsx
 * const { data: recentItems, addRecentItem } = useRecentSearch({
 *   enabled: true,
 *   limit: 5
 * })
 * ```
 */
export function useRecentSearch({ enabled = true, limit = 5 }: UseRecentSearchOptions = {}) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Fetch recent items
  const {
    data: recentItems = [],
    isLoading,
    isError,
  } = useQuery<RecentSearchItem[]>({
    queryKey: ['recent-search-items', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_recent_search_items', {
        p_limit: limit,
      })

      if (error) {
        // Only log if there's a meaningful error message
        if (error.message && Object.keys(error).length > 0) {
          console.error('Recent search error:', error.message)
        }
        // Return empty array instead of throwing - feature gracefully degrades
        return []
      }

      return data || []
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Add recent item mutation
  const addRecentMutation = useMutation({
    mutationFn: async (item: SearchResult) => {
      const { error } = await supabase.rpc('add_recent_search_item', {
        p_entity_id: item.entity_id,
        p_entity_type: item.entity_type,
        p_title: item.title,
        p_route: item.route,
      })

      if (error) {
        // Only log if there's a meaningful error message
        if (error.message && Object.keys(error).length > 0) {
          console.error('Add recent item error:', error.message)
        }
        // Don't throw - feature gracefully degrades
      }
    },
    onSuccess: () => {
      // Invalidate and refetch recent items
      queryClient.invalidateQueries({ queryKey: ['recent-search-items'] })
    },
  })

  /**
   * Add a search result to recent items
   */
  const addRecentItem = (item: SearchResult) => {
    addRecentMutation.mutate(item)
  }

  return {
    recentItems,
    isLoading,
    isError,
    addRecentItem,
    isAdding: addRecentMutation.isPending,
  }
}
