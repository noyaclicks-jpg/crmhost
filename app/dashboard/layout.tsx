import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SidebarProvider } from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile with organization
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      *,
      organizations (
        id,
        name
      )
    `)
    .eq("id", user.id)
    .single()

  if (!profile || profileError) {
    redirect("/auth/login")
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full">
        <AppSidebar user={user} profile={profile} />
        <div className="flex flex-1 flex-col">
          <DashboardHeader user={user} profile={profile} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
