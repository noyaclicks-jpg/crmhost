import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get user's organization
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single()

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome!</h1>
          <p className="text-muted-foreground">Setting up your profile...</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Your profile is being created. Please refresh the page in a moment.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get statistics
  const { count: domainsCount } = await supabase
    .from("domains")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id)

  const { count: emailAliasesCount } = await supabase
    .from("email_aliases")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id)

  const { count: teamMembersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your hosting and email infrastructure</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Domains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{domainsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Managed on Netlify</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Email Aliases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailAliasesCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active forwarding rules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembersCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">In your organization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/domains" className="block text-sm text-primary hover:underline">
              Manage Domains
            </Link>
            <Link href="/dashboard/emails" className="block text-sm text-primary hover:underline">
              Email Aliases
            </Link>
            <Link href="/dashboard/team" className="block text-sm text-primary hover:underline">
              Team Settings
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
