"use server"

import { createClient } from "@/lib/supabase/server"
import { NetlifyClient } from "@/lib/api/netlify-client"
import { ForwardEmailClient } from "@/lib/api/forwardemail-client"
import { getAPICredentials } from "./api-credentials"
import { revalidatePath } from "next/cache"

export async function createDomain(domainName: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user.id).single()

  if (!profile) {
    return { error: "Profile not found" }
  }

  if (!["owner", "admin"].includes(profile.role)) {
    return { error: "Insufficient permissions" }
  }

  try {
    const netlifyCredsResult = await getAPICredentials("netlify")
    if (netlifyCredsResult.error || !netlifyCredsResult.data) {
      return { error: "Netlify API credentials not configured" }
    }

    const forwardEmailCredsResult = await getAPICredentials("forwardemail")
    if (forwardEmailCredsResult.error || !forwardEmailCredsResult.data) {
      return { error: "ForwardEmail API credentials not configured" }
    }

    const netlifyClient = new NetlifyClient(netlifyCredsResult.data.api_token)

    let dnsZone = await netlifyClient.getDNSZone(domainName)
    if (!dnsZone) {
      dnsZone = await netlifyClient.createDNSZoneOnly(domainName)
    }

    const forwardEmailClient = new ForwardEmailClient(forwardEmailCredsResult.data.api_token)
    await forwardEmailClient.createDomain(domainName)

    const { data, error } = await supabase
      .from("domains")
      .insert({
        organization_id: profile.organization_id,
        domain_name: domainName,
        netlify_dns_zone_id: dnsZone.id,
        nameservers: dnsZone.dns_servers,
        status: "pending",
        dns_configured: false,
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    await supabase.from("audit_logs").insert({
      organization_id: profile.organization_id,
      user_id: user.id,
      action: "domain_created",
      resource_type: "domain",
      resource_id: data.id,
      details: { domain_name: domainName },
    })

    revalidatePath("/dashboard/domains")
    return { data }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create domain",
    }
  }
}

export async function deleteDomain(domainId: string) {
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

  const { data: domain } = await supabase.from("domains").select("*").eq("id", domainId).single()

  if (!domain) {
    return { error: "Domain not found" }
  }

  try {
    const netlifyCredsResult = await getAPICredentials("netlify")
    if (netlifyCredsResult.data && domain.netlify_dns_zone_id) {
      const netlifyClient = new NetlifyClient(netlifyCredsResult.data.api_token)
      await netlifyClient.deleteDNSZone(domain.netlify_dns_zone_id)
    }

    const { error } = await supabase.from("domains").delete().eq("id", domainId)

    if (error) {
      return { error: error.message }
    }

    await supabase.from("audit_logs").insert({
      organization_id: profile.organization_id,
      user_id: user.id,
      action: "domain_deleted",
      resource_type: "domain",
      resource_id: domainId,
      details: { domain_name: domain.domain_name },
    })

    revalidatePath("/dashboard/domains")
    return { success: true }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete domain",
    }
  }
}

export async function verifyDomainDNS(domainId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: domain } = await supabase.from("domains").select("*").eq("id", domainId).single()

  if (!domain) {
    return { error: "Domain not found" }
  }

  try {
    const netlifyCredsResult = await getAPICredentials("netlify")
    let netlifyVerified = false
    if (netlifyCredsResult.data && domain.netlify_dns_zone_id) {
      const netlifyClient = new NetlifyClient(netlifyCredsResult.data.api_token)
      const dnsZone = await netlifyClient.getDNSZoneById(domain.netlify_dns_zone_id)
      netlifyVerified = !!dnsZone
    }

    const forwardEmailCredsResult = await getAPICredentials("forwardemail")
    let forwardEmailVerified = false
    if (forwardEmailCredsResult.data) {
      const forwardEmailClient = new ForwardEmailClient(forwardEmailCredsResult.data.api_token)
      
      try {
        const forwardEmailDomain = await forwardEmailClient.getDomain(domain.domain_name)
        forwardEmailVerified = forwardEmailDomain.is_verified
        console.log('[v0] ForwardEmail domain status:', forwardEmailDomain.is_verified ? 'verified' : 'not verified')
      } catch (getDomainError: any) {
        if (getDomainError.message && getDomainError.message.includes("404")) {
          console.log('[v0] Domain not found in ForwardEmail, creating...')
          try {
            const newDomain = await forwardEmailClient.createDomain(domain.domain_name)
            forwardEmailVerified = newDomain.is_verified
          } catch (createError: any) {
            if (createError.message && createError.message.includes("already exists")) {
              console.log('[v0] Domain already exists, fetching status...')
              const existingDomain = await forwardEmailClient.getDomain(domain.domain_name)
              forwardEmailVerified = existingDomain.is_verified
            } else {
              console.error('[v0] Failed to create domain:', createError.message)
            }
          }
        } else {
          console.error('[v0] Error fetching domain:', getDomainError.message)
        }
      }
    }

    const isFullyVerified = netlifyVerified && forwardEmailVerified
    await supabase
      .from("domains")
      .update({
        dns_configured: isFullyVerified,
        status: isFullyVerified ? "active" : "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", domainId)

    revalidatePath("/dashboard/domains")
    
    return { 
      verified: isFullyVerified,
      details: {
        netlifyVerified,
        forwardEmailVerified
      }
    }
  } catch (error) {
    console.error('[v0] Domain verification error:', error)
    return {
      error: error instanceof Error ? error.message : "Failed to verify DNS",
    }
  }
}

export async function syncDomainsFromForwardEmail() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single()
  if (!profile) {
    return { error: "Profile not found" }
  }

  try {
    const forwardEmailCredsResult = await getAPICredentials("forwardemail")
    if (forwardEmailCredsResult.error || !forwardEmailCredsResult.data) {
      return { error: "ForwardEmail API credentials not configured" }
    }

    const forwardEmailClient = new ForwardEmailClient(forwardEmailCredsResult.data.api_token)
    
    const { data: localDomains } = await supabase
      .from("domains")
      .select("*")
      .eq("organization_id", profile.organization_id)

    if (!localDomains) {
      return { error: "No domains found" }
    }

    let synced = 0
    for (const domain of localDomains) {
      try {
        const forwardEmailDomain = await forwardEmailClient.getDomain(domain.domain_name)
        
        if (forwardEmailDomain.is_verified && domain.status !== "active") {
          await supabase
            .from("domains")
            .update({
              dns_configured: true,
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", domain.id)
          synced++
        }
      } catch (error) {
        console.log(`[v0] Skipping domain ${domain.domain_name}:`, error)
      }
    }

    revalidatePath("/dashboard/domains")
    return { success: true, synced }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to sync domains",
    }
  }
}

export async function getDomainDNSInfo(domainId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: domain } = await supabase.from("domains").select("*").eq("id", domainId).single()

  if (!domain) {
    return { error: "Domain not found" }
  }

  return { data: domain }
}
