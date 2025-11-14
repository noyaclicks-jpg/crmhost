import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { EmailAliasesTable } from "@/components/dashboard/email-aliases-table"
import { AddEmailAliasDialog } from "@/components/dashboard/add-email-alias-dialog"
import { SectionHeader } from "@/components/dashboard/section-header"
import { GlobalSearch } from "@/components/dashboard/global-search"
import { FilterControls } from "@/components/dashboard/filter-controls"
import { redirect } from 'next/navigation'

export default async function EmailsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; domain?: string; sort?: string }
}) {
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

  // Get all email aliases with domain information
  const { data: emailAliases } = await supabase
    .from("email_aliases")
    .select(`
      *,
      domains (
        id,
        domain_name,
        status
      )
    `)
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })

  // Get all domains for dropdown
  const { data: domains } = await supabase
    .from("domains")
    .select("id, domain_name, status")
    .eq("organization_id", profile.organization_id)
    .order("domain_name")

  const canManage = ["owner", "admin"].includes(profile.role)

  let filteredAliases = emailAliases || []
  
  if (searchParams.search) {
    const searchLower = searchParams.search.toLowerCase()
    filteredAliases = filteredAliases.filter(
      (a) =>
        a.alias_name.toLowerCase().includes(searchLower) ||
        a.domains.domain_name.toLowerCase().includes(searchLower) ||
        a.forward_to.some((email) => email.toLowerCase().includes(searchLower))
    )
  }
  
  if (searchParams.status && searchParams.status !== "all") {
    filteredAliases = filteredAliases.filter((a) =>
      searchParams.status === "active" ? a.is_enabled : !a.is_enabled
    )
  }
  
  if (searchParams.domain && searchParams.domain !== "all") {
    filteredAliases = filteredAliases.filter((a) => a.domains.domain_name === searchParams.domain)
  }
  
  if (searchParams.sort) {
    switch (searchParams.sort) {
      case "newest":
        filteredAliases.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "oldest":
        filteredAliases.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case "a-z":
        filteredAliases.sort((a, b) => a.alias_name.localeCompare(b.alias_name))
        break
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Email Aliases"
        description="Configure email forwarding rules for your domains"
        action={canManage && domains && domains.length > 0 ? <AddEmailAliasDialog domains={domains} /> : undefined}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <GlobalSearch placeholder="Search aliases, domains, or recipients..." />
        <FilterControls
          filters={[
            {
              name: "status",
              label: "Status",
              options: [
                { label: "All Status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Disabled", value: "disabled" },
              ],
            },
            {
              name: "domain",
              label: "Domain",
              options: [
                { label: "All Domains", value: "all" },
                ...(domains || []).map((d) => ({ label: d.domain_name, value: d.domain_name })),
              ],
            },
            {
              name: "sort",
              label: "Sort",
              defaultValue: "newest",
              options: [
                { label: "Newest First", value: "newest" },
                { label: "Oldest First", value: "oldest" },
                { label: "A → Z", value: "a-z" },
              ],
            },
          ]}
        />
      </div>

      {filteredAliases && filteredAliases.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmailAliasesTable aliases={filteredAliases} canManage={canManage} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            {domains && domains.length > 0 ? (
              <>
                <p className="text-muted-foreground mb-4">
                  {searchParams.search || searchParams.status || searchParams.domain
                    ? "No email aliases found matching your filters"
                    : "No email aliases yet. Create your first alias to start forwarding emails."}
                </p>
                {canManage && !searchParams.search && !searchParams.status && !searchParams.domain && (
                  <AddEmailAliasDialog domains={domains} />
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Add a domain first before creating email aliases.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
