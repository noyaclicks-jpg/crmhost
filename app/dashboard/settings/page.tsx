import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { APICredentialsForm } from "@/components/dashboard/api-credentials-form"
import { OrganizationNameForm } from "@/components/dashboard/organization-name-form"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role, organizations(name)")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/auth/login")
  }

  if (!["owner", "admin"].includes(profile.role)) {
    redirect("/dashboard")
  }

  const { data: credentials } = await supabase
    .from("api_credentials")
    .select("service")
    .eq("organization_id", profile.organization_id)

  const hasNetlify = credentials?.some((c) => c.service === "netlify") || false
  const hasForwardEmail = credentials?.some((c) => c.service === "forwardemail") || false

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your organization and API integrations</p>
      </div>

      <Tabs defaultValue="api" className="space-y-4">
        <TabsList>
          <TabsTrigger value="api">API Credentials</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Netlify API Token</CardTitle>
              <CardDescription>
                Required to manage DNS records on Netlify for email forwarding. Get your token from{" "}
                <a
                  href="https://app.netlify.com/user/applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Netlify Settings
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <APICredentialsForm service="netlify" hasCredentials={hasNetlify} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ForwardEmail API Key</CardTitle>
              <CardDescription>
                Required to manage email aliases and forwarding rules. Get your key from{" "}
                <a
                  href="https://forwardemail.net/en/my-account/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  ForwardEmail Settings
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <APICredentialsForm service="forwardemail" hasCredentials={hasForwardEmail} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Manage your organization information</CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationNameForm currentName={profile.organizations?.name || ""} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
