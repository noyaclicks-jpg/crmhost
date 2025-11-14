"use client"

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
import { UserPlus, Copy, Check, RefreshCw } from 'lucide-react'
import { createTeamMember } from "@/lib/actions/team"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'

export function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"admin" | "member">("member")
  const [loading, setLoading] = useState(false)
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [copiedInstructions, setCopiedInstructions] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const generatePassword = () => {
    // Generate a secure random password
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%"
    let pass = ""
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(pass)
  }

  const handleCreate = async () => {
    if (!fullName || !email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    const result = await createTeamMember(fullName, email, password, role)
    setLoading(false)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "User created!",
        description: result.message,
      })
      if (result.credentials) {
        setCredentials(result.credentials)
      }
    }
  }

  const handleCopy = (text: string, type: "email" | "password") => {
    navigator.clipboard.writeText(text)
    if (type === "email") {
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    } else {
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    }
    toast({
      title: "Copied!",
      description: `${type === "email" ? "Email" : "Password"} copied to clipboard`,
    })
  }

  const handleCopyInstructions = () => {
    if (!credentials) return

    const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/auth/login` : "/auth/login"

    const instructions = `Welcome to the team!

Here are your login credentials:

Login URL: ${loginUrl}
Email: ${credentials.email}
Temporary Password: ${credentials.password}

Instructions:
1. Visit the login URL above
2. Enter your email and password
3. You'll be redirected to the dashboard
4. Please change your password after first login for security

If you have any issues, please contact your administrator.`

    navigator.clipboard.writeText(instructions)
    setCopiedInstructions(true)
    setTimeout(() => setCopiedInstructions(false), 2000)
    toast({
      title: "Copied!",
      description: "Login instructions copied to clipboard",
    })
  }

  const handleClose = () => {
    setOpen(false)
    setFullName("")
    setEmail("")
    setPassword("")
    setRole("member")
    setCredentials(null)
    setCopiedEmail(false)
    setCopiedPassword(false)
    setCopiedInstructions(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Team Member</DialogTitle>
          <DialogDescription>Create a new user account directly. No invite links needed.</DialogDescription>
        </DialogHeader>

        {!credentials ? (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">Temporary Password</Label>
                <div className="flex gap-2">
                  <Input
                    id="user-password"
                    type="text"
                    placeholder="Generate or enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={generatePassword}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum 6 characters. User can change it after first login.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-role">Role</Label>
                <Select value={role} onValueChange={(value: "admin" | "member") => setRole(value)}>
                  <SelectTrigger id="user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member - Can add domains and emails</SelectItem>
                    <SelectItem value="admin">Admin - Full access including settings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-muted p-4 space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium">Login Credentials</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Share these credentials with the new user. They can log in immediately.
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Login URL</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 rounded bg-background px-3 py-2 text-sm font-mono break-all">
                      {typeof window !== "undefined" ? `${window.location.origin}/auth/login` : "/auth/login"}
                    </code>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 rounded bg-background px-3 py-2 text-sm font-mono">
                        {credentials.email}
                      </code>
                      <Button size="sm" variant="outline" onClick={() => handleCopy(credentials.email, "email")}>
                        {copiedEmail ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Temporary Password</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 rounded bg-background px-3 py-2 text-sm font-mono">
                        {credentials.password}
                      </code>
                      <Button size="sm" variant="outline" onClick={() => handleCopy(credentials.password, "password")}>
                        {copiedPassword ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button variant="secondary" className="w-full" onClick={handleCopyInstructions}>
                    {copiedInstructions ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Full Instructions
                      </>
                    )}
                  </Button>
                </div>

                <div className="pt-2 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Important:</p>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>User can log in at /auth/login</li>
                    <li>They should change their password after first login</li>
                    <li>Save these credentials securely - they won't be shown again</li>
                  </ul>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
