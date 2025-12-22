"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CommandSearchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string
  onChange: (value: string) => void
  shortcutKey?: string
  "aria-label"?: string
}

const CommandSearch = React.forwardRef<HTMLInputElement, CommandSearchProps>(
  (
    {
      className,
      value,
      onChange,
      shortcutKey = "⌘K",
      placeholder = "Buscar...",
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const handleClear = () => {
      onChange("")
    }

    return (
      <div className="relative w-[250px] lg:w-[350px]">
        {/* Search Icon */}
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        {/* Input */}
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          role="combobox"
          aria-expanded="false"
          aria-label={ariaLabel}
          className={cn(
            "h-10 w-full rounded-lg border border-border/50 bg-background/60 pl-10 pr-20 text-sm backdrop-blur-sm transition-all duration-200 ease-out placeholder:text-muted-foreground/60",
            "hover:border-border hover:bg-background/80",
            "focus:border-ring/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 focus:ring-offset-background",
            className
          )}
          {...props}
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-12 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground sm:right-14"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Keyboard Hint */}
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border border-border/50 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:inline-flex">
          <span className="text-xs">{shortcutKey.charAt(0)}</span>
          {shortcutKey.slice(1)}
        </kbd>
      </div>
    )
  }
)

CommandSearch.displayName = "CommandSearch"

export { CommandSearch }
