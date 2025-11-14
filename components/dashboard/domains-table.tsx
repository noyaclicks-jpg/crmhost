"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, CheckCircle2, AlertCircle, Trash2, ExternalLink, Eye } from 'lucide-react'
import { deleteDomain, verifyDomainDNS } from "@/lib/actions/domains"
import { useRouter, useSearchParams } from 'next/navigation'
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
import { DomainDNSDialog } from "./domain-dns-dialog"
import { StatusBadge } from "./status-badge"

interface Domain {
  id: string
  domain_name: string
  netlify_site_id: string | null
  netlify_site_name: string | null
  status: "pending" | "active" | "error"
  dns_configured: boolean
  created_at: string
}

interface DomainsTableProps {
  domains: Domain[]
  canManage: boolean
}

export function DomainsTable({ domains, canManage }: DomainsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isVerifying, setIsVerifying] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("search")?.toLowerCase() || ""

  const filteredDomains = useMemo(() => {
    if (!searchQuery) return domains
    return domains.filter((domain) =>
      domain.domain_name.toLowerCase().includes(searchQuery) ||
      domain.netlify_site_name?.toLowerCase().includes(searchQuery)
    )
  }, [domains, searchQuery])

  const handleDelete = async () => {
    if (!selectedDomain) return

    setIsDeleting(true)
    const result = await deleteDomain(selectedDomain.id)
    setIsDeleting(false)
    
    if (!result.error) {
      setDeleteDialogOpen(false)
      setSelectedDomain(null)
    }
  }

  const handleVerify = async (domainId: string) => {
    setIsVerifying(domainId)
    const result = await verifyDomainDNS(domainId)
    setIsVerifying(null)
    
    if (result.verified) {
      // Show success feedback without refresh
      console.log('[v0] Domain verified successfully')
    }
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Domain</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">DNS</TableHead>
              <TableHead className="font-semibold">Created</TableHead>
              {canManage && <TableHead className="text-right font-semibold">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDomains.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="text-center py-12 text-muted-foreground">
                  {searchQuery ? "No domains found matching your search" : "No domains yet"}
                </TableCell>
              </TableRow>
            ) : (
              filteredDomains.map((domain) => (
                <TableRow key={domain.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{domain.domain_name}</span>
                      {domain.netlify_site_name && (
                        <span className="text-xs text-muted-foreground font-mono">{domain.netlify_site_name}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={domain.status} />
                  </TableCell>
                  <TableCell>
                    {domain.dns_configured ? (
                      <StatusBadge status="active" label="Configured" />
                    ) : (
                      <StatusBadge status="pending" label="Pending" />
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(domain.created_at).toLocaleDateString()}
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
                          <DomainDNSDialog domain={domain} />
                          <DropdownMenuItem onClick={() => handleVerify(domain.id)} disabled={isVerifying === domain.id}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {isVerifying === domain.id ? "Verifying..." : "Verify DNS"}
                          </DropdownMenuItem>
                          {domain.netlify_site_id && (
                            <DropdownMenuItem asChild>
                              <a
                                href={`https://app.netlify.com/sites/${domain.netlify_site_name}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View on Netlify
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedDomain(domain)
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the domain <strong>{selectedDomain?.domain_name}</strong> and all associated
              email aliases. This action cannot be undone.
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
