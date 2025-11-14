// Role-based permission system for the CRM

export type UserRole = "owner" | "admin" | "member"

export const permissions = {
  viewAPICredentials: (role: UserRole) => ["owner", "admin"].includes(role),
  manageAPICredentials: (role: UserRole) => ["owner", "admin"].includes(role),

  accessSettings: (role: UserRole) => ["owner", "admin"].includes(role),

  // Team Management - Owners and admins
  viewTeam: (role: UserRole) => ["owner", "admin"].includes(role),
  inviteMembers: (role: UserRole) => ["owner", "admin"].includes(role),
  removeMembers: (role: UserRole) => ["owner", "admin"].includes(role),
  changeRoles: (role: UserRole) => role === "owner", // Only owners can change roles

  viewDomains: (role: UserRole) => true,
  addDomains: (role: UserRole) => true, // Members can now add domains
  deleteDomains: (role: UserRole) => ["owner", "admin"].includes(role),
  verifyDNS: (role: UserRole) => ["owner", "admin"].includes(role),

  viewEmailAliases: (role: UserRole) => true,
  addEmailAliases: (role: UserRole) => true, // Members can now add email aliases
  editEmailAliases: (role: UserRole) => ["owner", "admin"].includes(role),
  deleteEmailAliases: (role: UserRole) => ["owner", "admin"].includes(role),

  // Audit Logs - All roles can view
  viewAuditLogs: (role: UserRole) => true,
}

export function canUser(role: UserRole, permission: keyof typeof permissions): boolean {
  return permissions[permission](role)
}
