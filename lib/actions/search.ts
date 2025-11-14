/**
 * Global Search Server Actions
 * Unified search across domains, aliases, and emails
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';

export interface SearchResult {
  type: 'domain' | 'alias' | 'email';
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  url: string;
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
}

/**
 * Global search across all content types
 */
export async function globalSearch(
  query: string,
  options?: {
    types?: Array<'domain' | 'alias' | 'email'>;
    limit?: number;
    offset?: number;
  }
): Promise<SearchResponse> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    const {
      types = ['domain', 'alias', 'email'],
      limit = 20,
      offset = 0,
    } = options || {};

    const searchTerm = query.trim().toLowerCase();
    if (!searchTerm) {
      return { results: [], total: 0, hasMore: false };
    }

    const results: SearchResult[] = [];

    // Search domains
    if (types.includes('domain')) {
      const { data: domains } = await supabase
        .from('domains')
        .select('id, domain_name, status, created_at')
        .eq('organization_id', user.organization_id)
        .ilike('domain_name', \`%\${searchTerm}%\`)
        .limit(10);

      if (domains) {
        results.push(
          ...domains.map(domain => ({
            type: 'domain' as const,
            id: domain.id,
            title: domain.domain_name,
            subtitle: \`Domain • \${domain.status}\`,
            url: \`/dashboard/domains?highlight=\${domain.id}\`,
            metadata: { status: domain.status, created_at: domain.created_at },
          }))
        );
      }
    }

    // Search email aliases
    if (types.includes('alias')) {
      const { data: aliases } = await supabase
        .from('email_aliases')
        .select('id, alias_name, forward_to, description, domains(domain_name)')
        .eq('organization_id', user.organization_id)
        .or(\`alias_name.ilike.%\${searchTerm}%,forward_to.ilike.%\${searchTerm}%,description.ilike.%\${searchTerm}%\`)
        .limit(10);

      if (aliases) {
        results.push(
          ...aliases.map(alias => ({
            type: 'alias' as const,
            id: alias.id,
            title: alias.alias_name,
            subtitle: \`Alias → \${alias.forward_to}\`,
            description: alias.description || undefined,
            url: \`/dashboard/emails?highlight=\${alias.id}\`,
            metadata: {
              forward_to: alias.forward_to,
              domain: alias.domains?.domain_name,
            },
          }))
        );
      }
    }

    // Search emails (full-text search)
    if (types.includes('email')) {
      const { data: emails } = await supabase
        .from('emails')
        .select('id, subject, sender, recipient, received_at, body_text')
        .eq('organization_id', user.organization_id)
        .or(\`subject.ilike.%\${searchTerm}%,sender.ilike.%\${searchTerm}%,body_text.ilike.%\${searchTerm}%\`)
        .order('received_at', { ascending: false })
        .limit(10);

      if (emails) {
        results.push(
          ...emails.map(email => ({
            type: 'email' as const,
            id: email.id,
            title: email.subject || '(No Subject)',
            subtitle: \`Email from \${email.sender}\`,
            description: email.body_text?.substring(0, 100),
            url: \`/dashboard/inbox?email=\${email.id}\`,
            metadata: {
              sender: email.sender,
              recipient: email.recipient,
              received_at: email.received_at,
            },
          }))
        );
      }
    }

    // Apply pagination
    const paginatedResults = results.slice(offset, offset + limit);
    const hasMore = results.length > offset + limit;

    return {
      results: paginatedResults,
      total: results.length,
      hasMore,
    };
  } catch (error) {
    console.error('Global search error:', error);
    throw new Error('Failed to perform search');
  }
}

/**
 * Search domains only
 */
export async function searchDomains(query: string): Promise<SearchResult[]> {
  const response = await globalSearch(query, { types: ['domain'], limit: 50 });
  return response.results;
}

/**
 * Search aliases only
 */
export async function searchAliases(query: string): Promise<SearchResult[]> {
  const response = await globalSearch(query, { types: ['alias'], limit: 50 });
  return response.results;
}

/**
 * Search emails only (with full-text search)
 */
export async function searchEmails(
  query: string,
  limit: number = 50
): Promise<SearchResult[]> {
  const response = await globalSearch(query, { types: ['email'], limit });
  return response.results;
}
