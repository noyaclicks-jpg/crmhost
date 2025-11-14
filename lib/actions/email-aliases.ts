"use server"

import { createClient } from "@/lib/supabase/server"
import { ForwardEmailClient } from "@/lib/api/forwardemail-client"
import { getAPICredentials } from "./api-credentials"
import { revalidatePath } from "next/cache"

export async function createEmailAlias(domainId: string, aliasName: string, forwardTo: string[], description?: string) {
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

  // Get domain
  const { data: domain } = await supabase.from("domains").select("*").eq("id", domainId).single()

  if (!domain) {
    return { error: "Domain not found" }
  }

  try {
    // Get ForwardEmail credentials
    const forwardEmailCredsResult = await getAPICredentials("forwardemail")
    if (forwardEmailCredsResult.error || !forwardEmailCredsResult.data) {
      return { error: "ForwardEmail API credentials not configured" }
    }

    // Create alias in ForwardEmail
    const forwardEmailClient = new ForwardEmailClient(forwardEmailCredsResult.data.api_token)
    await forwardEmailClient.createAlias(domain.domain_name, {
      name: aliasName,
      recipients: forwardTo,
      description,
      is_enabled: true,
    })

    // Save to database
    const { data, error } = await supabase
      .from("email_aliases")
      .insert({
        organization_id: profile.organization_id,
        domain_id: domainId,
        alias_name: aliasName,
        forward_to: forwardTo,
        description,
        is_enabled: true,
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Log action
    await supabase.from("audit_logs").insert({
      organization_id: profile.organization_id,
      user_id: user.id,
      action: "email_alias_created",
      resource_type: "email_alias",
      resource_id: data.id,
      details: { alias_name: aliasName, domain_id: domainId },
    })

    revalidatePath("/dashboard/emails")
    return { data }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create email alias",
    }
  }
}

export async function updateEmailAlias(
  aliasId: string,
  updates: {
    alias_name?: string
    forward_to?: string[]
    description?: string
    is_enabled?: boolean
  },
) {
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

  // Get alias and domain
  const { data: alias } = await supabase.from("email_aliases").select("*, domains(*)").eq("id", aliasId).single()

  if (!alias) {
    return { error: "Email alias not found" }
  }

  try {
    // Update in database
    const { data, error } = await supabase
      .from("email_aliases")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", aliasId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Log action
    await supabase.from("audit_logs").insert({
      organization_id: profile.organization_id,
      user_id: user.id,
      action: "email_alias_updated",
      resource_type: "email_alias",
      resource_id: aliasId,
      details: updates,
    })

    revalidatePath("/dashboard/emails")
    return { data }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update email alias",
    }
  }
}

export async function deleteEmailAlias(aliasId: string) {
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

  // Get alias
  const { data: alias } = await supabase.from("email_aliases").select("*").eq("id", aliasId).single()

  if (!alias) {
    return { error: "Email alias not found" }
  }

  try {
    // Delete from database
    const { error } = await supabase.from("email_aliases").delete().eq("id", aliasId)

    if (error) {
      return { error: error.message }
    }

    // Log action
    await supabase.from("audit_logs").insert({
      organization_id: profile.organization_id,
      user_id: user.id,
      action: "email_alias_deleted",
      resource_type: "email_alias",
      resource_id: aliasId,
      details: { alias_name: alias.alias_name },
    })

    revalidatePath("/dashboard/emails")
    return { success: true }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete email alias",
    }
  }
}
