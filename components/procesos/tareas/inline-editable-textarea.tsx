"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/lib/hooks/use-debounce"

interface InlineEditableTextareaProps {
  value: string
  onSave: (value: string) => Promise<void>
  placeholder?: string
  disabled?: boolean
  minRows?: number
  maxRows?: number
  maxLength?: number
  className?: string
}

/**
 * InlineEditableTextarea - Auto-resizable textarea for description field
 *
 * Features:
 * - Transparent background, shows border on focus
 * - Auto-resizes based on content (configurable min/max rows)
 * - Debounced auto-save on blur (800ms)
 * - Visual feedback during save (opacity change)
 */
export function InlineEditableTextarea({
  value = "",
  onSave,
  placeholder = "Detalles adicionales de la tarea...",
  disabled = false,
  minRows = 3,
  maxRows = 10,
  maxLength = 2000,
  className,
}: InlineEditableTextareaProps) {
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
    const trimmedValue = debouncedValue.trim()
    const originalValue = value.trim()

    // Only save if value has actually changed
    if (trimmedValue !== originalValue && trimmedValue !== originalValue) {
      handleSave(debouncedValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue])

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto to get correct scrollHeight
    textarea.style.height = "auto"

    // Calculate line height
    const lineHeight = 24 // Approximate line height in px
    const minHeight = lineHeight * minRows
    const maxHeight = lineHeight * maxRows

    // Get the scroll height of the content
    const scrollHeight = textarea.scrollHeight

    // Set height within min/max bounds
    if (scrollHeight <= minHeight) {
      textarea.style.height = `${minHeight}px`
    } else if (scrollHeight >= maxHeight) {
      textarea.style.height = `${maxHeight}px`
      textarea.style.overflowY = "auto"
    } else {
      textarea.style.height = `${scrollHeight}px`
      textarea.style.overflowY = "hidden"
    }
  }, [localValue, minRows, maxRows])

  const handleSave = useCallback(async (saveValue: string) => {
    const trimmedValue = saveValue.trim()
    const originalValue = value.trim()

    if (trimmedValue === originalValue || disabled || isSaving) return

    setIsSaving(true)
    setHasPendingChange(false)

    try {
      await onSave(trimmedValue)
    } catch (error) {
      console.error("Error saving description:", error)
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
      setHasPendingChange(newValue.trim() !== value.trim())
    }
  }

  const handleBlur = () => {
    // Save immediately on blur if there's a pending change
    if (hasPendingChange && localValue.trim() !== value.trim()) {
      handleSave(localValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Escape reverts to original value
    if (e.key === "Escape") {
      setLocalValue(value)
      setHasPendingChange(false)
      textareaRef.current?.blur()
    }
    // Ctrl/Cmd + Enter saves immediately
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      handleSave(localValue)
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
          "w-full resize-none",
          // Typography
          "text-sm text-foreground",
          // Colors
          "bg-transparent placeholder:text-muted-foreground",
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
          // Padding
          "py-2 px-3",
          // Remove default outline
          "focus:outline-none"
        )}
        style={{ height: "auto", minHeight: `${minRows * 24}px` }}
      />
      {isSaving && (
        <div className="absolute right-3 top-3 pointer-events-none">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
