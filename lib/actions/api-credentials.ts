"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { NetlifyClient } from "@/lib/api/netlify-client"
import { ForwardEmailClient } from "@/lib/api/forwardemail-client"

export async function saveAPICredentials(service: "netlify" | "forwardemail", apiToken: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  // Get user's organization and role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { error: "Profile not found" }
  }

  if (!["owner", "admin"].includes(profile.role)) {
    return { error: "Only organization owners and admins can manage API credentials" }
  }

  const { data, error } = await supabase
    .from("api_credentials")
    .upsert(
      {
        organization_id: profile.organization_id,
        service,
        api_token: apiToken,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "organization_id,service",
      },
    )
    .select()

  if (error) {
    return { error: `Failed to save credentials: ${error.message}` }
  }

  revalidatePath("/dashboard/settings", "page")
  revalidatePath("/dashboard/domains", "page")
  revalidatePath("/dashboard", "layout")

  return { success: true }
}

export async function getAPICredentials(service: "netlify" | "forwardemail") {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  // Get user's organization
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { error: "Profile not found" }
  }

  const { data, error } = await supabase
    .from("api_credentials")
    .select("api_token, service, updated_at")
    .eq("organization_id", profile.organization_id)
    .eq("service", service)
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }

  if (!data) {
    return {
      error: `${service === "netlify" ? "Netlify" : "ForwardEmail"} API credentials not configured. Please contact your organization owner to add them in Settings.`,
    }
  }

  return { data }
}

export async function deleteAPICredentials(service: "netlify" | "forwardemail") {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  // Get user's organization and role
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user.id).single()

  if (!profile) {
    return { error: "Profile not found" }
  }

  if (!["owner", "admin"].includes(profile.role)) {
    return { error: "Only organization owners and admins can manage API credentials" }
  }

  console.log("[v0] Deleting API credentials:", {
    service,
    organization_id: profile.organization_id,
    role: profile.role,
  })

  // Delete API credentials
  const { error } = await supabase
    .from("api_credentials")
    .delete()
    .eq("organization_id", profile.organization_id)
    .eq("service", service)

  if (error) {
    console.log("[v0] Error deleting API credentials:", error)
    return { error: error.message }
  }

  console.log("[v0] API credentials deleted successfully")
  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function testAPIConnection(service: "netlify" | "forwardemail", apiToken: string) {
  try {
    if (service === "netlify") {
      const client = new NetlifyClient(apiToken)
      return await client.testConnection()
    } else {
      const client = new ForwardEmailClient(apiToken)
      return await client.testConnection()
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Connection test failed",
    }
  }
}
