'use client'

import { useState } from 'react'
import { Mail, MailOpen, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toggleEmailRead, toggleEmailStarred } from '@/lib/actions/emails'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmailDetailDialog } from './email-detail-dialog'

interface Email {
  id: string
  subject: string
  sender: string
  recipient_alias: string | null
  from_domain: string | null
  received_at: string
  is_read: boolean
  is_starred: boolean
  body_text: string | null
  body_html: string | null
}

export function EmailsList({ emails }: { emails: Email[] }) {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)

  const handleToggleRead = async (emailId: string, isRead: boolean) => {
    await toggleEmailRead(emailId, !isRead)
  }

  const handleToggleStar = async (emailId: string, isStarred: boolean, e: React.MouseEvent) => {
    e.stopPropagation()
    await toggleEmailStarred(emailId, !isStarred)
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Mail className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No emails yet</h3>
        <p className="text-sm text-muted-foreground">
          Emails will appear here once they're synced from your inbox
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {emails.map((email) => (
          <button
            key={email.id}
            onClick={() => setSelectedEmail(email)}
            className={cn(
              'flex items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-accent',
              !email.is_read && 'bg-muted/50'
            )}
          >
            <div className="flex gap-2 pt-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleRead(email.id, email.is_read)
                }}
              >
                {email.is_read ? (
                  <MailOpen className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Mail className="h-4 w-4 text-primary" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => handleToggleStar(email.id, email.is_starred, e)}
              >
                <Star
                  className={cn(
                    'h-4 w-4',
                    email.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                  )}
                />
              </Button>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className={cn('font-medium', !email.is_read && 'font-semibold')}>
                  {email.sender}
                </p>
                <span className="text-xs text-muted-foreground">
                  {new Date(email.received_at).toLocaleDateString()}
                </span>
              </div>
              <p className={cn('text-sm', !email.is_read && 'font-semibold')}>
                {email.subject || '(No Subject)'}
              </p>
              <div className="flex items-center gap-2">
                {email.recipient_alias && (
                  <Badge variant="secondary" className="text-xs">
                    {email.recipient_alias}
                  </Badge>
                )}
                {email.from_domain && (
                  <Badge variant="outline" className="text-xs">
                    {email.from_domain}
                  </Badge>
                )}
              </div>
              {email.body_text && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {email.body_text}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedEmail && (
        <EmailDetailDialog
          email={selectedEmail}
          open={!!selectedEmail}
          onClose={() => setSelectedEmail(null)}
        />
      )}
    </>
  )
}
