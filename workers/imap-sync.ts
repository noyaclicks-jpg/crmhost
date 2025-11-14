/**
 * IMAP Email Sync Worker
 * 
 * This worker script syncs emails from Zoho IMAP to the local database.
 * Run this script periodically (via cron or polling) to fetch new emails.
 * 
 * Usage:
 *   node workers/imap-sync.ts
 *   or
 *   npm run worker:imap-sync
 */

import { createClient } from '@supabase/supabase-js'
import { ZohoIMAPClient, EmailMessage } from '../lib/api/zoho-imap-client'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface SyncState {
  id: string
  organization_id: string
  provider: string
  email_address: string
  last_uid: number
}

interface ApiCredential {
  organization_id: string
  service_type: string
  credentials: {
    email: string
    password: string
  }
}

async function syncEmailsForOrganization(
  orgId: string,
  credential: ApiCredential,
  syncState: SyncState | null
) {
  console.log(`[v0] Starting sync for org ${orgId} with email ${credential.credentials.email}`)

  const client = new ZohoIMAPClient({
    user: credential.credentials.email,
    password: credential.credentials.password,
  })

  try {
    // Update sync status to 'syncing'
    if (syncState) {
      await supabase
        .from('sync_state')
        .update({ sync_status: 'syncing', updated_at: new Date().toISOString() })
        .eq('id', syncState.id)
    } else {
      const { data } = await supabase
        .from('sync_state')
        .insert({
          organization_id: orgId,
          provider: 'zoho',
          email_address: credential.credentials.email,
          last_uid: 0,
          sync_status: 'syncing',
        })
        .select()
        .single()

      syncState = data as SyncState
    }

    const lastUid = syncState?.last_uid || 0
    const newEmails = await client.fetchNewEmails(lastUid)

    console.log(`[v0] Fetched ${newEmails.length} new emails since UID ${lastUid}`)

    let maxUid = lastUid

    for (const email of newEmails) {
      // Check for duplicates
      const { data: existing } = await supabase
        .from('emails')
        .select('id')
        .eq('organization_id', orgId)
        .eq('message_id', email.messageId)
        .single()

      if (existing) {
        console.log(`[v0] Email ${email.messageId} already exists, skipping`)
        continue
      }

      // Insert email
      const { data: inserted, error: insertError } = await supabase
        .from('emails')
        .insert({
          organization_id: orgId,
          message_id: email.messageId,
          subject: email.subject,
          sender: email.from,
          recipients: email.to,
          body_text: email.bodyText,
          body_html: email.bodyHtml,
          received_at: email.date.toISOString(),
          is_read: false,
          has_attachments: email.attachments.length > 0,
        })
        .select()
        .single()

      if (insertError) {
        console.error(`[v0] Failed to insert email ${email.messageId}:`, insertError)
        continue
      }

      // Link email to domains/aliases
      const recipientDomains = email.to.map((addr) => addr.split('@')[1]).filter(Boolean)

      for (const domain of recipientDomains) {
        const { data: domainRecord } = await supabase
          .from('domains')
          .select('id')
          .eq('organization_id', orgId)
          .eq('name', domain)
          .single()

        if (domainRecord) {
          await supabase.from('email_domain_links').insert({
            email_id: inserted.id,
            domain_id: domainRecord.id,
          })
        }
      }

      maxUid = Math.max(maxUid, email.uid)
    }

    // Update sync state
    await supabase
      .from('sync_state')
      .update({
        last_uid: maxUid,
        last_sync_at: new Date().toISOString(),
        sync_status: 'success',
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', syncState!.id)

    console.log(`[v0] Sync completed successfully for org ${orgId}`)
  } catch (error) {
    console.error(`[v0] Sync failed for org ${orgId}:`, error)

    if (syncState) {
      await supabase
        .from('sync_state')
        .update({
          sync_status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', syncState.id)
    }
  } finally {
    client.disconnect()
  }
}

async function main() {
  console.log('[v0] IMAP Sync Worker started')

  // Fetch all Zoho credentials
  const { data: credentials, error } = await supabase
    .from('api_credentials')
    .select('organization_id, service_type, credentials')
    .eq('service_type', 'zoho')

  if (error) {
    console.error('[v0] Failed to fetch credentials:', error)
    process.exit(1)
  }

  if (!credentials || credentials.length === 0) {
    console.log('[v0] No Zoho credentials found, exiting')
    process.exit(0)
  }

  // Fetch sync states
  const { data: syncStates } = await supabase.from('sync_state').select('*').eq('provider', 'zoho')

  const syncStateMap = new Map<string, SyncState>()
  syncStates?.forEach((state) => {
    syncStateMap.set(`${state.organization_id}-${state.email_address}`, state)
  })

  // Sync emails for each organization
  for (const credential of credentials as ApiCredential[]) {
    const key = `${credential.organization_id}-${credential.credentials.email}`
    const syncState = syncStateMap.get(key) || null

    await syncEmailsForOrganization(credential.organization_id, credential, syncState)
  }

  console.log('[v0] IMAP Sync Worker completed')
  process.exit(0)
}

main()
