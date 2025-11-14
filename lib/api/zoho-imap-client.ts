import Imap from 'imap'
import { simpleParser, ParsedMail } from 'mailparser'

export interface ZohoIMAPConfig {
  user: string
  password: string
  host?: string
  port?: number
  tls?: boolean
}

export interface EmailMessage {
  messageId: string
  uid: number
  subject: string
  from: string
  to: string[]
  cc?: string[]
  date: Date
  bodyText?: string
  bodyHtml?: string
  attachments: Array<{
    filename: string
    contentType: string
    size: number
  }>
}

export class ZohoIMAPClient {
  private config: ZohoIMAPConfig
  private imap: Imap | null = null

  constructor(config: ZohoIMAPConfig) {
    this.config = {
      host: 'imap.zoho.com',
      port: 993,
      tls: true,
      ...config,
    }
  }

  private connect(): Promise<Imap> {
    return new Promise((resolve, reject) => {
      if (this.imap) {
        return resolve(this.imap)
      }

      this.imap = new Imap({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host!,
        port: this.config.port!,
        tls: this.config.tls!,
        tlsOptions: { rejectUnauthorized: false },
      })

      this.imap.once('ready', () => {
        resolve(this.imap!)
      })

      this.imap.once('error', (err: Error) => {
        reject(err)
      })

      this.imap.connect()
    })
  }

  async fetchNewEmails(sinceUid: number = 0): Promise<EmailMessage[]> {
    const imap = await this.connect()
    const emails: EmailMessage[] = []

    return new Promise((resolve, reject) => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          return reject(err)
        }

        const searchCriteria = sinceUid > 0 ? [['UID', `${sinceUid + 1}:*`]] : ['ALL']

        imap.search(searchCriteria, (err, results) => {
          if (err) {
            return reject(err)
          }

          if (!results || results.length === 0) {
            return resolve([])
          }

          const fetch = imap.fetch(results, {
            bodies: '',
            struct: true,
            markSeen: false,
          })

          fetch.on('message', (msg, seqno) => {
            let uid = 0
            let buffer = ''

            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8')
              })
            })

            msg.once('attributes', (attrs) => {
              uid = attrs.uid
            })

            msg.once('end', async () => {
              try {
                const parsed: ParsedMail = await simpleParser(buffer)

                emails.push({
                  messageId: parsed.messageId || `${uid}@zoho`,
                  uid,
                  subject: parsed.subject || '(no subject)',
                  from: parsed.from?.text || '',
                  to: parsed.to?.value.map((addr) => addr.address || '') || [],
                  cc: parsed.cc?.value.map((addr) => addr.address || '') || [],
                  date: parsed.date || new Date(),
                  bodyText: parsed.text || '',
                  bodyHtml: parsed.html || '',
                  attachments:
                    parsed.attachments?.map((att) => ({
                      filename: att.filename || 'unnamed',
                      contentType: att.contentType,
                      size: att.size,
                    })) || [],
                })
              } catch (parseErr) {
                console.error(`[v0] Failed to parse email UID ${uid}:`, parseErr)
              }
            })
          })

          fetch.once('error', (err) => {
            reject(err)
          })

          fetch.once('end', () => {
            resolve(emails)
          })
        })
      })
    })
  }

  async markAsRead(uid: number): Promise<void> {
    const imap = await this.connect()

    return new Promise((resolve, reject) => {
      imap.openBox('INBOX', false, (err) => {
        if (err) {
          return reject(err)
        }

        imap.addFlags(uid, ['\\Seen'], (err) => {
          if (err) {
            return reject(err)
          }
          resolve()
        })
      })
    })
  }

  disconnect(): void {
    if (this.imap) {
      this.imap.end()
      this.imap = null
    }
  }
}
