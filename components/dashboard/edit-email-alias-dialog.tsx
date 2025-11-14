"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Pencil, Plus, X } from 'lucide-react'
import { updateEmailAlias } from "@/lib/actions/email-aliases"
import { useRouter } from 'next/navigation'

interface EmailAlias {
  id: string
  alias_name: string
  forward_to: string[]
  description: string | null
  domains: {
    domain_name: string
  }
}

interface EditEmailAliasDialogProps {
  alias: EmailAlias
}

export function EditEmailAliasDialog({ alias }: EditEmailAliasDialogProps) {
  const [open, setOpen] = useState(false)
  const [forwardTo, setForwardTo] = useState<string[]>(alias.forward_to)
  const [description, setDescription] = useState(alias.description || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAddRecipient = () => {
    setForwardTo([...forwardTo, ""])
  }

  const handleRemoveRecipient = (index: number) => {
    setForwardTo(forwardTo.filter((_, i) => i !== index))
  }

  const handleRecipientChange = (index: number, value: string) => {
    const newForwardTo = [...forwardTo]
    newForwardTo[index] = value
    setForwardTo(newForwardTo)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Filter out empty recipients
    const validRecipients = forwardTo.filter((email) => email.trim() !== "")

    if (validRecipients.length === 0) {
      setError("Please add at least one recipient email address")
      setIsLoading(false)
      return
    }

    const result = await updateEmailAlias(alias.id, {
      forward_to: validRecipients,
      description: description || undefined,
    })

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setOpen(false)
    setIsLoading(false)
  }

  return (
    <>
      <DropdownMenuItem 
        onSelect={(e) => {
          e.preventDefault()
          setOpen(true)
        }}
      >
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl bg-white border-border">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Email Alias</DialogTitle>
              <DialogDescription>
                Update forwarding settings for{" "}
                <strong className="font-mono">
                  {alias.alias_name}@{alias.domains.domain_name}
                </strong>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Forward To</Label>
                {forwardTo.map((email, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="email"
                      placeholder="recipient@example.com"
                      value={email}
                      onChange={(e) => handleRecipientChange(index, e.target.value)}
                      required={index === 0}
                    />
                    {forwardTo.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveRecipient(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={handleAddRecipient}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Recipient
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  placeholder="What is this alias used for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Alias"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
