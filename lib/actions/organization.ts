"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateOrganizationName(name: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user.id).single()

  if (!profile || !["owner", "admin"].includes(profile.role)) {
    return { error: "Insufficient permissions" }
  }

  if (!name || name.trim().length === 0) {
    return { error: "Organization name cannot be empty" }
  }

  const { error } = await supabase
    .from("organizations")
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
    .eq("id", profile.organization_id)

  if (error) {
    return { error: error.message }
  }

  await supabase.from("audit_logs").insert({
    organization_id: profile.organization_id,
    user_id: user.id,
    action: "organization_updated",
    resource_type: "organization",
    resource_id: profile.organization_id,
    details: { name },
  })

  revalidatePath("/dashboard/settings")
  revalidatePath("/dashboard")
  return { success: true }
}
