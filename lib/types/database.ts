export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          organization_id: string
          role: "owner" | "admin" | "member"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          organization_id: string
          role: "owner" | "admin" | "member"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          organization_id?: string
          role?: "owner" | "admin" | "member"
          created_at?: string
          updated_at?: string
        }
      }
      domains: {
        Row: {
          id: string
          organization_id: string
          domain_name: string
          netlify_site_id: string | null
          netlify_site_name: string | null
          status: "pending" | "active" | "error"
          dns_configured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          domain_name: string
          netlify_site_id?: string | null
          netlify_site_name?: string | null
          status?: "pending" | "active" | "error"
          dns_configured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          domain_name?: string
          netlify_site_id?: string | null
          netlify_site_name?: string | null
          status?: "pending" | "active" | "error"
          dns_configured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      email_aliases: {
        Row: {
          id: string
          organization_id: string
          domain_id: string
          alias_name: string
          forward_to: string[]
          description: string | null
          is_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          domain_id: string
          alias_name: string
          forward_to: string[]
          description?: string | null
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          domain_id?: string
          alias_name?: string
          forward_to?: string[]
          description?: string | null
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      api_credentials: {
        Row: {
          id: string
          organization_id: string
          service: "netlify" | "forwardemail"
          api_token: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          service: "netlify" | "forwardemail"
          api_token: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          service?: "netlify" | "forwardemail"
          api_token?: string
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          action: string
          resource_type: string
          resource_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          action: string
          resource_type: string
          resource_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          action?: string
          resource_type?: string
          resource_id?: string | null
          details?: Json | null
          created_at?: string
        }
      }
      invites: {
        Row: {
          id: string
          organization_id: string
          email: string
          role: "admin" | "member"
          invited_by: string
          token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          role: "admin" | "member"
          invited_by: string
          token: string
          expires_at: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          role?: "admin" | "member"
          invited_by?: string
          token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
      }
    }
  }
}
