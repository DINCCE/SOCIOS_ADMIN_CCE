'use client'

import * as React from 'react'
import {
  Building2,
  GalleryVerticalEnd,
  LayoutDashboard,
  Settings2,
  Users,
} from 'lucide-react'

import { NavMain } from '@/components/nav-main'
import { NavProjects } from '@/components/nav-projects'
import { NavUser } from '@/components/nav-user'
import { TeamSwitcher } from '@/components/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'

// Navigation configuration for SOCIOS_ADMIN
const data = {
  teams: [
    {
      name: 'SOCIOS ADMIN',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
  ],
  navMain: [
    {
      title: 'Dashboard',
      url: '/admin',
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: 'Business Partners',
      url: '/admin/socios',
      icon: Users,
      items: [
        {
          title: 'All Partners',
          url: '/admin/socios',
        },
        {
          title: 'Personas',
          url: '/admin/socios/personas',
        },
        {
          title: 'Empresas',
          url: '/admin/socios/empresas',
        },
      ],
    },
    {
      title: 'Organizations',
      url: '/admin/organizations',
      icon: Building2,
    },
    {
      title: 'Settings',
      url: '/admin/settings',
      icon: Settings2,
      items: [
        {
          title: 'Profile',
          url: '/admin/settings/profile',
        },
        {
          title: 'Account',
          url: '/admin/settings/account',
        },
      ],
    },
  ],
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
    <Sidebar variant="inset" collapsible="icon" {...props}>
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
