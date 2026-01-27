/**
 * Date helper utilities for date filtering in data tables
 * Handles date ranges, presets, and comparisons with proper timezone handling
 */

/**
 * Date filter preset types
 */
export type DateFilterPreset = 'overdue' | 'today' | 'upcoming' | 'all' | 'custom'

/**
 * Date range type for filtering
 */
export interface DateRange {
  from?: Date
  to?: Date
}

/**
 * Parse a date string (yyyy-MM-dd) correctly, avoiding timezone issues
 * Database stores dates as DATE type without timezone, so we parse as local date
 */
function parseLocalDate(dateStr: string): Date | null {
  if (!dateStr) return null

  // Parse the date string manually to avoid timezone conversion
  // Expected format: yyyy-MM-dd
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null

  const [, year, month, day] = match
  // Create date using local time (month is 0-indexed in JS)
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

/**
 * Gets the date range for a given preset
 * @param preset - The preset to get the range for
 * @returns The date range for the preset
 */
export function getDateRangeForPreset(preset: DateFilterPreset): DateRange {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  switch (preset) {
    case 'overdue':
      // Dates before today (excluding today)
      return {
        from: undefined,
        to: new Date(today.getTime() - 86400000), // yesterday
      }
    case 'today':
      // Only today
      return {
        from: today,
        to: today,
      }
    case 'upcoming':
      // Tomorrow through next 7 days
      const tomorrow = new Date(today.getTime() + 86400000)
      const upcoming = new Date(today)
      upcoming.setDate(today.getDate() + 7)
      return {
        from: tomorrow,
        to: upcoming,
      }
    case 'all':
    default:
      // No filtering
      return {
        from: undefined,
        to: undefined,
      }
  }
}

/**
 * Checks if a date string is within a given range
 * @param dateStr - The date string to check (ISO format yyyy-MM-dd)
 * @param range - The range to check against
 * @returns True if the date is within the range
 */
export function isDateInRange(dateStr: string, range: DateRange): boolean {
  if (!dateStr) return false

  const targetDate = parseLocalDate(dateStr)
  if (!targetDate) return false

  targetDate.setHours(0, 0, 0, 0)

  // No range means include all dates
  if (!range.from && !range.to) {
    return true
  }

  // Both from and to specified
  if (range.from && range.to) {
    const from = new Date(range.from)
    from.setHours(0, 0, 0, 0)
    const to = new Date(range.to)
    to.setHours(0, 0, 0, 0)
    return targetDate >= from && targetDate <= to
  }

  // Only from specified
  if (range.from) {
    const from = new Date(range.from)
    from.setHours(0, 0, 0, 0)
    return targetDate >= from
  }

  // Only to specified
  if (range.to) {
    const to = new Date(range.to)
    to.setHours(0, 0, 0, 0)
    return targetDate <= to
  }

  return true
}

/**
 * Gets the label for a preset
 * @param preset - The preset to get the label for
 * @returns The label for the preset
 */
export function getPresetLabel(preset: DateFilterPreset): string {
  switch (preset) {
    case 'overdue':
      return 'Vencidas'
    case 'today':
      return 'Para hoy'
    case 'upcoming':
      return 'Próximas 7 días'
    case 'all':
      return 'Todas'
    case 'custom':
      return 'Personalizado'
    default:
      return 'Todas'
  }
}

/**
 * Parses a filter value that can be either a preset string or a date range object
 * @param value - The filter value to parse
 * @returns The parsed date range
 */
export function parseDateFilterValue(
  value: string | { from?: string; to?: string } | undefined
): DateRange {
  if (!value) {
    return { from: undefined, to: undefined }
  }

  // Handle preset strings
  if (typeof value === 'string') {
    return getDateRangeForPreset(value as DateFilterPreset)
  }

  // Handle custom range object - use parseLocalDate for proper timezone handling
  if (typeof value === 'object') {
    return {
      from: value.from ? parseLocalDate(value.from) ?? undefined : undefined,
      to: value.to ? parseLocalDate(value.to) ?? undefined : undefined,
    }
  }

  return { from: undefined, to: undefined }
}
