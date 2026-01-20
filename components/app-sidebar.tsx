'use client'

import * as React from 'react'
import { GalleryVerticalEnd } from 'lucide-react'

import { NavMain } from '@/components/nav-main'
import { NavProjects } from '@/components/nav-projects'
import { NavUser } from '@/components/nav-user'
import { TeamSwitcher } from '@/components/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NAVIGATION_CONFIG } from '@/lib/navigation'

// Navigation configuration for SOCIOS_ADMIN
const data = {
  teams: [
    {
      name: 'SOCIOS ADMIN',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
  ],
  navMain: NAVIGATION_CONFIG,
  projects: [],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const defaultUser = {
    name: user?.name || 'User',
    email: user?.email || 'user@example.com',
    avatar: user?.avatar || '',
  }

  return (
    <Sidebar variant="inset" collapsible="none" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {data.projects.length > 0 && <NavProjects projects={data.projects} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={defaultUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
