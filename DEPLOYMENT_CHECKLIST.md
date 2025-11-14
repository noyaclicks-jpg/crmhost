# 📋 Deployment Checklist - Hosting CRM

Use this checklist to deploy your completed Hosting CRM to production.

## 🏁 Pre-Deployment (Development)

### 1. Code Integration ✓
- [ ] Copied all new files from `outputs/lib/` to project
- [ ] Copied `outputs/hooks/` to project
- [ ] Updated existing API client files
- [ ] Updated `global-search.tsx` component
- [ ] Updated `workers/` directory files

### 2. Database Setup ✓
- [ ] Ran `018_create_dns_health_table.sql` in Supabase
- [ ] Ran `019_add_search_indexes.sql` in Supabase
- [ ] Verified no SQL errors
- [ ] Checked that `dns_health` table exists
- [ ] Verified search indexes created

### 3. Environment Variables (Development) ✓
- [ ] Added `NETLIFY_API_TOKEN` to `.env.local`
- [ ] Added `FORWARDEMAIL_API_TOKEN` to `.env.local`
- [ ] Added `ZOHO_IMAP_USER` to `.env.local`
- [ ] Added `ZOHO_IMAP_PASSWORD` to `.env.local`
- [ ] Verified `SUPABASE_*` vars are set
- [ ] Verified `NEXT_PUBLIC_APP_URL` is set

### 4. Local Testing ✓
- [ ] Run `npm install` (no errors)
- [ ] Run `npm run dev` (app starts)
- [ ] Login works
- [ ] Can add a domain
- [ ] Can create email alias
- [ ] Global search returns results
- [ ] All pages load without errors

### 5. Worker Testing (Local) ✓
- [ ] `cd workers && npm install`
- [ ] `npm run test:imap` connects successfully
- [ ] `npm run sync` runs without errors
- [ ] Check Supabase - emails inserted
- [ ] `npm run monitor` checks domains
- [ ] Check Supabase - dns_health records created

---

## 🚀 Production Deployment

### 1. Choose Deployment Platform
- [ ] Vercel (recommended for Next.js)
- [ ] Netlify
- [ ] AWS Amplify
- [ ] Self-hosted VPS
- [ ] Docker container

### 2. Environment Variables (Production) ✓

#### Core Variables
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_APP_URL` (your production domain)

#### API Integration
- [ ] `NETLIFY_API_TOKEN` (from production account)
- [ ] `FORWARDEMAIL_API_TOKEN` (from production account)
- [ ] `ZOHO_IMAP_USER` (production email)
- [ ] `ZOHO_IMAP_PASSWORD` (app-specific password)

#### Optional
- [ ] `SENTRY_DSN` (for error tracking)
- [ ] `CRON_SECRET` (for Vercel cron authentication)

### 3. Database Configuration ✓
- [ ] Supabase project set to production tier
- [ ] Connection pooling enabled
- [ ] Database backups enabled
- [ ] RLS policies verified
- [ ] All 19 migrations applied

### 4. Build & Deploy ✓
- [ ] Run `npm run build` locally (verify no errors)
- [ ] Fix any build errors
- [ ] Push to Git repository
- [ ] Connect repo to deployment platform
- [ ] Trigger deployment
- [ ] Wait for deployment success
- [ ] Visit production URL

### 5. Post-Deployment Verification ✓
- [ ] Production site loads
- [ ] Can access login page
- [ ] Can sign up (create test account)
- [ ] Dashboard displays correctly
- [ ] Can add a domain
- [ ] Can create email alias
- [ ] Global search works
- [ ] Check Supabase tables for data

---

## 🔄 Worker Deployment

### Option A: Vercel Cron (Recommended for Vercel)

#### Setup
- [ ] Create `app/api/cron/imap-sync/route.ts`
- [ ] Create `app/api/cron/dns-monitor/route.ts`
- [ ] Create `vercel.json` with cron config
- [ ] Add `CRON_SECRET` to Vercel env vars
- [ ] Deploy and verify cron logs

#### Verification
- [ ] Go to Vercel Dashboard → Deployments → Functions
- [ ] Check cron job execution logs
- [ ] Verify emails syncing to database
- [ ] Verify DNS health checks running

### Option B: Linux Cron (VPS/Self-Hosted)

#### Setup
- [ ] SSH into server
- [ ] Install Node.js and npm
- [ ] Clone repository
- [ ] `cd workers && npm install`
- [ ] Create `/var/log/imap-sync.log`
- [ ] Create `/var/log/dns-monitor.log`
- [ ] Edit crontab: `crontab -e`
- [ ] Add cron entries:
  ```
  */5 * * * * cd /path/to/workers && npm run sync >> /var/log/imap-sync.log 2>&1
  0 * * * * cd /path/to/workers && npm run monitor >> /var/log/dns-monitor.log 2>&1
  ```
- [ ] Save and exit

#### Verification
- [ ] Wait 5 minutes
- [ ] Check `/var/log/imap-sync.log` for output
- [ ] Wait 1 hour
- [ ] Check `/var/log/dns-monitor.log` for output
- [ ] Verify database records created

### Option C: Docker Container

#### Setup
- [ ] Create Dockerfile for workers
- [ ] Build Docker image
- [ ] Deploy to container service
- [ ] Set up cron in container or use orchestrator scheduler

---

## 🔒 Security Checklist

### Authentication
- [ ] Email verification enabled
- [ ] Password strength requirements set
- [ ] Session timeout configured
- [ ] HTTPS enabled (SSL certificate)

### API Keys
- [ ] All API keys use environment variables
- [ ] No API keys in code or Git history
- [ ] API keys have minimum required permissions
- [ ] Different keys for dev/prod

### Database
- [ ] RLS enabled on all tables
- [ ] Service role key only used server-side
- [ ] Database backups enabled
- [ ] Connection strings secured

### Application
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies up to date (no vulnerabilities)

---

## 📊 Monitoring Setup

### Error Tracking
- [ ] Sentry or similar service integrated
- [ ] Error notifications configured
- [ ] Error grouping set up
- [ ] Source maps uploaded

### Application Monitoring
- [ ] Uptime monitoring (Pingdom, UptimeRobot)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Database monitoring (Supabase dashboard)

### Log Monitoring
- [ ] Worker logs monitored (Papertrail, Logtail)
- [ ] Application logs centralized
- [ ] Alerts for critical errors
- [ ] Log retention policy set

### Health Checks
- [ ] `/api/health` endpoint created
- [ ] Database connectivity check
- [ ] External API health checks
- [ ] Automated alerts for failures

---

## 🎯 Performance Optimization

### Frontend
- [ ] Images optimized (Next.js Image)
- [ ] Fonts optimized
- [ ] Code splitting enabled
- [ ] Lazy loading for heavy components

### Database
- [ ] Appropriate indexes created
- [ ] Query performance optimized
- [ ] Connection pooling enabled
- [ ] Slow query logging enabled

### API
- [ ] API responses cached where appropriate
- [ ] Rate limiting implemented
- [ ] CDN configured for static assets

---

## 👥 Team Onboarding

### Access Setup
- [ ] Create production team accounts
- [ ] Assign appropriate roles (owner/admin/member)
- [ ] Test permission system
- [ ] Document access procedures

### Documentation
- [ ] User guide created
- [ ] Admin guide created
- [ ] Troubleshooting guide available
- [ ] API documentation (if needed)

### Training
- [ ] Demo the system to team
- [ ] Walk through key features
- [ ] Explain domain/alias workflows
- [ ] Show how to check logs/health

---

## 🧪 Post-Deployment Testing

### Smoke Tests
- [ ] Can login with production account
- [ ] Dashboard loads all stats
- [ ] Can add real domain
- [ ] Domain appears in Netlify
- [ ] Domain appears in ForwardEmail
- [ ] Can create email alias
- [ ] Alias forwarding works (send test email)
- [ ] Email appears in inbox (after IMAP sync)
- [ ] Search finds the email
- [ ] Can invite team member
- [ ] Invited member can join

### Integration Tests
- [ ] Netlify DNS API working
- [ ] ForwardEmail API working
- [ ] Zoho IMAP syncing
- [ ] DNS monitoring running
- [ ] Audit logs recording actions

### Load Testing (Optional)
- [ ] Test with 100+ domains
- [ ] Test with 1000+ emails
- [ ] Test concurrent user actions
- [ ] Verify performance acceptable

---

## 📈 Monitoring First Week

### Daily Checks
- [ ] Check error tracking dashboard
- [ ] Review worker logs
- [ ] Check database size/usage
- [ ] Verify IMAP sync running
- [ ] Verify DNS monitoring running
- [ ] Review API usage/limits

### Weekly Review
- [ ] Review all errors
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] Review user feedback
- [ ] Plan improvements

---

## 🎉 Launch Checklist

### Final Steps
- [ ] All above checklists complete
- [ ] Production tested thoroughly
- [ ] Team trained and ready
- [ ] Documentation complete
- [ ] Monitoring active
- [ ] Backup strategy confirmed

### Announcement
- [ ] Notify team of launch
- [ ] Provide login instructions
- [ ] Share documentation links
- [ ] Set up support channel
- [ ] Celebrate! 🎊

---

## 🆘 Rollback Plan

### If Something Goes Wrong
1. [ ] Check error tracking for issues
2. [ ] Review recent changes
3. [ ] Check environment variables
4. [ ] Verify database migrations
5. [ ] Check API key validity
6. [ ] Review worker logs
7. [ ] If needed: revert to previous deployment
8. [ ] Document issue and solution

---

## 📞 Support Contacts

- **Supabase Support**: dashboard.supabase.com/support
- **Netlify Support**: support.netlify.com
- **ForwardEmail Support**: forwardemail.net/support
- **Vercel Support**: vercel.com/support

---

## ✅ Final Sign-Off

Date: _______________
Deployed by: _______________
Version: _______________
Status: ⬜ Dev ⬜ Staging ⬜ Production

**All checks passed**: ⬜ Yes ⬜ No

Notes:
_______________________________________
_______________________________________
_______________________________________

---

**🚀 Your Hosting CRM is now in production!**

Good luck with your launch! 🎉
