/**
 * Email Notification Worker
 * Sends minimal notifications to staff when forms are submitted
 * Full details remain in database - staff must log in to view
 */

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === 'POST') {
      const url = new URL(request.url);

      // Send financing application notification
      if (url.pathname === '/notify/financing') {
        return await this.notifyFinancingApplication(request, env, corsHeaders);
      }

      // Send test drive notification
      if (url.pathname === '/notify/test-drive') {
        return await this.notifyTestDrive(request, env, corsHeaders);
      }

      // Send contact form notification
      if (url.pathname === '/notify/contact') {
        return await this.notifyContact(request, env, corsHeaders);
      }

      // Send trade-in notification
      if (url.pathname === '/notify/trade-in') {
        return await this.notifyTradeIn(request, env, corsHeaders);
      }
    }

    return new Response('Not Found', { status: 404 });
  },

  async notifyFinancingApplication(request, env, corsHeaders) {
    try {
      const { customerName, vehicleName, vehicleId, applicationId } = await request.json();

      const emailBody = this.buildFinancingNotificationEmail(
        customerName,
        vehicleName,
        vehicleId,
        applicationId,
        env.ADMIN_DASHBOARD_URL || 'https://yourdomain.com'
      );

      await this.sendEmail(
        env.ZOHO_EMAIL_USER,
        env.STAFF_NOTIFICATION_EMAIL || env.ZOHO_EMAIL_USER,
        `New Financing Application - ${customerName}`,
        emailBody,
        env
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error sending financing notification:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  async notifyTestDrive(request, env, corsHeaders) {
    try {
      const { customerName, vehicleName, preferredDate } = await request.json();

      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Test Drive Request</h2>
          
          <p>A new test drive has been requested.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Vehicle:</strong> ${vehicleName}</p>
            <p><strong>Preferred Date:</strong> ${preferredDate}</p>
          </div>
          
          <p>
            <a href="${env.ADMIN_DASHBOARD_URL}/admin/test-drives" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Details in Dashboard
            </a>
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated notification. Do not reply to this email.
          </p>
        </div>
      `;

      await this.sendEmail(
        env.ZOHO_EMAIL_USER,
        env.STAFF_NOTIFICATION_EMAIL || env.ZOHO_EMAIL_USER,
        `New Test Drive Request - ${customerName}`,
        emailBody,
        env
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error sending test drive notification:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  async notifyContact(request, env, corsHeaders) {
    try {
      const { name, email, subject } = await request.json();

      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Contact Form Submission</h2>
          
          <p>A new message has been received through the contact form.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <p>
            <a href="${env.ADMIN_DASHBOARD_URL}/admin/leads" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Full Message
            </a>
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated notification. Do not reply to this email.
          </p>
        </div>
      `;

      await this.sendEmail(
        env.ZOHO_EMAIL_USER,
        env.STAFF_NOTIFICATION_EMAIL || env.ZOHO_EMAIL_USER,
        `New Contact Form - ${name}`,
        emailBody,
        env
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error sending contact notification:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  async notifyTradeIn(request, env, corsHeaders) {
    try {
      const { customerName, vehicleInfo } = await request.json();

      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Trade-In Appraisal Request</h2>
          
          <p>A new trade-in appraisal has been requested.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
          </div>
          
          <p>
            <a href="${env.ADMIN_DASHBOARD_URL}/admin/trade-ins" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Details in Dashboard
            </a>
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated notification. Do not reply to this email.
          </p>
        </div>
      `;

      await this.sendEmail(
        env.ZOHO_EMAIL_USER,
        env.STAFF_NOTIFICATION_EMAIL || env.ZOHO_EMAIL_USER,
        `New Trade-In Request - ${customerName}`,
        emailBody,
        env
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error sending trade-in notification:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  buildFinancingNotificationEmail(customerName, vehicleName, vehicleId, applicationId, dashboardUrl) {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Financing Application</h2>
        
        <p>A new financing application has been submitted and is awaiting review.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Vehicle of Interest:</strong> ${vehicleName}</p>
          <p><strong>Submitted:</strong> ${formattedDate}</p>
        </div>
        
        <p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0;">
          <strong>⚠️ Note:</strong> This is a minimal notification. Full application details (income, employment, credit info, etc.) are stored securely in the database.
        </p>
        
        <p>
          <a href="${dashboardUrl}/admin/financing-applications/${applicationId}" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Full Application Details
          </a>
        </p>
        
        <p style="margin-top: 20px;">
          <a href="${dashboardUrl}/admin/vehicles/${vehicleId}" 
             style="color: #2563eb; text-decoration: none;">
            View Vehicle Details →
          </a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          This is an automated notification. Do not reply to this email.<br>
          To view full application details, please log in to the admin dashboard.
        </p>
      </div>
    `;
  },

  async sendEmail(from, to, subject, htmlBody, env) {
    // Using MailChannels API (free for Cloudflare Workers)
    try {
      const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }]
            }
          ],
          from: {
            email: from,
            name: 'Auto Prets 123'
          },
          subject: subject,
          content: [
            {
              type: 'text/html',
              value: htmlBody
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('MailChannels error:', errorText);
        throw new Error(`MailChannels API error: ${response.status}`);
      }

      console.log('Email sent successfully via MailChannels');
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }
};
