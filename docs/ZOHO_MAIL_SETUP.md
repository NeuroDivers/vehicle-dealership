# Zoho Mail Setup Guide (Free Plan)

## Overview
Zoho Mail offers a **free plan** for up to 5 users with custom domain email. Perfect for your dealership!

---

## Step 1: Sign Up for Zoho Mail Free Plan

1. Go to: https://www.zoho.com/mail/zohomail-pricing.html
2. Click **"Get Started"** under the **Free Plan**
3. Sign up with your email (nick@neurodivers.ca)
4. Verify your email address

**Free Plan Includes:**
- ✅ 5 users
- ✅ 5 GB storage per user
- ✅ Custom domain email
- ✅ Web access
- ✅ Mobile apps
- ✅ 25 MB attachment limit

---

## Step 2: Add Your Domain

1. In Zoho Mail admin panel, go to **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `sltautos.com` or `neurodivers.ca`)
4. Choose verification method:
   - **TXT Record** (recommended)
   - **CNAME Record**
   - **HTML File Upload**

### Domain Verification (TXT Record)

Add this TXT record to your domain's DNS:

```
Type: TXT
Name: @
Value: zoho-verification=zb12345678.zmverify.zoho.com
TTL: 3600
```

**Note:** The actual verification code will be provided by Zoho.

---

## Step 3: Configure MX Records

Add these MX records to your domain DNS:

```
Priority 10: mx.zoho.com
Priority 20: mx2.zoho.com
Priority 50: mx3.zoho.com
```

**Example for Cloudflare DNS:**
```
Type: MX
Name: @
Priority: 10
Value: mx.zoho.com
TTL: Auto

Type: MX
Name: @
Priority: 20
Value: mx2.zoho.com
TTL: Auto

Type: MX
Name: @
Priority: 50
Value: mx3.zoho.com
TTL: Auto
```

---

## Step 4: Add SPF and DKIM Records

### SPF Record (Prevents Spoofing)
```
Type: TXT
Name: @
Value: v=spf1 include:zoho.com ~all
TTL: 3600
```

### DKIM Record (Email Authentication)
1. In Zoho Mail, go to **Email Configuration → DKIM**
2. Copy the DKIM key provided
3. Add to DNS:

```
Type: TXT
Name: zoho._domainkey
Value: [DKIM key from Zoho]
TTL: 3600
```

---

## Step 5: Create Email Accounts

Create these email addresses for your dealership:

1. **info@sltautos.com** - General inquiries
2. **sales@sltautos.com** - Sales team
3. **service@sltautos.com** - Service department
4. **finance@sltautos.com** - Financing inquiries
5. **support@sltautos.com** - Customer support

**Steps:**
1. Go to **Users → Add User**
2. Enter email address and name
3. Set password
4. Assign role (Admin or User)

---

## Step 6: Configure Email Forwarding

Forward all emails to a central inbox:

1. Go to **Email Forwarding**
2. Set up forwarding rules:
   - `info@sltautos.com` → Forward to sales team
   - `sales@sltautos.com` → Forward to CRM
   - `service@sltautos.com` → Forward to service manager

---

## Step 7: Integrate with Your Website

### Contact Form Integration

```javascript
// pages/api/contact.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, email, phone, message } = req.body;
    
    // Send email via Zoho SMTP
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      auth: {
        user: 'info@sltautos.com',
        pass: process.env.ZOHO_EMAIL_PASSWORD
      }
    });
    
    await transporter.sendMail({
      from: 'info@sltautos.com',
      to: 'sales@sltautos.com',
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });
    
    res.status(200).json({ success: true });
  }
}
```

### Environment Variables

Add to `.env.local`:
```
ZOHO_EMAIL_USER=info@sltautos.com
ZOHO_EMAIL_PASSWORD=your_password_here
ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_SMTP_PORT=465
```

---

## Step 8: Set Up Auto-Responders

1. Go to **Settings → Auto Responder**
2. Create auto-responses for:
   - **Out of Office**
   - **New Inquiry Confirmation**
   - **Business Hours Response**

**Example Auto-Response:**
```
Subject: Thank you for contacting SLT Autos

Dear Customer,

Thank you for reaching out to SLT Autos. We have received your inquiry and will respond within 24 hours.

In the meantime, feel free to browse our inventory at www.sltautos.com

Best regards,
SLT Autos Team
514-962-7070
```

---

## Step 9: Mobile App Setup

1. Download **Zoho Mail** app:
   - iOS: App Store
   - Android: Google Play

2. Sign in with your credentials
3. Enable push notifications
4. Configure signature

---

## Step 10: Email Signature

Create professional email signatures:

```html
<div style="font-family: Arial, sans-serif;">
  <p><strong>Your Name</strong><br>
  Sales Manager<br>
  SLT Autos</p>
  
  <p>
  📞 514-962-7070<br>
  📧 sales@sltautos.com<br>
  🌐 www.sltautos.com<br>
  📍 10559 AV. DRAPEAU, MONTREAL, QC, H1H 3J4
  </p>
  
  <p style="color: #666; font-size: 12px;">
  Financing Available | Trade-Ins Welcome | Warranty Options
  </p>
</div>
```

---

## Alternative: Zoho API Integration

For automated email sending from your app:

```javascript
// workers/email-worker.js
export default {
  async sendEmail(to, subject, body, env) {
    const response = await fetch('https://mail.zoho.com/api/accounts/[ACCOUNT_ID]/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${env.ZOHO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fromAddress: 'info@sltautos.com',
        toAddress: to,
        subject: subject,
        content: body,
        mailFormat: 'html'
      })
    });
    
    return await response.json();
  }
};
```

---

## Cost Comparison

### Zoho Mail Free Plan
- **Cost**: $0/month
- **Users**: Up to 5
- **Storage**: 5 GB per user
- **Features**: Full email functionality

### Paid Plans (if you need more)
- **Mail Lite**: $1/user/month (5 GB)
- **Mail Premium**: $4/user/month (50 GB)
- **Workplace**: $3/user/month (includes Docs, CRM, etc.)

---

## Troubleshooting

### Emails Not Sending
1. Check MX records are correct
2. Verify SPF/DKIM records
3. Check spam folder
4. Ensure SMTP credentials are correct

### Emails Going to Spam
1. Add DMARC record:
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:postmaster@sltautos.com
```

2. Warm up your domain (send gradually increasing emails)
3. Avoid spam trigger words
4. Include unsubscribe link

---

## Next Steps

1. ✅ Sign up for Zoho Mail Free
2. ✅ Add and verify domain
3. ✅ Configure MX, SPF, DKIM records
4. ✅ Create email accounts
5. ✅ Set up email forwarding
6. ✅ Integrate with website
7. ✅ Configure auto-responders
8. ✅ Set up mobile apps

---

## Support

- **Zoho Support**: https://help.zoho.com/portal/en/home
- **Community**: https://help.zoho.com/portal/en/community/mail
- **Documentation**: https://www.zoho.com/mail/help/

---

**Questions?** Contact nick@neurodivers.ca
