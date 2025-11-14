/**
 * Typed Error Classes for External API Integrations
 */

export class ExternalApiError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ExternalApiError';
  }
}

export class NetlifyApiError extends ExternalApiError {
  constructor(message: string, statusCode?: number, originalError?: unknown) {
    super(message, 'Netlify DNS', statusCode, originalError);
    this.name = 'NetlifyApiError';
  }
}

export class ForwardEmailApiError extends ExternalApiError {
  constructor(message: string, statusCode?: number, originalError?: unknown) {
    super(message, 'ForwardEmail', statusCode, originalError);
    this.name = 'ForwardEmailApiError';
  }
}

export class ZohoApiError extends ExternalApiError {
  constructor(message: string, statusCode?: number, originalError?: unknown) {
    super(message, 'Zoho', statusCode, originalError);
    this.name = 'ZohoApiError';
  }
}

export class ZohoImapError extends ExternalApiError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'Zoho IMAP', undefined, originalError);
    this.name = 'ZohoImapError';
  }
}

/**
 * Centralized wrapper for external API calls with retry logic
 */
export async function callExternalApi<T>(
  fn: () => Promise<T>,
  options: {
    service: string;
    operation: string;
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
  }
): Promise<T> {
  const {
    service,
    operation,
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000,
  } = options;

  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout wrapper
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`${service} ${operation} timed out after ${timeout}ms`));
        }, timeout);
      });

      const result = await Promise.race([fn(), timeoutPromise]);
      
      // Success - log if not first attempt
      if (attempt > 1) {
        console.log(`✓ ${service} ${operation} succeeded on attempt ${attempt}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error instanceof ExternalApiError && error.statusCode === 401) {
        throw error; // Authentication errors shouldn't be retried
      }
      
      if (attempt < maxRetries) {
        const delay = retryDelay * attempt; // Exponential backoff
        console.warn(
          `⚠ ${service} ${operation} failed (attempt ${attempt}/${maxRetries}), ` +
          `retrying in ${delay}ms...`,
          error instanceof Error ? error.message : String(error)
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  console.error(`✗ ${service} ${operation} failed after ${maxRetries} attempts`);
  throw lastError;
}

/**
 * Format error for user display
 */
export function formatErrorForUser(error: unknown): string {
  if (error instanceof ExternalApiError) {
    return `${error.service} error: ${error.message}`;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'Unknown error';
}
