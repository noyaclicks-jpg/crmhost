import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TeamMembersTable } from "@/components/dashboard/team-members-table"
import { InviteUserDialog } from "@/components/dashboard/invite-user-dialog"
import { CreateUserDialog } from "@/components/dashboard/create-user-dialog"
import { PendingInvitesTable } from "@/components/dashboard/pending-invites-table"
import { getInvites } from "@/lib/actions/invites"

export default async function TeamPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's organization and role
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Only owners and admins can access this page
  if (!["owner", "admin"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Get all team members
  const { data: teamMembers } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })

  // Get pending invites
  const { invites } = await getInvites()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">Manage who has access to your organization</p>
        </div>
        <div className="flex gap-2">
          <CreateUserDialog />
          <InviteUserDialog />
        </div>
      </div>

      {invites && invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
            <CardDescription>Users who have been invited but haven't accepted yet</CardDescription>
          </CardHeader>
          <CardContent>
            <PendingInvitesTable invites={invites} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Team</CardTitle>
          <CardDescription>All members with access to this organization</CardDescription>
        </CardHeader>
        <CardContent>
          <TeamMembersTable members={teamMembers || []} currentUserId={user.id} currentUserRole={profile.role} />
        </CardContent>
      </Card>
    </div>
  )
}
