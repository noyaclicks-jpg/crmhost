"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { removeTeamMember } from "@/lib/actions/team"
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChangeRoleDialog } from "./change-role-dialog"

interface TeamMember {
  id: string
  email: string
  full_name: string | null
  role: "owner" | "admin" | "member"
  created_at: string
}

interface TeamMembersTableProps {
  members: TeamMember[]
  currentUserId: string
  currentUserRole: string
}

export function TeamMembersTable({ members, currentUserId, currentUserRole }: TeamMembersTableProps) {
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const router = useRouter()

  const handleRemove = async () => {
    if (!selectedMember) return

    setIsRemoving(true)
    await removeTeamMember(selectedMember.id)
    setIsRemoving(false)
    setRemoveDialogOpen(false)
    setSelectedMember(null)
  }

  const canModify = (member: TeamMember) => {
    // Can't modify yourself
    if (member.id === currentUserId) return false
    // Only owners can modify other owners
    if (member.role === "owner" && currentUserRole !== "owner") return false
    // Admins and owners can modify members
    return true
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default"
      case "admin":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">
                {member.full_name || "-"}
                {member.id === currentUserId && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
              </TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(member.role)}>{member.role}</Badge>
              </TableCell>
              <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                {canModify(member) ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <ChangeRoleDialog member={member} />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedMember(member)
                          setRemoveDialogOpen(true)
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{selectedMember?.email}</strong> from your organization. They will lose access
              immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
