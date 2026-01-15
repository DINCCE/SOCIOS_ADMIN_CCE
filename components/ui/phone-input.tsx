"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import { default as PhoneInputBase } from "react-phone-number-input"
import "react-phone-number-input/style.css"

import { cn } from "@/lib/utils"

// Extend the base component props
interface PhoneInputProps
  extends Omit<
    React.ComponentProps<"input">,
    "value" | "onChange" | "ref"
  > {
  name: string
  label?: string
  defaultCountry?: string
  international?: boolean
  countryCallingCodeEditable?: boolean
}

/**
 * International Phone Input Component (Standalone)
 *
 * Matches shadcn/ui Input styling exactly with:
 * - Country selector (flag + code) on the left
 * - Numeric input on the right
 * - Default country: Colombia (CO)
 * - Full React Hook Form integration
 *
 * Note: This component works standalone without requiring FormField wrapper.
 * It uses useFormContext() directly to access form errors and values.
 */
export function PhoneInput({
  name,
  label,
  defaultCountry = "CO",
  international = true,
  countryCallingCodeEditable = false,
  className,
  ...props
}: PhoneInputProps) {
  const form = useFormContext()

  // Get field state to check if field was touched
  const fieldState = form.getFieldState(name)

  // Get error message only if field is invalid AND (touched OR form was submitted)
  const showError = fieldState.invalid && (fieldState.isTouched || form.formState.isSubmitted)
  const error = showError ? (form.formState.errors[name]?.message as string | undefined) : undefined

  const value = form.watch(name) as string | undefined

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
          {label}
        </label>
      )}
      <div className={cn(
        "flex items-center border border-input rounded-md bg-background ring-offset-background transition-shadow pl-3",
        "[&_.PhoneInputCountryIcon]:!border-none [&_.PhoneInputCountryIcon]:!shadow-none [&_.PhoneInputCountryIconImg]:!border-none [&_.PhoneInputCountryIconImg]:!shadow-none",
        "focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2",
        className,
        error && "border-destructive focus-within:ring-destructive"
      )}>
        <PhoneInputBase
          international={international}
          withCountryCallingCode={international}
          defaultCountry={defaultCountry as any}
          countryCallingCodeEditable={countryCallingCodeEditable}
          value={value}
          onChange={(value) => {
            // Empty string converts to null for database
            form.setValue(name, (value as string | undefined) || null, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }}
          numberInputProps={{
            className: cn(
              // Remove all borders and background from input
              "border-none bg-transparent shadow-none",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "flex-1 min-w-0",
              "text-sm h-11 px-3 py-2 text-foreground",
              // Pass through additional props
              className
            ),
            style: {
              boxShadow: 'none',
            },
            ...props,
          }}
          countrySelectProps={{
            className: cn(
              // Add left padding and ensure proper alignment
              "pl-3 h-11 items-center",
              // Don't override internal structure - let the library render flag
              "focus:outline-none"
            ),
            style: {
              // Remove default library styles but keep structure intact
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
            },
            // Add custom attributes for positioning
            "aria-label": "Country code",
          }}
        />
      </div>
      {error && (
        <p className="text-[10px] font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Standalone PhoneInput (without FormField wrapper)
 * For use outside React Hook Form
 */
export function PhoneInputControlled({
  value,
  onChange,
  defaultCountry = "CO" as any,
  international = true,
  countryCallingCodeEditable = false,
  error,
  className,
  ...props
}: Omit<PhoneInputProps, "name" | "label" | "description"> & {
  value: string | undefined
  onChange: (value: string | undefined) => void
  error?: string
}) {
  return (
    <div className="relative">
      <PhoneInputBase
        international={international}
        withCountryCallingCode={international}
        defaultCountry={defaultCountry as "CO" | "US" | "ES" | undefined}
        countryCallingCodeEditable={countryCallingCodeEditable}
        value={value}
        onChange={onChange}
        numberInputProps={{
          className: cn(
            // Match shadcn Input styling exactly
            "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2",
            "text-sm ring-offset-background",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Error state styling
            error && "border-destructive focus-visible:ring-destructive",
            className
          ),
          ...props,
        }}
        countrySelectProps={{
          className: cn(
            "flex h-11 items-center gap-1 rounded-md border border-input bg-background px-3",
            "text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2",
            error && "border-destructive"
          ),
        }}
      />
      {error && (
        <p className="mt-1 text-[10px] font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
