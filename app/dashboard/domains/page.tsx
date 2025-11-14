import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { DomainsTable } from "@/components/dashboard/domains-table"
import { AddDomainDialog } from "@/components/dashboard/add-domain-dialog"
import { SectionHeader } from "@/components/dashboard/section-header"
import { GlobalSearch } from "@/components/dashboard/global-search"
import { FilterControls } from "@/components/dashboard/filter-controls"
import { syncDomainsFromForwardEmail } from "@/lib/actions/domains"
import { Button } from "@/components/ui/button"

export default async function DomainsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; sort?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get user's organization and role
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user.id).single()

  if (!profile) {
    return null
  }

  // Get all domains for the organization
  const { data: domains } = await supabase
    .from("domains")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })

  const canManage = ["owner", "admin"].includes(profile.role)

  let filteredDomains = domains || []
  
  if (searchParams.search) {
    const searchLower = searchParams.search.toLowerCase()
    filteredDomains = filteredDomains.filter(
      (d) =>
        d.domain_name.toLowerCase().includes(searchLower) ||
        d.netlify_site_name?.toLowerCase().includes(searchLower)
    )
  }
  
  if (searchParams.status && searchParams.status !== "all") {
    filteredDomains = filteredDomains.filter((d) => d.status === searchParams.status)
  }
  
  if (searchParams.sort) {
    switch (searchParams.sort) {
      case "newest":
        filteredDomains.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "oldest":
        filteredDomains.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case "a-z":
        filteredDomains.sort((a, b) => a.domain_name.localeCompare(b.domain_name))
        break
      case "z-a":
        filteredDomains.sort((a, b) => b.domain_name.localeCompare(a.domain_name))
        break
    }
  }

  const SyncButton = canManage ? (
    <form action={syncDomainsFromForwardEmail}>
      <Button variant="outline" size="sm" type="submit">
        Sync Status
      </Button>
    </form>
  ) : undefined

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Domains"
        description="Manage DNS records with Netlify for email forwarding"
        action={
          <div className="flex gap-2">
            {SyncButton}
            {canManage && <AddDomainDialog />}
          </div>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <GlobalSearch placeholder="Search domains..." />
        <FilterControls
          filters={[
            {
              name: "status",
              label: "Status",
              options: [
                { label: "All Status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Pending", value: "pending" },
                { label: "Error", value: "error" },
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
                { label: "Z → A", value: "z-a" },
              ],
            },
          ]}
        />
      </div>

      {filteredDomains && filteredDomains.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <DomainsTable domains={filteredDomains} canManage={canManage} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">
              {searchParams.search || searchParams.status
                ? "No domains found matching your filters"
                : "No domains yet. Add your first domain to get started."}
            </p>
            {canManage && !searchParams.search && !searchParams.status && <AddDomainDialog />}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
