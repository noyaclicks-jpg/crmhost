"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { FileText, Copy, CheckCircle2, Server } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { getDomainDNSInfo } from "@/lib/actions/domains"
import { toast } from "sonner"

interface Domain {
  id: string
  domain_name: string
  netlify_site_id: string | null
  netlify_site_name: string | null
  nameservers?: string[] | null
}

export function DomainDNSDialog({ domain }: { domain: Domain }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [fullDomain, setFullDomain] = useState<Domain>(domain)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && !fullDomain.nameservers) {
      setLoading(true)
      getDomainDNSInfo(domain.id)
        .then((result) => {
          if (result.data) {
            setFullDomain(result.data)
          } else if (result.error) {
            toast.error(result.error)
          }
        })
        .finally(() => setLoading(false))
    }
  }, [open, domain.id, fullDomain.nameservers])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const netlifyRecords = [
    {
      type: "A",
      name: "@",
      value: "75.2.60.5",
      description: "Points your root domain to Netlify",
    },
    {
      type: "CNAME",
      name: "www",
      value: fullDomain.netlify_site_name ? `${fullDomain.netlify_site_name}.netlify.app` : "your-site.netlify.app",
      description: "Points www subdomain to your Netlify site",
    },
  ]

  const forwardEmailRecords = [
    {
      type: "MX",
      name: "@",
      value: "mx1.forwardemail.net",
      priority: "10",
      description: "Primary mail server",
    },
    {
      type: "MX",
      name: "@",
      value: "mx2.forwardemail.net",
      priority: "20",
      description: "Backup mail server",
    },
    {
      type: "TXT",
      name: "@",
      value: `forward-email=${domain.domain_name}`,
      description: "ForwardEmail verification",
    },
  ]

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault()
          setOpen(true)
        }}
      >
        <FileText className="mr-2 h-4 w-4" />
        View DNS Records
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>DNS Configuration for {domain.domain_name}</DialogTitle>
            <DialogDescription>Add these DNS records to your domain registrar to complete setup</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Loading DNS information...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {fullDomain.nameservers && fullDomain.nameservers.length > 0 && (
                <div className="bg-primary/10 border-primary/20 border-2 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Server className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Netlify Nameservers</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Point your domain to these nameservers at your domain registrar (recommended method)
                        </p>
                      </div>
                      <div className="space-y-2">
                        {fullDomain.nameservers.map((ns, index) => (
                          <div key={index} className="flex items-center justify-between bg-background rounded p-3">
                            <code className="text-sm font-mono">{ns}</code>
                            <Button size="icon" variant="ghost" onClick={() => copyToClipboard(ns, `ns-${index}`)}>
                              {copied === `ns-${index}` ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allNS = fullDomain.nameservers?.join("\n") || ""
                          copyToClipboard(allNS, "all-ns")
                          toast.success("All nameservers copied to clipboard")
                        }}
                        className="w-full"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy All Nameservers
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">Choose one option:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>
                    <strong>Option 1 (Recommended):</strong> Use Netlify nameservers above at your domain registrar
                  </li>
                  <li>
                    <strong>Option 2:</strong> Manually add the DNS records below at your current DNS provider
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Netlify DNS Records (Manual Option)</h3>
                <div className="space-y-3">
                  {netlifyRecords.map((record, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-semibold bg-muted px-2 py-1 rounded">
                              {record.type}
                            </span>
                            <span className="text-sm text-muted-foreground">{record.description}</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-16">Name:</span>
                              <code className="text-xs font-mono">{record.name}</code>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-16">Value:</span>
                              <code className="text-xs font-mono">{record.value}</code>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(record.value, `netlify-${index}`)}
                        >
                          {copied === `netlify-${index}` ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">ForwardEmail DNS Records</h3>
                <div className="space-y-3">
                  {forwardEmailRecords.map((record, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-semibold bg-muted px-2 py-1 rounded">
                              {record.type}
                            </span>
                            <span className="text-sm text-muted-foreground">{record.description}</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-16">Name:</span>
                              <code className="text-xs font-mono">{record.name}</code>
                            </div>
                            {record.priority && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-16">Priority:</span>
                                <code className="text-xs font-mono">{record.priority}</code>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-16">Value:</span>
                              <code className="text-xs font-mono">{record.value}</code>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(record.value, `forward-${index}`)}
                        >
                          {copied === `forward-${index}` ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  After configuring DNS (either nameservers or manual records), click "Verify DNS" to check if they're
                  properly configured. DNS propagation can take up to 48 hours.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
