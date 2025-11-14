// ForwardEmail API Client for email alias management

interface ForwardEmailDomain {
  id: string
  name: string
  verification_record: string
  has_mx_record: boolean
  has_txt_record: boolean
  is_verified: boolean
  created_at: string
}

interface ForwardEmailAlias {
  id: string
  name: string
  recipients: string[]
  description?: string
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export class ForwardEmailClient {
  private apiToken: string
  private baseUrl = "https://api.forwardemail.net/v1"

  constructor(apiToken: string) {
    this.apiToken = apiToken
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.apiToken}:`).toString("base64")}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(
        `fetch to ${this.baseUrl}${endpoint} failed with status ${response.status} and body: ${body}`
      )
    }

    return response.json()
  }

  // Get all domains
  async getDomains(): Promise<ForwardEmailDomain[]> {
    const response = await this.request<ForwardEmailDomain[]>("/domains")
    return response
  }

  // Get a specific domain
  async getDomain(domainName: string): Promise<ForwardEmailDomain> {
    return this.request<ForwardEmailDomain>(`/domains/${domainName}`)
  }

  // Create a new domain
  async createDomain(domainName: string): Promise<ForwardEmailDomain> {
    return this.request<ForwardEmailDomain>("/domains", {
      method: "POST",
      body: JSON.stringify({
        domain: domainName,
      }),
    })
  }

  // Verify domain
  async verifyDomain(domainName: string): Promise<ForwardEmailDomain> {
    return this.request<ForwardEmailDomain>(`/domains/${domainName}/verify`, {
      method: "POST",
    })
  }

  // Get all aliases for a domain
  async getAliases(domainName: string): Promise<ForwardEmailAlias[]> {
    return this.request<ForwardEmailAlias[]>(`/domains/${domainName}/aliases`)
  }

  // Create an alias
  async createAlias(
    domainName: string,
    aliasData: {
      name: string
      recipients: string[]
      description?: string
      is_enabled?: boolean
    },
  ): Promise<ForwardEmailAlias> {
    return this.request<ForwardEmailAlias>(`/domains/${domainName}/aliases`, {
      method: "POST",
      body: JSON.stringify(aliasData),
    })
  }

  // Update an alias
  async updateAlias(
    domainName: string,
    aliasId: string,
    aliasData: {
      name?: string
      recipients?: string[]
      description?: string
      is_enabled?: boolean
    },
  ): Promise<ForwardEmailAlias> {
    return this.request<ForwardEmailAlias>(`/domains/${domainName}/aliases/${aliasId}`, {
      method: "PUT",
      body: JSON.stringify(aliasData),
    })
  }

  // Delete an alias
  async deleteAlias(domainName: string, aliasId: string): Promise<void> {
    await this.request(`/domains/${domainName}/aliases/${aliasId}`, {
      method: "DELETE",
    })
  }

  // Get DNS records needed for setup
  async getDNSRecords(domainName: string): Promise<{
    mx_records: Array<{ priority: number; value: string }>
    txt_records: string[]
  }> {
    const domain = await this.getDomain(domainName)
    return {
      mx_records: [
        { priority: 10, value: "mx1.forwardemail.net" },
        { priority: 20, value: "mx2.forwardemail.net" },
      ],
      txt_records: [domain.verification_record],
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Try to fetch account info as a health check
      const response = await fetch(`${this.baseUrl}/account`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.apiToken}:`).toString("base64")}`,
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
        message: `Connected successfully as ${data.email || "ForwardEmail user"}`,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
      }
    }
  }
}
