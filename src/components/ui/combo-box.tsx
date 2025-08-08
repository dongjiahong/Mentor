import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboBoxProps {
  value?: string
  onChange?: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ComboBox({
  value = "",
  onChange,
  options,
  placeholder = "请选择或输入...",
  disabled = false,
  className,
}: ComboBoxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  React.useEffect(() => {
    // 找到对应的选项并显示其标签，如果没找到则显示原值
    const selectedOption = options.find(opt => opt.value === value)
    setInputValue(selectedOption ? selectedOption.label : value || "")
  }, [value, options])

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    onChange?.(newValue)
  }

  const handleSelectOption = (optionValue: string) => {
    const selectedOption = options.find(opt => opt.value === optionValue)
    setInputValue(selectedOption ? selectedOption.label : optionValue)
    onChange?.(optionValue)  // 传递值，不是标签
    setOpen(false)
  }

  const filteredOptions = inputValue.trim() === ""
    ? options
    : options.filter(option =>
        option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
        option.value.toLowerCase().includes(inputValue.toLowerCase())
      )

  const selectedOption = options.find(option => option.value === value)

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="flex">
          <Input
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue.trim()) {
                e.preventDefault()
                onChange?.(inputValue.trim())
                setOpen(false)
              } else if (e.key === 'Escape') {
                setOpen(false)
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="rounded-r-none border-r-0 flex-1"
          />
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="rounded-l-none border-l-0 px-3 shrink-0"
              type="button"
            >
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
        </div>
        
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
          <div className="max-h-60 overflow-auto">
{filteredOptions.length === 0 && inputValue.trim() !== "" ? (
              <div className="py-2 px-3 text-sm">
                <div className="text-muted-foreground mb-2">没有找到匹配的选项</div>
                <div 
                  className="text-primary cursor-pointer hover:bg-accent rounded p-1"
                  onClick={() => {
                    onChange?.(inputValue.trim())
                    setOpen(false)
                  }}
                >
                  + 使用自定义目标："{inputValue.trim()}"
                </div>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-2 px-3 text-sm text-muted-foreground">
                请输入学习目标或从下方选项中选择
              </div>
            ) : (
              <>
                {inputValue.trim() !== "" && !options.some(opt => opt.label.toLowerCase() === inputValue.toLowerCase()) && (
                  <div 
                    className="py-2 px-3 text-sm text-primary cursor-pointer hover:bg-accent rounded border-b"
                    onClick={() => {
                      onChange?.(inputValue.trim())
                      setOpen(false)
                    }}
                  >
                    + 使用自定义目标："{inputValue.trim()}"
                  </div>
                )}
                {filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleSelectOption(option.value)}
                    className="flex items-center justify-between py-2 px-3 text-sm cursor-pointer rounded hover:bg-accent hover:text-accent-foreground"
                  >
                    <span>{option.label}</span>
                    {value === option.value && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}