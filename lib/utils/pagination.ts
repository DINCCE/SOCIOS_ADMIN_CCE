/**
 * Pagination utilities for dynamic page size calculation
 *
 * These functions provide intelligent defaults for table pagination
 * based on the total number of records available.
 */

/**
 * Calculates the optimal default page size based on total record count.
 *
 * Rules:
 * - ≤ 10 records: 10 rows per page
 * - 11-20 records: 20 rows per page
 * - 21-50 records: 50 rows per page
 * - > 50 records: 100 rows per page (maximum)
 *
 * @param totalRecords - The total number of records available
 * @returns The recommended default page size
 *
 * @example
 * ```ts
 * calculateDefaultPageSize(5)   // returns 10
 * calculateDefaultPageSize(15)  // returns 20
 * calculateDefaultPageSize(35)  // returns 50
 * calculateDefaultPageSize(150) // returns 100
 * ```
 */
export function calculateDefaultPageSize(totalRecords: number): number {
  if (totalRecords <= 10) return 10
  if (totalRecords <= 20) return 20
  if (totalRecords <= 50) return 50
  return 100
}

/**
 * Returns available page size options based on total record count.
 *
 * Shows only relevant options to avoid displaying page sizes that
 * don't make sense for the current dataset.
 *
 * @param totalRecords - The total number of records available
 * @returns Array of available page size options
 *
 * @example
 * ```ts
 * getAvailablePageSizes(5)   // returns [10]
 * getAvailablePageSizes(15)  // returns [10, 20]
 * getAvailablePageSizes(35)  // returns [10, 20, 50]
 * getAvailablePageSizes(150) // returns [10, 20, 50, 100]
 * ```
 */
export function getAvailablePageSizes(totalRecords: number): number[] {
  if (totalRecords <= 10) return [10]
  if (totalRecords <= 20) return [10, 20]
  if (totalRecords <= 50) return [10, 20, 50]
  return [10, 20, 50, 100]
}
