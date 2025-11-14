'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface Email {
  id: string
  message_id: string
  subject: string
  sender: string
  recipient_alias: string | null
  from_domain: string | null
  body_text: string | null
  body_html: string | null
  received_at: string
  is_read: boolean
  is_starred: boolean
  created_at: string
}

/**
 * Get all emails for the user's organization
 */
export async function getEmails(filters?: {
  search?: string
  isRead?: boolean
  domain?: string
  limit?: number
  offset?: number
}): Promise<{ emails: Email[]; total: number }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user's organization
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || profileError) {
    // Return empty results if profile doesn't exist yet
    return { emails: [], total: 0 }
  }

  // Build query
  let query = supabase
    .from('emails')
    .select('*', { count: 'exact' })
    .eq('organization_id', profile.organization_id)
    .order('received_at', { ascending: false })

  // Apply filters
  if (filters?.search) {
    query = query.or(
      `subject.ilike.%${filters.search}%,sender.ilike.%${filters.search}%,body_text.ilike.%${filters.search}%`
    )
  }

  if (filters?.isRead !== undefined) {
    query = query.eq('is_read', filters.isRead)
  }

  if (filters?.domain) {
    query = query.eq('from_domain', filters.domain)
  }

  // Pagination
  const limit = filters?.limit || 50
  const offset = filters?.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    emails: data || [],
    total: count || 0,
  }
}

/**
 * Get a single email by ID
 */
export async function getEmail(id: string): Promise<Email | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || profileError) {
    return null
  }

  const { data, error } = await supabase
    .from('emails')
    .select('*')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (error) {
    return null
  }

  return data
}

/**
 * Mark email as read/unread
 */
export async function toggleEmailRead(
  emailId: string,
  isRead: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('emails')
    .update({ is_read: isRead, updated_at: new Date().toISOString() })
    .eq('id', emailId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/inbox')
  return { success: true }
}

/**
 * Toggle email starred status
 */
export async function toggleEmailStarred(
  emailId: string,
  isStarred: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('emails')
    .update({ is_starred: isStarred, updated_at: new Date().toISOString() })
    .eq('id', emailId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/inbox')
  return { success: true }
}

/**
 * Get email stats for dashboard
 */
export async function getEmailStats(): Promise<{
  total: number
  unread: number
  today: number
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { total: 0, unread: 0, today: 0 }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || profileError) {
    return { total: 0, unread: 0, today: 0 }
  }

  // Get total count
  const { count: total } = await supabase
    .from('emails')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile.organization_id)

  // Get unread count
  const { count: unread } = await supabase
    .from('emails')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile.organization_id)
    .eq('is_read', false)

  // Get today's count
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: todayCount } = await supabase
    .from('emails')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile.organization_id)
    .gte('received_at', today.toISOString())

  return {
    total: total || 0,
    unread: unread || 0,
    today: todayCount || 0,
  }
}
