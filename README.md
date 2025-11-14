# Hosting CRM

A modern CRM dashboard for managing domains, DNS records, email routing, and inbox - all in one place.

## 🚀 Features

### Domain Management (Netlify)
- Add and manage domains
- Automatic DNS zone creation
- DNS record management (A, AAAA, TXT, MX, CNAME)
- Search and filter domains
- Domain verification status

### Email Routing (ForwardEmail)
- Create email aliases
- Forward emails to any destination
- Manage routing rules
- Sync with ForwardEmail API

### Email Inbox (Zoho - In Progress)
- View all forwarded emails in one inbox
- Gmail-style interface
- Email threading
- Search and filters
- Mark as read/unread
- Email labels

### User Management
- Multi-tenant organization support
- Role-based access control (Owner, Admin, Member)
- Team invitations
- Google OAuth + Email/Password authentication

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- ShadCN UI

**Backend:**
- Next.js Server Actions
- Supabase (PostgreSQL + Auth)
- Row Level Security (RLS)

**Integrations:**
- Netlify API (DNS management)
- ForwardEmail API (Email routing)
- Zoho IMAP (Email inbox - coming soon)

---

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Netlify account + API token
- ForwardEmail account + API key

### 1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd hosting-crm
\`\`\`

### 2. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Set up environment variables
Create a `.env.local` file:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Auth Redirect (for development)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 4. Set up database
Run the SQL migrations in order:

\`\`\`bash
# In Supabase SQL Editor, run each script:
scripts/001_create_schema.sql
scripts/002_enable_rls.sql
scripts/003_create_profile_trigger.sql
# ... and all other scripts in numeric order
\`\`\`

### 5. Run development server
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 API Configuration

After signing up, navigate to **Settings** to configure API credentials:

1. **Netlify API Token**
   - Go to https://app.netlify.com/user/applications
   - Create a new personal access token
   - Paste it in the CRM settings

2. **ForwardEmail API Key**
   - Go to https://forwardemail.net/en/my-account/security
   - Generate an API key
   - Paste it in the CRM settings

**Note:** Only organization Owners and Admins can manage API credentials. All team members can use them.

---

## 📖 Usage

### Adding a Domain
1. Go to **Domains** page
2. Click **Add Domain**
3. Enter domain name (without www or http://)
4. System will create DNS zone in Netlify
5. Configure nameservers at your registrar

### Creating Email Aliases
1. Go to **Email Aliases** page
2. Click **Add Alias**
3. Select domain
4. Enter alias (e.g., `contact@yourdomain.com`)
5. Add destination email addresses
6. System will create forwarding route in ForwardEmail

### Managing Team
1. Go to **Team** page
2. Click **Invite User**
3. Enter email address and select role
4. User receives invite link via system (copy and share)
5. After accepting invite, user can access the dashboard

---

## 🏗️ Architecture

\`\`\`
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└────────┬────────┘
         │
         ├──────────┐
         │          │
┌────────▼────────┐ │
│  Server Actions │ │
│  (Backend API)  │ │
└────────┬────────┘ │
         │          │
    ┌────▼──────────▼─────┐
    │   Supabase (DB)     │
    │   PostgreSQL + RLS  │
    └─────────────────────┘
    
    External APIs:
    ├── Netlify DNS API
    ├── ForwardEmail API
    └── Zoho IMAP (coming soon)
\`\`\`

---

## 🔒 Security

- **Row Level Security (RLS)**: All database tables use RLS policies
- **Role-based Access**: Owner, Admin, Member roles with different permissions
- **API Credentials**: Stored encrypted in database, only accessible by owners/admins
- **Session Management**: Secure cookie-based sessions via Supabase Auth

---

## 🐛 Troubleshooting

### DNS Records Not Showing
- Ensure Netlify API token has DNS management permissions
- Check that domain is verified in Netlify
- Wait for DNS propagation (can take up to 48 hours)

### Email Aliases Not Working
- Verify ForwardEmail API key is valid
- Ensure domain is verified in ForwardEmail
- Check MX records are correctly configured

### Login Issues
- Clear browser cookies and try again
- Check Supabase auth configuration
- Verify redirect URLs are correct

---

## 📚 API Documentation

### Server Actions

**Domains:**
- `createDomain(data)` - Create new domain
- `getDomains(orgId)` - List all domains
- `updateDomain(id, data)` - Update domain
- `deleteDomain(id)` - Delete domain

**DNS Records:**
- `createDNSRecord(domainId, data)` - Add DNS record
- `updateDNSRecord(id, data)` - Update DNS record
- `deleteDNSRecord(id)` - Delete DNS record

**Email Aliases:**
- `createEmailAlias(data)` - Create email alias
- `getEmailAliases(orgId)` - List aliases
- `updateEmailAlias(id, data)` - Update alias
- `deleteEmailAlias(id)` - Delete alias

**Users:**
- `inviteUser(email, role)` - Invite team member
- `updateUserRole(userId, role)` - Change user role
- `removeTeamMember(userId)` - Remove from team

---

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Hostinger / VPS
1. Build the app: `npm run build`
2. Upload `dist/` folder
3. Set up Node.js environment
4. Configure reverse proxy (nginx)
5. Run: `npm start`

---

## 📝 License

MIT License - See LICENSE file

---

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

## 📧 Support

For issues or questions, open a GitHub issue or contact support.

---

**Built with ❤️ using Next.js, Supabase, and modern web technologies**
