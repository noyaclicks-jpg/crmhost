'use client'

import { Mail, Calendar, User, AtSign } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Email {
  id: string
  subject: string
  sender: string
  recipient_alias: string | null
  from_domain: string | null
  received_at: string
  body_text: string | null
  body_html: string | null
}

export function EmailDetailDialog({
  email,
  open,
  onClose,
}: {
  email: Email
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{email.subject || '(No Subject)'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email Metadata */}
          <div className="space-y-2 rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">From:</span>
              <span>{email.sender}</span>
            </div>

            {email.recipient_alias && (
              <div className="flex items-center gap-2 text-sm">
                <AtSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">To:</span>
                <Badge variant="secondary">{email.recipient_alias}</Badge>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Date:</span>
              <span>{new Date(email.received_at).toLocaleString()}</span>
            </div>

            {email.from_domain && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Domain:</span>
                <Badge variant="outline">{email.from_domain}</Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Email Body */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {email.body_html ? (
              <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
            ) : (
              <div className="whitespace-pre-wrap">{email.body_text}</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
