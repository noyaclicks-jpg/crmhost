"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"

interface AcceptInviteFormProps {
  token: string
  email: string
  organizationName: string
  role: string
  isLoggedIn: boolean
  userEmail?: string
}

export function AcceptInviteForm({
  token,
  email,
  organizationName,
  role,
  isLoggedIn,
  userEmail,
}: AcceptInviteFormProps) {
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAccept = async () => {
    setLoading(true)
    setError(null)

    try {
      // If user is logged in but email doesn't match
      if (isLoggedIn && userEmail !== email) {
        setError("Please sign out and use the email address this invite was sent to")
        setLoading(false)
        return
      }

      // If user is not logged in, they need to sign up
      if (!isLoggedIn) {
        if (!password || !fullName) {
          setError("Please fill in all fields")
          setLoading(false)
          return
        }

        // Sign up the user
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
          },
        })

        if (signUpError) {
          setError(signUpError.message)
          setLoading(false)
          return
        }

        // Sign in the user immediately after signup
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setError(signInError.message)
          setLoading(false)
          return
        }
      }

      // Get the invite details
      const { data: invite } = await supabase
        .from("invites")
        .select("organization_id, role")
        .eq("token", token)
        .single()

      if (!invite) {
        setError("Invite not found")
        setLoading(false)
        return
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Authentication failed")
        setLoading(false)
        return
      }

      // Update or create profile with the invited organization
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email!,
        full_name: fullName || userEmail || user.email!,
        organization_id: invite.organization_id,
        role: invite.role as "admin" | "member",
      })

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }

      // Mark invite as accepted
      await supabase.from("invites").update({ accepted_at: new Date().toISOString() }).eq("token", token)

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} disabled />
      </div>

      <div className="space-y-2">
        <Label>Organization</Label>
        <Input value={organizationName} disabled />
      </div>

      <div className="space-y-2">
        <Label>Role</Label>
        <Input value={role} disabled />
      </div>

      {!isLoggedIn && (
        <>
          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input
              id="full-name"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={handleAccept} disabled={loading} className="w-full">
        {loading ? "Accepting..." : isLoggedIn ? "Accept Invite" : "Sign Up & Accept Invite"}
      </Button>

      {!isLoggedIn && (
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/auth/login" className="text-primary hover:underline">
            Sign in
          </a>
        </p>
      )}
    </div>
  )
}
