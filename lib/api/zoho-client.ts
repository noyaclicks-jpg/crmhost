import Imap from 'imap'
import { simpleParser, ParsedMail } from 'mailparser'

export interface ZohoConfig {
  user: string
  password: string
  host?: string
  port?: number
  tls?: boolean
}

export interface ParsedEmail {
  messageId: string
  subject: string
  from: string
  to: string[]
  receivedAt: Date
  bodyText: string
  bodyHtml: string
  headers: string
  attachments: Array<{
    filename: string
    contentType: string
    size: number
  }>
}

export class ZohoIMAPClient {
  private config: ZohoConfig

  constructor(config: ZohoConfig) {
    this.config = {
      host: 'imap.zoho.com',
      port: 993,
      tls: true,
      ...config,
    }
  }

  /**
   * Fetch new emails from Zoho inbox
   */
  async fetchNewEmails(sinceDate?: Date): Promise<ParsedEmail[]> {
    return new Promise((resolve, reject) => {
      const imap = new Imap(this.config)
      const emails: ParsedEmail[] = []

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            reject(err)
            return
          }

          // Search criteria
          const searchCriteria = sinceDate
            ? ['UNSEEN', ['SINCE', sinceDate]]
            : ['UNSEEN']

          imap.search(searchCriteria, (err, results) => {
            if (err) {
              reject(err)
              return
            }

            if (results.length === 0) {
              imap.end()
              resolve([])
              return
            }

            const fetch = imap.fetch(results, { bodies: '' })

            fetch.on('message', (msg) => {
              msg.on('body', (stream) => {
                simpleParser(stream, async (err, parsed) => {
                  if (err) {
                    console.error('Error parsing email:', err)
                    return
                  }

                  emails.push(this.parseEmail(parsed))
                })
              })
            })

            fetch.once('error', (err) => {
              reject(err)
            })

            fetch.once('end', () => {
              imap.end()
              resolve(emails)
            })
          })
        })
      })

      imap.once('error', (err) => {
        reject(err)
      })

      imap.connect()
    })
  }

  /**
   * Parse mailparser output to our format
   */
  private parseEmail(parsed: ParsedMail): ParsedEmail {
    return {
      messageId: parsed.messageId || '',
      subject: parsed.subject || '(No Subject)',
      from: parsed.from?.text || '',
      to: parsed.to?.text ? [parsed.to.text] : [],
      receivedAt: parsed.date || new Date(),
      bodyText: parsed.text || '',
      bodyHtml: parsed.html || '',
      headers: parsed.headerLines.map(h => `${h.key}: ${h.line}`).join('\n'),
      attachments: (parsed.attachments || []).map(att => ({
        filename: att.filename || 'attachment',
        contentType: att.contentType,
        size: att.size,
      })),
    }
  }

  /**
   * Mark email as read
   */
  async markAsRead(messageId: string): Promise<void> {
    // Implementation for marking as read
    // This would search for the message and add the \Seen flag
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      const imap = new Imap(this.config)

      imap.once('ready', () => {
        imap.end()
        resolve(true)
      })

      imap.once('error', () => {
        resolve(false)
      })

      imap.connect()
    })
  }
}
