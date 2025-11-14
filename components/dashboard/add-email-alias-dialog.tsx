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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X } from 'lucide-react'
import { createEmailAlias } from "@/lib/actions/email-aliases"
import { useRouter } from 'next/navigation'

interface Domain {
  id: string
  domain_name: string
  status: string
}

interface AddEmailAliasDialogProps {
  domains: Domain[]
}

export function AddEmailAliasDialog({ domains }: AddEmailAliasDialogProps) {
  const [open, setOpen] = useState(false)
  const [domainId, setDomainId] = useState("")
  const [aliasName, setAliasName] = useState("")
  const [forwardTo, setForwardTo] = useState<string[]>([""])
  const [description, setDescription] = useState("")
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

    const result = await createEmailAlias(domainId, aliasName, validRecipients, description || undefined)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setOpen(false)
    setDomainId("")
    setAliasName("")
    setForwardTo([""])
    setDescription("")
    setIsLoading(false)
  }

  const selectedDomain = domains.find((d) => d.id === domainId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Email Alias
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Email Alias</DialogTitle>
            <DialogDescription>
              Set up email forwarding for a domain. All emails sent to this alias will be forwarded to the specified
              addresses.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Select value={domainId} onValueChange={setDomainId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a domain" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((domain) => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {domain.domain_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alias-name">Alias Name</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="alias-name"
                  placeholder="contact"
                  value={aliasName}
                  onChange={(e) => setAliasName(e.target.value)}
                  required
                />
                <span className="text-muted-foreground">@</span>
                <span className="text-sm font-mono">{selectedDomain?.domain_name || "domain.com"}</span>
              </div>
              <p className="text-xs text-muted-foreground">Common examples: contact, support, info, admin</p>
            </div>

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
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
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
              {isLoading ? "Creating..." : "Create Alias"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
