import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = `Innovate IQ LLC <noreply@innovateiqllc.com>`
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'admin@innovateiqllc.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function emailHtml(title: string, body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F4F6F9;font-family:Inter,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #DDE3EB">
<tr><td style="background:#0B1F3A;padding:24px 32px;border-radius:12px 12px 0 0">
  <span style="color:#fff;font-size:18px;font-weight:700">Innovate IQ LLC</span>
</td></tr>
<tr><td style="padding:32px">
  <h2 style="color:#0B1F3A;font-size:20px;font-weight:600;margin:0 0 16px">${title}</h2>
  ${body}
</td></tr>
<tr><td style="padding:16px 32px;background:#F4F6F9;border-top:1px solid #DDE3EB;border-radius:0 0 12px 12px">
  <p style="color:#64748B;font-size:12px;margin:0">Innovate IQ LLC &middot; Contract Staffing &amp; Placement</p>
</td></tr>
</table></td></tr></table></body></html>`
}

const p = (t: string) => `<p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 12px">${t}</p>`
const btn = (t: string, url: string) => `<a href="${url}" style="display:inline-block;background:#1B6FE8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;margin:16px 0">${t}</a>`

export async function sendContactEmail(data: { name: string; email: string; subject?: string; message: string; type: string }) {
  return resend.emails.send({
    from: FROM, to: ADMIN_EMAIL,
    subject: `[${data.type.toUpperCase()}] ${data.subject || 'New Contact Submission'}`,
    html: emailHtml('New Contact Submission',
      `${p(`<strong>From:</strong> ${data.name} (${data.email})`)}${p(`<strong>Type:</strong> ${data.type}`)}${data.subject ? p(`<strong>Subject:</strong> ${data.subject}`) : ''}${p(`<strong>Message:</strong><br>${data.message.replace(/\n/g, '<br>')}`)}`
    )
  })
}

export async function sendWelcomeEmail(data: { name: string; email: string; role: string }) {
  await resend.emails.send({
    from: FROM, to: data.email,
    subject: `Welcome to Innovate IQ LLC`,
    html: emailHtml('Welcome aboard!',
      `${p(`Hi ${data.name},`)}${p(`Your ${data.role} account is ready.`)}${btn('Go to Dashboard', `${APP_URL}/dashboard`)}`
    )
  })
  return resend.emails.send({
    from: FROM, to: ADMIN_EMAIL,
    subject: `New ${data.role} registered: ${data.name}`,
    html: emailHtml(`New ${data.role} registered`,
      `${p(`<strong>${data.name}</strong> (${data.email}) just registered.`)}${btn('View in Admin', `${APP_URL}/admin/${data.role === 'contractor' ? 'contractors' : 'clients'}`)}`
    )
  })
}

export async function sendApplicationNotification(data: { contractorName: string; contractorEmail: string; jobTitle: string; clientEmail: string; clientName: string; coverNote?: string }) {
  await resend.emails.send({
    from: FROM, to: ADMIN_EMAIL,
    subject: `New application: ${data.jobTitle}`,
    html: emailHtml('New Job Application',
      `${p(`<strong>${data.contractorName}</strong> applied for <strong>${data.jobTitle}</strong>`)}${data.coverNote ? p(`Note: ${data.coverNote}`) : ''}${btn('Review', `${APP_URL}/admin/jobs`)}`
    )
  })
  return resend.emails.send({
    from: FROM, to: data.contractorEmail,
    subject: `Application received: ${data.jobTitle}`,
    html: emailHtml('Application Received',
      `${p(`Hi ${data.contractorName},`)}${p(`We received your application for <strong>${data.jobTitle}</strong>.`)}${p('Our team will review and be in touch within 1\u20132 business days.')}${btn('View Applications', `${APP_URL}/contractor/apply`)}`
    )
  })
}

export async function sendDocumentNotification(data: { uploaderName: string; docType: string; adminEmail?: string }) {
  return resend.emails.send({
    from: FROM, to: data.adminEmail || ADMIN_EMAIL,
    subject: `Document uploaded: ${data.docType.toUpperCase()}`,
    html: emailHtml('New Document Uploaded',
      `${p(`<strong>${data.uploaderName}</strong> uploaded a <strong>${data.docType.toUpperCase()}</strong> document.`)}${btn('Review', `${APP_URL}/admin/documents`)}`
    )
  })
}

export async function sendDocumentStatusEmail(data: { recipientName: string; recipientEmail: string; docType: string; status: 'approved' | 'rejected'; reason?: string }) {
  return resend.emails.send({
    from: FROM, to: data.recipientEmail,
    subject: `Document ${data.status}: ${data.docType.toUpperCase()}`,
    html: emailHtml(`Document ${data.status === 'approved' ? 'Approved' : 'Rejected'}`,
      `${p(`Hi ${data.recipientName},`)}${p(`Your <strong>${data.docType.toUpperCase()}</strong> has been <strong>${data.status}</strong>.`)}${data.reason ? p(`Reason: ${data.reason}`) : ''}${btn('View Documents', `${APP_URL}/contractor/documents`)}`
    )
  })
}

export async function sendEsignRequestEmail(data: { signerName: string; signerEmail: string; docType: string; signingUrl: string }) {
  return resend.emails.send({
    from: FROM, to: data.signerEmail,
    subject: `Action required: Sign your ${data.docType.toUpperCase()}`,
    html: emailHtml('Document Ready to Sign',
      `${p(`Hi ${data.signerName},`)}${p(`Your <strong>${data.docType.toUpperCase()}</strong> is ready for your signature. This link expires in 30 days.`)}${btn(`Sign ${data.docType.toUpperCase()} Now`, data.signingUrl)}`
    )
  })
}

export async function sendApplicationStatusEmail(data: { contractorName: string; contractorEmail: string; jobTitle: string; status: string }) {
  const msgs: Record<string, string> = {
    shortlisted: 'You have been shortlisted. Our team will be in touch shortly.',
    hired: 'Congratulations! You have been selected for this role.',
    rejected: 'Thank you for your interest. We are moving forward with other candidates.',
    reviewing: 'Your application is currently under review.',
  }
  return resend.emails.send({
    from: FROM, to: data.contractorEmail,
    subject: `Application update: ${data.jobTitle}`,
    html: emailHtml('Application Update',
      `${p(`Hi ${data.contractorName},`)}${p(`Update on your application for <strong>${data.jobTitle}</strong>:`)}${p(`Status: <strong>${data.status}</strong>`)}${p(msgs[data.status] || '')}${btn('View', `${APP_URL}/contractor/apply`)}`
    )
  })
}

export async function sendEngagementStartEmail(data: { contractorName: string; contractorEmail: string; clientName: string; role: string; startDate: string; rate: string; engagementType: string }) {
  return resend.emails.send({
    from: FROM, to: data.contractorEmail,
    subject: `Engagement confirmed: ${data.role}`,
    html: emailHtml('Engagement Confirmed',
      `${p(`Hi ${data.contractorName}, your engagement is confirmed:`)}
      <p style="color:#475569;font-size:14px">Role: <strong>${data.role}</strong> &middot; Client: <strong>${data.clientName}</strong> &middot; Start: <strong>${data.startDate}</strong> &middot; Rate: <strong>$${data.rate}/hr</strong></p>
      ${btn('View Dashboard', `${APP_URL}/dashboard`)}`
    )
  })
}
