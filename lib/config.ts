/**
 * Environment Configuration and Validation
 * Validates all required environment variables at startup
 */

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

interface Config {
  // Supabase
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  
  // External APIs
  netlify: {
    apiToken: string;
  };
  forwardEmail: {
    apiToken: string;
  };
  zoho: {
    imapUser: string;
    imapPassword: string;
    apiToken?: string; // Optional REST API token
  };
  
  // App
  app: {
    url: string;
    isDevelopment: boolean;
    isProduction: boolean;
  };
}

/**
 * Get required environment variable or throw error
 */
function getRequiredEnv(key: string, context?: string): string {
  const value = process.env[key];
  
  if (!value) {
    const contextMsg = context ? ` (${context})` : '';
    throw new ConfigError(
      `Missing required environment variable: ${key}${contextMsg}\n` +
      `Please set this in your .env.local file or deployment environment.`
    );
  }
  
  return value;
}

/**
 * Get optional environment variable
 */
function getOptionalEnv(key: string): string | undefined {
  return process.env[key] || undefined;
}

/**
 * Validate and load configuration
 * Call this at the start of workers or when initializing API clients
 */
export function loadConfig(options?: {
  requireNetlify?: boolean;
  requireForwardEmail?: boolean;
  requireZohoIMAP?: boolean;
  requireZohoAPI?: boolean;
}): Config {
  const {
    requireNetlify = false,
    requireForwardEmail = false,
    requireZohoIMAP = false,
    requireZohoAPI = false,
  } = options || {};

  // Always required
  const supabaseUrl = getRequiredEnv('SUPABASE_URL', 'Supabase project URL');
  const supabaseAnonKey = getRequiredEnv(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'Supabase anon key'
  );
  const supabaseServiceRoleKey = getRequiredEnv(
    'SUPABASE_SERVICE_ROLE_KEY',
    'Supabase service role key'
  );
  const appUrl = getRequiredEnv(
    'NEXT_PUBLIC_APP_URL',
    'Application URL'
  );

  // Conditionally required based on context
  let netlifyApiToken: string | undefined;
  let forwardEmailApiToken: string | undefined;
  let zohoImapUser: string | undefined;
  let zohoImapPassword: string | undefined;
  let zohoApiToken: string | undefined;

  if (requireNetlify) {
    netlifyApiToken = getRequiredEnv(
      'NETLIFY_API_TOKEN',
      'Netlify DNS API token - get from https://app.netlify.com/user/applications'
    );
  } else {
    netlifyApiToken = getOptionalEnv('NETLIFY_API_TOKEN');
  }

  if (requireForwardEmail) {
    forwardEmailApiToken = getRequiredEnv(
      'FORWARDEMAIL_API_TOKEN',
      'ForwardEmail API token - get from https://forwardemail.net/en/my-account/security'
    );
  } else {
    forwardEmailApiToken = getOptionalEnv('FORWARDEMAIL_API_TOKEN');
  }

  if (requireZohoIMAP) {
    zohoImapUser = getRequiredEnv(
      'ZOHO_IMAP_USER',
      'Zoho email address for IMAP sync'
    );
    zohoImapPassword = getRequiredEnv(
      'ZOHO_IMAP_PASSWORD',
      'Zoho app-specific password - generate at https://accounts.zoho.com/home#security/passapp'
    );
  } else {
    zohoImapUser = getOptionalEnv('ZOHO_IMAP_USER');
    zohoImapPassword = getOptionalEnv('ZOHO_IMAP_PASSWORD');
  }

  if (requireZohoAPI) {
    zohoApiToken = getRequiredEnv(
      'ZOHO_API_TOKEN',
      'Zoho API token'
    );
  } else {
    zohoApiToken = getOptionalEnv('ZOHO_API_TOKEN');
  }

  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceRoleKey: supabaseServiceRoleKey,
    },
    netlify: {
      apiToken: netlifyApiToken || '',
    },
    forwardEmail: {
      apiToken: forwardEmailApiToken || '',
    },
    zoho: {
      imapUser: zohoImapUser || '',
      imapPassword: zohoImapPassword || '',
      apiToken: zohoApiToken,
    },
    app: {
      url: appUrl,
      isDevelopment,
      isProduction,
    },
  };
}

/**
 * Check if all API credentials are configured
 * Useful for showing setup warnings in UI
 */
export function checkApiCredentialsConfigured(): {
  netlify: boolean;
  forwardEmail: boolean;
  zohoIMAP: boolean;
} {
  return {
    netlify: !!process.env.NETLIFY_API_TOKEN,
    forwardEmail: !!process.env.FORWARDEMAIL_API_TOKEN,
    zohoIMAP: !!(process.env.ZOHO_IMAP_USER && process.env.ZOHO_IMAP_PASSWORD),
  };
}
