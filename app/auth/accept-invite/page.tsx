import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AcceptInviteForm } from "@/components/auth/accept-invite-form"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  console.log("[v0] Accept invite page: Token received:", searchParams.token)

  const token = searchParams.token

  if (!token) {
    console.log("[v0] Accept invite page: No token, redirecting to login")
    redirect("/auth/login")
  }

  const supabase = await createClient()

  console.log("[v0] Accept invite page: Created Supabase client")

  // Check if user is already logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] Accept invite page: User check:", user ? user.id : "Not logged in")

  // Get invite details - use service role client or public access via RLS
  console.log("[v0] Accept invite page: Fetching invite with token:", token)

  const { data: invite, error } = await supabase
    .from("invites")
    .select("*, organization:organizations(name)")
    .eq("token", token)
    .is("accepted_at", null)
    .maybeSingle()

  console.log("[v0] Accept invite page: Invite query result:", {
    hasInvite: !!invite,
    error: error?.message,
    errorCode: error?.code,
  })

  if (error) {
    console.error("[v0] Accept invite page: Database error:", error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Invite</CardTitle>
            <CardDescription>There was a problem loading your invite.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
            <a href="/auth/login" className="text-sm text-primary hover:underline">
              Go to login
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invite) {
    console.log("[v0] Accept invite page: Invite not found or already used")
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>This invite link is invalid or has already been used.</CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/auth/login" className="text-sm text-primary hover:underline">
              Go to login
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if invite has expired
  const expiresAt = new Date(invite.expires_at)
  if (expiresAt < new Date()) {
    console.log("[v0] Accept invite page: Invite expired")
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invite Expired</CardTitle>
            <CardDescription>This invite link has expired. Please request a new invite.</CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/auth/login" className="text-sm text-primary hover:underline">
              Go to login
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  console.log("[v0] Accept invite page: Valid invite found, showing form")

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Invite</CardTitle>
          <CardDescription>
            You've been invited to join {invite.organization.name} as a {invite.role}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcceptInviteForm
            token={token}
            email={invite.email}
            organizationName={invite.organization.name}
            role={invite.role}
            isLoggedIn={!!user}
            userEmail={user?.email}
          />
        </CardContent>
      </Card>
    </div>
  )
}
