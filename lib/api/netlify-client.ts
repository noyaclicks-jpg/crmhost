// Netlify API Client for domain and site management

interface NetlifySite {
  id: string
  name: string
  url: string
  admin_url: string
  custom_domain?: string
  ssl_url?: string
  created_at: string
  updated_at: string
}

interface NetlifyDomain {
  id: string
  name: string
  created_at: string
}

interface NetlifyDNSRecord {
  id: string
  hostname: string
  type: string
  value: string
  ttl: number
}

interface NetlifyDNSZone {
  id: string
  name: string
  dns_servers: string[]
  account_slug: string
  site_id: string
  created_at: string
  updated_at: string
}

export class NetlifyClient {
  private apiToken: string
  private baseUrl = "https://api.netlify.com/api/v1"

  constructor(apiToken: string) {
    this.apiToken = apiToken
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Netlify API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Get all sites
  async getSites(): Promise<NetlifySite[]> {
    return this.request<NetlifySite[]>("/sites")
  }

  // Get a specific site
  async getSite(siteId: string): Promise<NetlifySite> {
    return this.request<NetlifySite>(`/sites/${siteId}`)
  }

  // Create a new site
  async createSite(siteName: string): Promise<NetlifySite> {
    const uniqueSuffix = Math.random().toString(36).substring(2, 8)
    const uniqueSiteName = `${siteName}-${uniqueSuffix}`

    return this.request<NetlifySite>("/sites", {
      method: "POST",
      body: JSON.stringify({
        name: uniqueSiteName,
      }),
    })
  }

  // Add custom domain to site
  async addCustomDomain(siteId: string, domainName: string): Promise<NetlifySite> {
    return this.request<NetlifySite>(`/sites/${siteId}`, {
      method: "PATCH",
      body: JSON.stringify({
        custom_domain: domainName,
      }),
    })
  }

  // Get DNS records for a domain
  async getDNSRecords(siteId: string, domainName: string): Promise<NetlifyDNSRecord[]> {
    return this.request<NetlifyDNSRecord[]>(`/sites/${siteId}/dns/${domainName}/records`)
  }

  // Create DNS record
  async createDNSRecord(
    siteId: string,
    domainName: string,
    record: {
      type: string
      hostname: string
      value: string
      ttl?: number
    },
  ): Promise<NetlifyDNSRecord> {
    return this.request<NetlifyDNSRecord>(`/sites/${siteId}/dns/${domainName}/records`, {
      method: "POST",
      body: JSON.stringify(record),
    })
  }

  // Verify DNS configuration
  async verifyDNS(siteId: string, domainName: string): Promise<boolean> {
    try {
      const response = await this.request<{ verified: boolean }>(`/sites/${siteId}/domains/${domainName}/verify`, {
        method: "POST",
      })
      return response.verified
    } catch {
      return false
    }
  }

  // Delete a site
  async deleteSite(siteId: string): Promise<void> {
    await this.request(`/sites/${siteId}`, {
      method: "DELETE",
    })
  }

  async createDNSZoneOnly(domainName: string, accountSlug?: string): Promise<NetlifyDNSZone> {
    return this.request<NetlifyDNSZone>("/dns_zones", {
      method: "POST",
      body: JSON.stringify({
        account_slug: accountSlug,
        name: domainName,
      }),
    })
  }

  async getDNSZone(domainName: string): Promise<NetlifyDNSZone | null> {
    try {
      const zones = await this.request<NetlifyDNSZone[]>("/dns_zones")
      return zones.find((zone) => zone.name === domainName) || null
    } catch {
      return null
    }
  }

  async createDNSZone(siteId: string, domainName: string): Promise<NetlifyDNSZone> {
    return this.request<NetlifyDNSZone>("/dns_zones", {
      method: "POST",
      body: JSON.stringify({
        site_id: siteId,
        name: domainName,
      }),
    })
  }

  async getDNSZoneById(zoneId: string): Promise<NetlifyDNSZone> {
    return this.request<NetlifyDNSZone>(`/dns_zones/${zoneId}`)
  }

  async deleteDNSZone(zoneId: string): Promise<void> {
    await this.request(`/dns_zones/${zoneId}`, {
      method: "DELETE",
    })
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Try to fetch user account info as a health check
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      })

      if (!response.ok) {
        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        message: `Connected successfully as ${data.email || "Netlify user"}`,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
      }
    }
  }
}
