# Resend Email Setup (Easiest Option)

## Overview
Resend is the easiest email service to set up. Free tier includes 3,000 emails/month.

---

## Step 1: Sign Up for Resend

1. Go to: https://resend.com
2. Sign up with your email
3. Verify your email address

---

## Step 2: Get API Key

1. Go to: https://resend.com/api-keys
2. Click "Create API Key"
3. Name it: "Auto Prets 123 Notifications"
4. Copy the API key (starts with `re_`)

---

## Step 3: Add API Key to Worker

```bash
npx wrangler secret put RESEND_API_KEY --config workers/wrangler-email-notification.toml
```

Paste your Resend API key when prompted.

---

## Step 4: Update Worker Code

The worker code needs to be updated to use Resend instead of MailChannels.

I can do this for you - just let me know!

---

## Step 5: Verify Domain (Optional)

For better deliverability, verify your domain:

1. Go to: https://resend.com/domains
2. Click "Add Domain"
3. Enter: `neurodivers.ca` or `autopret123.ca`
4. Add the DNS records shown (SPF, DKIM, DMARC)

**Without domain verification:**
- Emails sent from: `onboarding@resend.dev`
- Still works, but looks less professional

**With domain verification:**
- Emails sent from: `admin@neurodivers.ca`
- Better deliverability
- More professional

---

## Step 6: Test Email

```powershell
Invoke-RestMethod -Uri "https://email-notification-worker.nick-damato0011527.workers.dev/notify/financing" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"customerName":"Test Customer","vehicleName":"2014 Dodge Grand Caravan","vehicleId":"123","applicationId":"test-123"}'
```

---

## Pricing

### Free Tier
- ✅ 3,000 emails/month
- ✅ 100 emails/day
- ✅ All features included

### Paid Plans (if you need more)
- **Pro**: $20/month - 50,000 emails
- **Enterprise**: Custom pricing

---

## Comparison

| Feature | MailChannels | Resend |
|---------|--------------|--------|
| **Cost** | Free (unlimited) | Free (3,000/month) |
| **Setup Time** | 30-60 mins (DNS) | 5 mins (API key) |
| **DNS Required** | Yes | No (optional) |
| **Deliverability** | Good | Excellent |
| **Dashboard** | No | Yes |
| **Analytics** | No | Yes |

---

## Recommendation

**Use Resend if:**
- ✅ You want quick setup (5 minutes)
- ✅ You want email analytics
- ✅ You send < 3,000 emails/month
- ✅ You want a dashboard

**Use MailChannels if:**
- ✅ You want completely free (unlimited)
- ✅ You don't mind DNS setup
- ✅ You send > 3,000 emails/month

---

**Ready to switch to Resend?** Let me know and I'll update the worker code!
