"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface FilterOption {
  label: string
  value: string
}

interface FilterControlsProps {
  filters: {
    name: string
    label: string
    options: FilterOption[]
    defaultValue?: string
  }[]
}

export function FilterControls({ filters }: FilterControlsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleFilterChange = (filterName: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value === "all" || !value) {
      params.delete(filterName)
    } else {
      params.set(filterName, value)
    }
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Select
          key={filter.name}
          value={searchParams.get(filter.name) || filter.defaultValue || "all"}
          onValueChange={(value) => handleFilterChange(filter.name, value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  )
}
