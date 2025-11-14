"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash2, Power, PowerOff } from 'lucide-react'
import { deleteEmailAlias, updateEmailAlias } from "@/lib/actions/email-aliases"
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
import { EditEmailAliasDialog } from "./edit-email-alias-dialog"
import { StatusBadge } from "./status-badge"

interface EmailAlias {
  id: string
  alias_name: string
  forward_to: string[]
  description: string | null
  is_enabled: boolean
  created_at: string
  domains: {
    id: string
    domain_name: string
    status: string
  }
}

interface EmailAliasesTableProps {
  aliases: EmailAlias[]
  canManage: boolean
}

export function EmailAliasesTable({ aliases, canManage }: EmailAliasesTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAlias, setSelectedAlias] = useState<EmailAlias | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!selectedAlias) return

    setIsDeleting(true)
    try {
      await deleteEmailAlias(selectedAlias.id)
      setDeleteDialogOpen(false)
      setSelectedAlias(null)
    } catch (error) {
      console.error("Failed to delete alias:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleEnabled = async (alias: EmailAlias) => {
    setIsToggling(alias.id)
    try {
      await updateEmailAlias(alias.id, { is_enabled: !alias.is_enabled })
    } catch (error) {
      console.error("Failed to toggle alias:", error)
    } finally {
      setIsToggling(null)
    }
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Email Alias</TableHead>
              <TableHead className="font-semibold">Forward To</TableHead>
              <TableHead className="font-semibold">Description</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              {canManage && <TableHead className="text-right font-semibold">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {aliases.map((alias) => (
              <TableRow key={alias.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium font-mono text-sm">
                      {alias.alias_name}@{alias.domains.domain_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alias.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {alias.forward_to.slice(0, 2).map((email, index) => (
                      <span key={index} className="text-sm font-mono">
                        {email}
                      </span>
                    ))}
                    {alias.forward_to.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{alias.forward_to.length - 2} more
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{alias.description || "—"}</span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={alias.is_enabled ? "active" : "disabled"} />
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <EditEmailAliasDialog alias={alias} />
                        <DropdownMenuItem onClick={() => handleToggleEnabled(alias)} disabled={isToggling === alias.id}>
                          {alias.is_enabled ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4" />
                              Enable
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAlias(alias)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the email alias{" "}
              <strong>
                {selectedAlias?.alias_name}@{selectedAlias?.domains.domain_name}
              </strong>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
