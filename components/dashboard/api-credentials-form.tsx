"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { saveAPICredentials, deleteAPICredentials, testAPIConnection } from "@/lib/actions/api-credentials"
import { useRouter } from 'next/navigation'

interface APICredentialsFormProps {
  service: "netlify" | "forwardemail"
  hasCredentials: boolean
}

export function APICredentialsForm({ service, hasCredentials }: APICredentialsFormProps) {
  const [apiToken, setApiToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  console.log("[v0] Form render:", { service, hasCredentials, apiTokenLength: apiToken.length })

  const handleTest = async () => {
    if (!apiToken) return

    setIsTesting(true)
    setTestResult(null)
    setError(null)

    const result = await testAPIConnection(service, apiToken)
    setTestResult(result)
    setIsTesting(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    setTestResult(null)

    console.log("[v0] Saving credentials:", { service, tokenPresent: !!apiToken })

    const result = await saveAPICredentials(service, apiToken)

    console.log("[v0] Save result:", result)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setApiToken("")
    setIsLoading(false)
  }

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    await deleteAPICredentials(service)

    setIsLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {hasCredentials ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium">API credentials are configured and active</span>
          </div>
          <div className="space-y-2">
            <Label>Update API Token</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showToken ? "text" : "password"}
                  placeholder="Enter new token to update"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button type="button" variant="outline" onClick={handleTest} disabled={isTesting || !apiToken}>
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test"
                )}
              </Button>
              <Button onClick={handleSave} disabled={isLoading || !apiToken}>
                {isLoading ? "Saving..." : "Update"}
              </Button>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isLoading}>
            Remove Credentials
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${service}-token`}>API Token</Label>
            <div className="relative">
              <Input
                id={`${service}-token`}
                type={showToken ? "text" : "password"}
                placeholder="Paste your API token here"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleTest} disabled={isTesting || !apiToken}>
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Credentials"}
            </Button>
          </div>
        </form>
      )}
      {testResult && (
        <div
          className={`flex items-center gap-2 rounded-md border p-3 text-sm ${
            testResult.success ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">
            Credentials saved successfully! They are now available for all team members.
          </span>
        </div>
      )}
    </div>
  )
}
