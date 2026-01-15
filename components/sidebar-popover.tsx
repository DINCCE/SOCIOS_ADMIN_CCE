'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { type LucideIcon } from 'lucide-react'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface SidebarPopoverProps {
  title: string
  url: string
  icon: LucideIcon
  items: {
    title: string
    url: string
  }[]
}

export function SidebarPopover({
  title,
  url,
  icon: Icon,
  items,
}: SidebarPopoverProps) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Check if any sub-item is active
  const isActive = pathname === url || items.some((item) => pathname === item.url)

  const handleSubItemClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    itemUrl: string
  ) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(itemUrl)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            isActive && 'bg-accent/50 text-accent-foreground'
          )}
          aria-label={title}
        >
          <Icon className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="right"
        sideOffset={8}
        className="w-56 p-0 overflow-hidden"
      >
        {/* Header with title */}
        <div className="px-3 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <Icon className="h-3.5 w-3.5" />
            <span>{title}</span>
          </div>
        </div>

        {/* Sub-items */}
        <div className="p-1 space-y-0.5">
          {items.map((item) => {
            const isSubItemActive = pathname === item.url
            return (
              <Link
                key={item.url}
                href={item.url}
                onClick={(e) => handleSubItemClick(e, item.url)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm',
                  'transition-all duration-150',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  isSubItemActive &&
                    'bg-accent/80 text-accent-foreground font-medium shadow-sm'
                )}
              >
                <span className="flex-1">{item.title}</span>
                {isSubItemActive && (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </Link>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
