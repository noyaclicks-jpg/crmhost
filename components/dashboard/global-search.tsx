"use client"

import { Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebounce } from "use-debounce"
import { useEffect, useState } from "react"

interface GlobalSearchProps {
  placeholder?: string
}

export function GlobalSearch({ placeholder = "Search..." }: GlobalSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [debouncedSearch] = useDebounce(searchTerm, 300)

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (debouncedSearch) {
      params.set("search", debouncedSearch)
    } else {
      params.delete("search")
    }
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [debouncedSearch, pathname, router, searchParams])

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
      />
    </div>
  )
}
