"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Shield } from 'lucide-react'
import { updateUserRole } from "@/lib/actions/team"
import { useRouter } from 'next/navigation'
import { useToast } from "@/hooks/use-toast"

interface TeamMember {
  id: string
  email: string
  role: "owner" | "admin" | "member"
}

export function ChangeRoleDialog({ member }: { member: TeamMember }) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState(member.role)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Change role form submitted", { member, newRole: role })
    setIsLoading(true)

    console.log("[v0] Calling updateUserRole...")
    const result = await updateUserRole(member.id, role)
    console.log("[v0] updateUserRole result:", result)

    setIsLoading(false)

    if (result?.error) {
      console.log("[v0] Error updating role:", result.error)
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      return
    }

    console.log("[v0] Role updated successfully")
    toast({
      title: "Role Updated",
      description: `${member.email}'s role has been changed to ${role}.`,
    })

    setOpen(false)
  }

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault()
          setOpen(true)
        }}
      >
        <Shield className="mr-2 h-4 w-4" />
        Change Role
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Change Role</DialogTitle>
              <DialogDescription>
                Update the role for <strong>{member.email}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={(value: any) => setRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      <strong>Member:</strong> Can add domains and email aliases
                    </p>
                    <p>
                      <strong>Admin:</strong> Full access including team and API settings
                    </p>
                    <p>
                      <strong>Owner:</strong> Full access including team and API settings
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
