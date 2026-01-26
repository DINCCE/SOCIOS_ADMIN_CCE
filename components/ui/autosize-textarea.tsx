import * as React from "react"
import { cn } from "@/lib/utils"

export interface AutosizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number
  maxRows?: number
}

const AutosizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutosizeTextareaProps
>(({ className, minRows = 1, maxRows = 10, value, onChange, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [height, setHeight] = React.useState<string>("auto")

  // Merge refs
  React.useImperativeHandle(ref, () => textareaRef.current!)

  // Calculate height based on content
  const calculateHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto to get correct scrollHeight
    textarea.style.height = "auto"

    // Calculate line height
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight)
    const paddingTop = parseInt(getComputedStyle(textarea).paddingTop)
    const paddingBottom = parseInt(getComputedStyle(textarea).paddingBottom)
    const borderHeight = parseInt(getComputedStyle(textarea).borderTopWidth) +
                        parseInt(getComputedStyle(textarea).borderBottomWidth)

    // Calculate min and max height
    const minHeight = (lineHeight * minRows) + paddingTop + paddingBottom + borderHeight
    const maxHeight = (lineHeight * maxRows) + paddingTop + paddingBottom + borderHeight

    // Get the scroll height of the content
    const scrollHeight = textarea.scrollHeight

    // Set height within min/max bounds
    if (scrollHeight <= minHeight) {
      setHeight(`${minHeight}px`)
    } else if (scrollHeight >= maxHeight) {
      setHeight(`${maxHeight}px`)
      textarea.style.overflowY = "auto"
    } else {
      setHeight(`${scrollHeight}px`)
      textarea.style.overflowY = "hidden"
    }
  }, [minRows, maxRows])

  // Recalculate on value change
  React.useEffect(() => {
    calculateHeight()
  }, [value, calculateHeight])

  // Recalculate on mount and when min/max rows change
  React.useEffect(() => {
    calculateHeight()
  }, [minRows, maxRows, calculateHeight])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e)
    calculateHeight()
  }

  return (
    <textarea
      ref={textareaRef}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{ height }}
      onChange={handleChange}
      value={value}
      {...props}
    />
  )
})

AutosizeTextarea.displayName = "AutosizeTextarea"

export { AutosizeTextarea }
