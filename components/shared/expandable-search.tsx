"use client"

import { useState, useRef, useEffect } from "react"
import { Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function ExpandableSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
    }
  }

  return (
    <div 
      ref={containerRef} 
      className="relative flex items-center justify-end"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        if (!query) setIsOpen(false)
      }}
    >
      <div 
        className={cn(
          "flex items-center transition-all duration-300 ease-in-out origin-right bg-background rounded-full border border-border/50",
          isOpen ? "w-[280px] md:w-[320px] opacity-100 px-2" : "w-9 h-9 opacity-0 invisible"
        )}
      >
        <form onSubmit={handleSubmit} className="w-full flex items-center relative">
          <Input
            ref={inputRef}
            type="search"
            placeholder="Ürün veya marka ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border-none shadow-none focus-visible:ring-0 h-9 bg-transparent pl-8"
          />
          <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 h-7 w-7 text-muted-foreground"
              onClick={() => {
                setQuery("")
                inputRef.current?.focus()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>

      {!isOpen && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-0 h-9 w-9 rounded-full"
          onClick={() => setIsOpen(true)}
        >
          <Search className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}
