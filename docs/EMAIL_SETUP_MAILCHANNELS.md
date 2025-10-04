# MailChannels Email Setup (Free for Cloudflare Workers)

## Overview
MailChannels is completely free for Cloudflare Workers but requires DNS verification.

---

## Step 1: Add DNS Records

Add these TXT records to your domain DNS (in Cloudflare):

### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 a mx include:relay.mailchannels.net ~all
TTL: Auto
```

### Domain Lockdown (Security)
This prevents others from using your domain with MailChannels:

```
Type: TXT
Name: _mailchannels
Value: v=mc1 cfid=nick-damato0011527.workers.dev
TTL: Auto
```

---

## Step 2: Add DKIM Record (Optional but Recommended)

1. Generate DKIM keys at: https://dkimcore.org/tools/keys.html
2. Add the public key to DNS:

```
Type: TXT
Name: mailchannels._domainkey
Value: v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY_HERE
TTL: Auto
```

---

## Step 3: Wait for DNS Propagation

DNS changes can take 5-60 minutes to propagate. Check status:
```bash
nslookup -type=txt neurodivers.ca
nslookup -type=txt _mailchannels.neurodivers.ca
```

---

## Step 4: Test Email Sending

Once DNS is set up, test the worker:

```powershell
Invoke-RestMethod -Uri "https://email-notification-worker.nick-damato0011527.workers.dev/notify/financing" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"customerName":"Test Customer","vehicleName":"2014 Dodge Grand Caravan","vehicleId":"123","applicationId":"test-123"}'
```

You should receive an email at nick@neurodivers.ca!

---

## Alternative: Use Resend (Easier Setup)

If you want faster setup without DNS configuration, use Resend instead:

1. Sign up at: https://resend.com (free tier: 3,000 emails/month)
2. Get API key
3. Update worker to use Resend API

See: EMAIL_SETUP_RESEND.md

---

## Troubleshooting

### Error: 401 Unauthorized
- DNS records not set up yet
- Wait for DNS propagation (5-60 minutes)
- Verify SPF record is correct

### Emails Going to Spam
- Add DKIM record
- Add DMARC record
- Warm up domain (send gradually)

---

## Cost

**FREE!** ✅
- No signup required
- No API key needed
- Unlimited emails
- Just need DNS records

---

**Next:** Add the DNS records in Cloudflare, wait 10-30 minutes, then test again!
