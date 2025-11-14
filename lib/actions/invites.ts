"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

export async function createInvite(email: string, role: "admin" | "member") {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role, full_name")
    .eq("id", user.id)
    .single()

  if (!profile || !["owner", "admin"].includes(profile.role)) {
    return { error: "Insufficient permissions" }
  }

  // Check if user already exists in organization
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .eq("organization_id", profile.organization_id)
    .maybeSingle()

  if (existingProfile) {
    return { error: "User already exists in your organization" }
  }

  // Check if invite already exists
  const { data: existingInvite } = await supabase
    .from("invites")
    .select("id")
    .eq("email", email)
    .eq("organization_id", profile.organization_id)
    .is("accepted_at", null)
    .maybeSingle()

  if (existingInvite) {
    return { error: "Invite already sent to this email" }
  }

  const token = globalThis.crypto.randomUUID() + globalThis.crypto.randomUUID().replace(/-/g, "")
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

  const { error: insertError } = await supabase.from("invites").insert({
    organization_id: profile.organization_id,
    email,
    role,
    invited_by: user.id,
    token,
    expires_at: expiresAt.toISOString(),
  })

  if (insertError) {
    return { error: insertError.message }
  }

  // Get organization name
  const { data: org } = await supabase.from("organizations").select("name").eq("id", profile.organization_id).single()

  // Log the audit
  await supabase.from("audit_logs").insert({
    organization_id: profile.organization_id,
    user_id: user.id,
    action: "user_invited",
    resource_type: "invite",
    resource_id: null,
    details: { email, role },
  })

  const headersList = await headers()
  const host = headersList.get("host") || "localhost:3000"
  const protocol = host.includes("localhost") ? "http" : "https"
  const baseUrl = `${protocol}://${host}`

  // Generate signup link instead of accept-invite link
  const inviteLink = `${baseUrl}/auth/sign-up?token=${token}`

  revalidatePath("/dashboard/team")
  return {
    success: true,
    inviteLink,
    inviteCode: token,
    message: "Invite created! Share the signup link or invite code with the user.",
  }
}

export async function deleteInvite(inviteId: string) {
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

  const { error } = await supabase
    .from("invites")
    .delete()
    .eq("id", inviteId)
    .eq("organization_id", profile.organization_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/team")
  return { success: true }
}

export async function getInvites() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated", invites: [] }
  }

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single()

  if (!profile) {
    return { error: "Profile not found", invites: [] }
  }

  const { data: invites, error } = await supabase
    .from("invites")
    .select("*, invited_by_profile:profiles!invites_invited_by_fkey(full_name, email)")
    .eq("organization_id", profile.organization_id)
    .is("accepted_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message, invites: [] }
  }

  return { invites: invites || [], success: true }
}

export async function acceptInviteWithSignup(token: string, userId: string) {
  const supabase = await createClient()

  // Get invite details
  const { data: invite, error: inviteError } = await supabase
    .from("invites")
    .select("*, organization:organizations(name)")
    .eq("token", token)
    .is("accepted_at", null)
    .maybeSingle()

  if (inviteError || !invite) {
    return { error: "Invalid invite code" }
  }

  // Check if invite has expired
  const expiresAt = new Date(invite.expires_at)
  if (expiresAt < new Date()) {
    return { error: "Invite code has expired" }
  }

  // Update the user's profile to join the organization
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      organization_id: invite.organization_id,
      role: invite.role,
    })
    .eq("id", userId)

  if (profileError) {
    return { error: profileError.message }
  }

  // Mark invite as accepted
  const { error: updateError } = await supabase
    .from("invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id)

  if (updateError) {
    return { error: updateError.message }
  }

  // Log the audit
  await supabase.from("audit_logs").insert({
    organization_id: invite.organization_id,
    user_id: userId,
    action: "user_joined",
    resource_type: "invite",
    resource_id: null,
    details: { email: invite.email, role: invite.role, via_invite: true },
  })

  return {
    success: true,
    organizationName: invite.organization.name,
    role: invite.role,
  }
}
