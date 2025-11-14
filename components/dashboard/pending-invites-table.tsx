"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"
import { deleteInvite } from "@/lib/actions/invites"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

interface Invite {
  id: string
  email: string
  role: string
  created_at: string
  expires_at: string
  invited_by_profile: {
    full_name: string
    email: string
  }
}

interface PendingInvitesTableProps {
  invites: Invite[]
}

export function PendingInvitesTable({ invites }: PendingInvitesTableProps) {
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (inviteId: string) => {
    setDeletingId(inviteId)
    const result = await deleteInvite(inviteId)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Invite deleted successfully",
      })
    }
    setDeletingId(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Invited By</TableHead>
          <TableHead>Sent</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invites.map((invite) => (
          <TableRow key={invite.id}>
            <TableCell className="font-medium">{invite.email}</TableCell>
            <TableCell>
              <Badge variant={invite.role === "admin" ? "default" : "secondary"}>{invite.role}</Badge>
            </TableCell>
            <TableCell>{invite.invited_by_profile.full_name}</TableCell>
            <TableCell>{formatDate(invite.created_at)}</TableCell>
            <TableCell>{formatDate(invite.expires_at)}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(invite.id)}
                disabled={deletingId === invite.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
