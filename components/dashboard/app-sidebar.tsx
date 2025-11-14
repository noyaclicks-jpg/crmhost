"use client"

import Link from "next/link"
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"

interface AppSidebarProps {
  user: { email: string }
  profile: {
    role: string
    organizations: {
      name: string
    }
  }
}

const navigation = [
  { name: "Overview", href: "/dashboard" },
  { name: "Domains", href: "/dashboard/domains" },
  { name: "Inbox", href: "/dashboard/inbox" },
  { name: "Email Aliases", href: "/dashboard/emails" },
  { name: "Audit Logs", href: "/dashboard/logs" },
]

const adminNavigation = [
  { name: "Team", href: "/dashboard/team" },
  { name: "Settings", href: "/dashboard/settings" },
]

export function AppSidebar({ user, profile }: AppSidebarProps) {
  const pathname = usePathname()

  const isAdmin = ["owner", "admin"].includes(profile.role)

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Hosting CRM</h2>
          <p className="text-sm text-muted-foreground">{profile.organizations.name}</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
