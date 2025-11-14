import { Suspense } from 'react'
import { Mail, Search, Filter, RefreshCw } from 'lucide-react'
import { getEmails } from '@/lib/actions/emails'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmailsList } from '@/components/dashboard/emails-list'
import { SectionHeader } from '@/components/dashboard/section-header'

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { search?: string; read?: string; page?: string }
}) {
  const page = parseInt(searchParams.page || '1')
  const limit = 50
  const offset = (page - 1) * limit

  const { emails, total } = await getEmails({
    search: searchParams.search,
    isRead: searchParams.read === 'true' ? true : searchParams.read === 'false' ? false : undefined,
    limit,
    offset,
  })

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <SectionHeader
        title="Inbox"
        description="All emails from your domains"
        icon={Mail}
      />

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search emails by subject, sender, or content..."
            className="pl-9"
            defaultValue={searchParams.search}
            name="search"
          />
        </div>

        <Select defaultValue={searchParams.read || 'all'}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Emails</SelectItem>
            <SelectItem value="false">Unread Only</SelectItem>
            <SelectItem value="true">Read Only</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Email List */}
      <Suspense fallback={<div>Loading emails...</div>}>
        <EmailsList emails={emails} />
      </Suspense>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} emails
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
