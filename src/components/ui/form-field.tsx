import * as React from "react"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label: string
  required?: boolean
  optional?: boolean
  error?: string
  children: React.ReactNode
  className?: string
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, required, optional, error, children, className }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
          {optional && <span className="text-muted-foreground ml-1">(可选)</span>}
        </label>
        {children}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { FormField }