"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/lib/hooks/use-debounce"

interface InlineEditableTitleProps {
  value: string
  onSave: (value: string) => Promise<void>
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  className?: string
}

/**
 * InlineEditableTitle - Auto-resizable textarea for inline editing
 *
 * Features:
 * - Transparent background, shows border on focus
 * - Auto-resizes based on content (min 1 line)
 * - Debounced auto-save on blur (800ms)
 * - Visual feedback during save (opacity change)
 */
export function InlineEditableTitle({
  value,
  onSave,
  placeholder = "Título de la tarea...",
  disabled = false,
  maxLength = 200,
  className,
}: InlineEditableTitleProps) {
  const [localValue, setLocalValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [hasPendingChange, setHasPendingChange] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Debounced value for auto-save
  const debouncedValue = useDebounce(localValue, 800)

  // Sync local value when prop changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Auto-save on debounced value change
  useEffect(() => {
    // Only save if value has actually changed
    if (debouncedValue !== value && debouncedValue.trim() !== value) {
      handleSave(debouncedValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue])

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = "auto"
    const newHeight = Math.min(textarea.scrollHeight, 200) // Max height for title
    textarea.style.height = `${newHeight}px`
  }, [localValue])

  const handleSave = useCallback(async (saveValue: string) => {
    if (saveValue.trim() === value || disabled || isSaving) return

    setIsSaving(true)
    setHasPendingChange(false)

    try {
      await onSave(saveValue.trim())
    } catch (error) {
      console.error("Error saving title:", error)
      // Revert to original value on error
      setLocalValue(value)
    } finally {
      setIsSaving(false)
    }
  }, [value, disabled, isSaving, onSave])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      setLocalValue(newValue)
      setHasPendingChange(newValue !== value)
    }
  }

  const handleBlur = () => {
    // Save immediately on blur if there's a pending change
    if (hasPendingChange && localValue !== value && localValue.trim() !== value) {
      handleSave(localValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Enter to create new lines (shift+Enter for single line if needed)
    // Escape reverts to original value
    if (e.key === "Escape") {
      setLocalValue(value)
      setHasPendingChange(false)
      textareaRef.current?.blur()
    }
  }

  return (
    <div className={cn("relative", className)}>
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isSaving}
        maxLength={maxLength}
        className={cn(
          // Base styles
          "w-full resize-none overflow-hidden",
          // Typography - match existing title styles
          "text-xl font-bold tracking-tight",
          // Colors
          "bg-transparent text-foreground placeholder:text-muted-foreground",
          // Border - transparent by default, visible on focus
          "border-2 border-transparent rounded-md",
          "focus:ring-1 focus:ring-ring focus:border-ring",
          // Transitions
          "transition-all duration-200",
          // Hover effect for discoverability
          "hover:bg-muted/30 hover:border-border/50",
          // States
          disabled && "opacity-50 cursor-not-allowed",
          isSaving && "opacity-60",
          // Min height (single line)
          "min-h-[2rem] py-1 px-2",
          // Remove default outline
          "focus:outline-none"
        )}
        style={{ height: "auto" }}
      />
      {isSaving && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
