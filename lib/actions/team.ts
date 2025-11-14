"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateUserRole(userId: string, newRole: "owner" | "admin" | "member") {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user.id).single()

  if (!profile || profile.role !== "owner") {
    return { error: "Insufficient permissions" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .eq("organization_id", profile.organization_id)

  if (error) {
    return { error: error.message }
  }

  await supabase.from("audit_logs").insert({
    organization_id: profile.organization_id,
    user_id: user.id,
    action: "user_role_updated",
    resource_type: "profile",
    resource_id: userId,
    details: { new_role: newRole },
  })

  revalidatePath("/dashboard/team")
  return { success: true }
}

export async function removeTeamMember(userId: string) {
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

  // Can't remove yourself
  if (userId === user.id) {
    return { error: "Cannot remove yourself" }
  }

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId)
    .eq("organization_id", profile.organization_id)

  if (error) {
    return { error: error.message }
  }

  await supabase.from("audit_logs").insert({
    organization_id: profile.organization_id,
    user_id: user.id,
    action: "user_removed",
    resource_type: "profile",
    resource_id: userId,
  })

  revalidatePath("/dashboard/team")
  return { success: true }
}

export async function createTeamMember(fullName: string, email: string, password: string, role: "admin" | "member") {
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

  const adminClient = await createAdminClient()

  const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers()

  if (listError) {
    return { error: "Failed to check existing users" }
  }

  const userWithEmail = existingUsers.users.find((u) => u.email === email)

  if (userWithEmail) {
    // User exists in Auth but not in this org - add them to org instead
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userWithEmail.id,
      email: email,
      full_name: fullName,
      organization_id: profile.organization_id,
      role: role,
    })

    if (profileError) {
      return {
        error: "User exists but couldn't be added to organization. They may already belong to another organization.",
      }
    }

    await supabase.from("audit_logs").insert({
      organization_id: profile.organization_id,
      user_id: user.id,
      action: "user_added",
      resource_type: "profile",
      resource_id: userWithEmail.id,
      details: { email, role, full_name: fullName },
    })

    revalidatePath("/dashboard/team")
    return {
      success: true,
      message: `Existing user ${email} added to your organization. They can log in with their existing password.`,
      credentials: null,
    }
  }

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      organization_id: profile.organization_id,
      role,
    },
  })

  if (createError) {
    return { error: createError.message }
  }

  if (!newUser.user) {
    return { error: "Failed to create user" }
  }

  // Log the audit
  await supabase.from("audit_logs").insert({
    organization_id: profile.organization_id,
    user_id: user.id,
    action: "user_created",
    resource_type: "profile",
    resource_id: newUser.user.id,
    details: { email, role, full_name: fullName },
  })

  revalidatePath("/dashboard/team")
  return {
    success: true,
    message: `User ${email} created successfully with temporary password.`,
    credentials: {
      email,
      password,
    },
  }
}
