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
      const { customerName, vehicleName, vehicleId, applicationId, customerEmail, language = 'en' } = await request.json();

      const emailBody = this.buildFinancingNotificationEmail(
        customerName,
        vehicleName,
        vehicleId,
        applicationId,
        env.ADMIN_DASHBOARD_URL || 'https://yourdomain.com'
      );

      // Send notification to staff
      await this.sendEmail(
        env.ZOHO_EMAIL_USER,
        env.STAFF_NOTIFICATION_EMAIL || env.ZOHO_EMAIL_USER,
        `New Financing Application - ${customerName}`,
        emailBody,
        env
      );

      // Send confirmation to customer
      if (customerEmail) {
        const customerEmailBody = this.buildCustomerConfirmationEmail(
          customerName,
          vehicleName,
          language
        );
        
        const translations = {
          en: `Thank you for your financing application`,
          fr: `Merci pour votre demande de financement`,
          es: `Gracias por su solicitud de financiamiento`
        };
        
        await this.sendEmail(
          env.ZOHO_EMAIL_USER,
          customerEmail,
          translations[language] || translations.en,
          customerEmailBody,
          env
        );
      }

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

  buildCustomerConfirmationEmail(customerName, vehicleName, language) {
    const translations = {
      en: {
        title: 'Application Received',
        greeting: `Dear ${customerName},`,
        message: `Thank you for your financing application for the ${vehicleName}.`,
        received: 'We have received your application and our team will review it shortly.',
        contact: 'A member of our team will contact you within 24-48 hours to discuss your financing options.',
        questions: 'If you have any questions in the meantime, please don\'t hesitate to contact us.',
        thanks: 'Thank you for choosing Auto Prets 123!',
        team: 'The Auto Prets 123 Team'
      },
      fr: {
        title: 'Demande reçue',
        greeting: `Cher/Chère ${customerName},`,
        message: `Merci pour votre demande de financement pour le ${vehicleName}.`,
        received: 'Nous avons bien reçu votre demande et notre équipe l\'examinera sous peu.',
        contact: 'Un membre de notre équipe vous contactera dans les 24 à 48 heures pour discuter de vos options de financement.',
        questions: 'Si vous avez des questions entre-temps, n\'hésitez pas à nous contacter.',
        thanks: 'Merci d\'avoir choisi Auto Prets 123!',
        team: 'L\'équipe Auto Prets 123'
      },
      es: {
        title: 'Solicitud recibida',
        greeting: `Estimado/a ${customerName},`,
        message: `Gracias por su solicitud de financiamiento para el ${vehicleName}.`,
        received: 'Hemos recibido su solicitud y nuestro equipo la revisará pronto.',
        contact: 'Un miembro de nuestro equipo se pondrá en contacto con usted dentro de 24-48 horas para discutir sus opciones de financiamiento.',
        questions: 'Si tiene alguna pregunta mientras tanto, no dude en contactarnos.',
        thanks: '¡Gracias por elegir Auto Prets 123!',
        team: 'El equipo de Auto Prets 123'
      }
    };

    const t = translations[language] || translations.en;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${t.title}</h2>
        
        <p>${t.greeting}</p>
        
        <p>${t.message}</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>✅ ${t.received}</strong></p>
        </div>
        
        <p>${t.contact}</p>
        
        <p>${t.questions}</p>
        
        <p style="margin-top: 30px;">${t.thanks}</p>
        
        <p style="color: #6b7280;">
          ${t.team}<br>
          📞 514-962-7070<br>
          📧 info@autoprets123.ca<br>
          🌐 www.autoprets123.ca
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          This is an automated confirmation email.
        </p>
      </div>
    `;
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
          <a href="${dashboardUrl}/admin/leads" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View All Applications in Dashboard
          </a>
        </p>
        
        <p style="margin-top: 20px;">
          <a href="${dashboardUrl}/vehicles/detail?id=${vehicleId}" 
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
    // Using Resend API (free tier: 3,000 emails/month)
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Auto Prets 123 <onboarding@resend.dev>',
          reply_to: from,
          to: [to],
          subject: subject,
          html: htmlBody
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Resend error:', errorData);
        throw new Error(`Resend API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      console.log('Email sent successfully via Resend:', result.id);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }
};
