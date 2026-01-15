"use client"

import { usePathname } from "next/navigation"
import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { SidebarPopover } from "@/components/sidebar-popover"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          // Check if current path matches this item or any of its sub-items
          const isItemActive = pathname === item.url || item.items?.some(sub => pathname === sub.url)
          const hasSubItems = item.items && item.items.length > 0

          return hasSubItems ? (
            <SidebarMenuItem key={item.title}>
              {isCollapsed && item.icon ? (
                // COLLAPSED: Show popover
                <SidebarPopover
                  title={item.title}
                  url={item.url}
                  icon={item.icon}
                  items={item.items || []}
                />
              ) : (
                // EXPANDED: Show collapsible
                <Collapsible
                  defaultOpen={isItemActive}
                  className="group/collapsible"
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => {
                        const isActive = pathname === subItem.url
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={isActive}>
                              <Link
                                href={subItem.url}
                                className={
                                  isActive
                                    ? "bg-primary/10 border-l-3 border-l-primary relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-primary"
                                    : ""
                                }
                              >
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </SidebarMenuItem>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.url}>
                <Link
                  href={item.url}
                  className={
                    pathname === item.url
                      ? "bg-primary/10 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-primary"
                      : ""
                  }
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
