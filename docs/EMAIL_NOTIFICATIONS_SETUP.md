# Email Notifications Setup Guide

## Overview
Minimal email notifications for staff when forms are submitted. Full details stay in database - staff must log in to view.

---

## When Emails Are Sent

### 1. Financing Application Submitted ✉️
**Trigger:** Customer submits financing application

**Email Contains (Minimal Info):**
- Customer name
- Vehicle of interest
- Submission timestamp
- Link to view full details in dashboard

**NOT Included in Email:**
- Income information
- Employment details
- Credit information
- SSN/SIN
- Bank details

**Why:** Sensitive financial data stays secure in database

---

### 2. Test Drive Request ✉️
**Trigger:** Customer requests test drive

**Email Contains:**
- Customer name
- Vehicle name
- Preferred date/time
- Link to dashboard

---

### 3. Contact Form Submission ✉️
**Trigger:** Customer submits contact form

**Email Contains:**
- Customer name
- Email address
- Subject line
- Link to view full message

---

### 4. Trade-In Appraisal Request ✉️
**Trigger:** Customer requests trade-in appraisal

**Email Contains:**
- Customer name
- Vehicle info (make/model/year)
- Link to dashboard

---

## Setup Instructions

### Step 1: Deploy Email Worker

```bash
cd workers

# Deploy the worker
npx wrangler deploy --config wrangler-email-notification.toml

# Set secrets
npx wrangler secret put ZOHO_EMAIL_USER --config wrangler-email-notification.toml
# Enter: admin@neurodivers.ca

npx wrangler secret put ZOHO_EMAIL_PASSWORD --config wrangler-email-notification.toml
# Enter: your_zoho_password

npx wrangler secret put STAFF_NOTIFICATION_EMAIL --config wrangler-email-notification.toml
# Enter: nick@neurodivers.ca
```

---

### Step 2: Update Frontend to Call Worker

#### Financing Application Form

```typescript
// src/app/financing/apply/page.tsx
async function handleSubmit(formData) {
  // 1. Save to database
  const response = await fetch('/api/financing-applications', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
  
  const { applicationId } = await response.json();
  
  // 2. Send minimal notification to staff
  await fetch('https://email-notification-worker.your-subdomain.workers.dev/notify/financing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: formData.firstName + ' ' + formData.lastName,
      vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      vehicleId: vehicle.id,
      applicationId: applicationId
    })
  });
  
  // 3. Show success message to customer
  setSuccess(true);
}
```

#### Test Drive Form

```typescript
// src/components/TestDriveForm.tsx
async function handleSubmit(formData) {
  // Save to database
  await fetch('/api/test-drives', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
  
  // Send notification
  await fetch('https://email-notification-worker.your-subdomain.workers.dev/notify/test-drive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: formData.name,
      vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      preferredDate: formData.preferredDate
    })
  });
}
```

---

### Step 3: Configure Zoho Mail (If Not Done)

Follow the guide in `ZOHO_MAIL_SETUP.md`

**Quick checklist:**
- ✅ Zoho Mail account created
- ✅ Domain verified
- ✅ MX records configured
- ✅ SPF/DKIM records added
- ✅ Email account created (admin@neurodivers.ca)

---

## Email Templates

### Financing Application Notification

```
Subject: New Financing Application - John Doe

A new financing application has been submitted and is awaiting review.

Customer: John Doe
Vehicle of Interest: 2014 Dodge Grand Caravan SE
Submitted: October 3, 2025 at 7:16 PM

⚠️ Note: This is a minimal notification. Full application details 
(income, employment, credit info, etc.) are stored securely in the database.

[View Full Application Details] (Button)

---
This is an automated notification. Do not reply to this email.
To view full application details, please log in to the admin dashboard.
```

---

## Security Considerations

### ✅ What We Do:
1. **Minimal data in emails** - Only name and vehicle
2. **Sensitive data stays in database** - Income, SSN, credit info never emailed
3. **Secure links** - Dashboard requires authentication
4. **No reply emails** - Prevents accidental data leaks
5. **Encrypted storage** - Database is encrypted at rest

### ❌ What We Don't Do:
1. Never email full application details
2. Never include SSN/SIN in emails
3. Never include bank account numbers
4. Never include credit scores
5. Never include employment verification docs

---

## Testing

### Test Email Notification:

```bash
curl -X POST https://email-notification-worker.your-subdomain.workers.dev/notify/financing \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "vehicleName": "2014 Dodge Grand Caravan",
    "vehicleId": "123",
    "applicationId": "app-123"
  }'
```

**Expected Result:**
- Email received at nick@neurodivers.ca
- Contains minimal info only
- Link to dashboard works
- No sensitive data in email

---

## Monitoring

### Check Email Delivery:

1. **Cloudflare Workers Dashboard**
   - View worker logs
   - Check for errors
   - Monitor request count

2. **Zoho Mail**
   - Check sent emails
   - Verify delivery
   - Monitor bounce rate

3. **Admin Dashboard**
   - Verify applications are saved
   - Check notification timestamps
   - Review staff response times

---

## Troubleshooting

### Emails Not Sending?

1. **Check worker logs:**
   ```bash
   npx wrangler tail email-notification-worker
   ```

2. **Verify secrets are set:**
   ```bash
   npx wrangler secret list --config wrangler-email-notification.toml
   ```

3. **Test Zoho SMTP:**
   - Try sending test email from Zoho webmail
   - Check SMTP settings
   - Verify password is correct

### Emails Going to Spam?

1. Add SPF record (see ZOHO_MAIL_SETUP.md)
2. Add DKIM record
3. Add DMARC record
4. Warm up domain (send gradually)

---

## Cost

**Free!** 🎉

- Cloudflare Workers: 100,000 requests/day free
- Zoho Mail: Free for 5 users
- Total cost: $0/month

---

## Next Steps

1. ✅ Deploy email worker
2. ✅ Set up Zoho Mail
3. ✅ Configure secrets
4. ✅ Update frontend forms
5. ✅ Test notifications
6. ✅ Monitor delivery

---

**Questions?** Contact nick@neurodivers.ca
