import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"

interface SelectOption {
  value: string
  label: string
}

interface SelectWithOptionsProps {
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const SelectWithOptions = React.forwardRef<
  React.ElementRef<typeof SelectTrigger>,
  SelectWithOptionsProps
>(({ options, value, onChange, placeholder, disabled, className }, ref) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger ref={ref} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
})
SelectWithOptions.displayName = "SelectWithOptions"

export { SelectWithOptions, type SelectOption }