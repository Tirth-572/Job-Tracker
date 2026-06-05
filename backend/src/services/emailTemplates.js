const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ATS Platform</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">🎯 HireBridge ATS</h1>
          </td>
        </tr>
        <tr><td style="padding:40px 32px;">${content}</td></tr>
        <tr>
          <td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:13px;">© 2024 HireBridge ATS. All rights reserved.</p>
            <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;">You're receiving this because you have an account on HireBridge.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const statusColors = {
  APPLIED: '#6366f1',
  UNDER_REVIEW: '#f59e0b',
  SHORTLISTED: '#3b82f6',
  INTERVIEW_SCHEDULED: '#8b5cf6',
  INTERVIEW_COMPLETED: '#06b6d4',
  SELECTED: '#10b981',
  OFFER_SENT: '#f97316',
  JOINED: '#22c55e',
  REJECTED: '#ef4444',
};

const statusMessages = {
  APPLIED: 'Your application has been received.',
  UNDER_REVIEW: 'Our team is reviewing your application.',
  SHORTLISTED: "Great news! You've been shortlisted.",
  INTERVIEW_SCHEDULED: 'An interview has been scheduled for you.',
  INTERVIEW_COMPLETED: 'Thank you for completing the interview.',
  SELECTED: "Congratulations! You've been selected.",
  OFFER_SENT: 'An offer letter has been sent to you.',
  JOINED: 'Welcome aboard! Your onboarding is confirmed.',
  REJECTED: 'We appreciate your interest, but we have moved forward with other candidates.',
};

const nextSteps = {
  APPLIED: 'We will review your profile and get back to you soon.',
  UNDER_REVIEW: 'Please wait while our HR team evaluates your profile.',
  SHORTLISTED: 'Expect an interview invitation soon. Keep an eye on your email.',
  INTERVIEW_SCHEDULED: 'Please check your dashboard for interview details.',
  INTERVIEW_COMPLETED: 'Our team will evaluate and update you shortly.',
  SELECTED: 'Please check your dashboard for the offer letter.',
  OFFER_SENT: 'Review the offer and confirm your acceptance from your dashboard.',
  JOINED: 'Your HR team will share onboarding details.',
  REJECTED: 'We encourage you to apply for other suitable positions.',
};

const templates = {
  applicationConfirmation: ({ candidateName, companyName, jobTitle, dashboardLink }) =>
    baseTemplate(`
      <h2 style="color:#1e293b;margin:0 0 8px;">Application Submitted! 🎉</h2>
      <p style="color:#64748b;margin:0 0 24px;">Hi ${candidateName},</p>
      <p style="color:#475569;line-height:1.7;">Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been successfully submitted.</p>
      <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;border-radius:8px;margin:24px 0;">
        <p style="margin:0;color:#166534;font-weight:600;">Status: Applied ✓</p>
        <p style="margin:8px 0 0;color:#15803d;font-size:14px;">We will review your application and update you soon.</p>
      </div>
      <a href="${dashboardLink}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;margin-top:16px;">Track Application →</a>
    `),

  statusUpdate: ({ candidateName, companyName, jobTitle, status, rejectionReason, dashboardLink }) =>
    baseTemplate(`
      <h2 style="color:#1e293b;margin:0 0 8px;">Application Update</h2>
      <p style="color:#64748b;margin:0 0 24px;">Hi ${candidateName},</p>
      <p style="color:#475569;line-height:1.7;">Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:24px;border-radius:12px;margin:24px 0;text-align:center;">
        <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Current Status</p>
        <span style="background:${statusColors[status] || '#6366f1'};color:#fff;padding:8px 20px;border-radius:999px;font-size:14px;font-weight:600;">${status.replace(/_/g, ' ')}</span>
        <p style="margin:16px 0 0;color:#475569;font-size:14px;">${statusMessages[status] || ''}</p>
        ${rejectionReason ? `<p style="margin:12px 0 0;color:#ef4444;font-size:13px;font-style:italic;">Reason: ${rejectionReason}</p>` : ''}
      </div>
      <p style="color:#475569;font-size:14px;"><strong>Next Steps:</strong> ${nextSteps[status] || ''}</p>
      <a href="${dashboardLink}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;margin-top:16px;">View Application →</a>
    `),

  interviewScheduled: ({ candidateName, companyName, jobTitle, scheduledAt, type, meetingLink, location, dashboardLink }) =>
    baseTemplate(`
      <h2 style="color:#1e293b;margin:0 0 8px;">Interview Scheduled 📅</h2>
      <p style="color:#64748b;margin:0 0 24px;">Hi ${candidateName},</p>
      <p style="color:#475569;line-height:1.7;">Your interview for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been scheduled.</p>
      <div style="background:#faf5ff;border:1px solid #e9d5ff;padding:24px;border-radius:12px;margin:24px 0;">
        <div style="margin-bottom:12px;"><span style="color:#7c3aed;font-weight:600;">📅 Date & Time:</span> <span style="color:#374151;">${new Date(scheduledAt).toLocaleString()}</span></div>
        <div style="margin-bottom:12px;"><span style="color:#7c3aed;font-weight:600;">🎯 Type:</span> <span style="color:#374151;">${type}</span></div>
        ${meetingLink ? `<div style="margin-bottom:12px;"><span style="color:#7c3aed;font-weight:600;">🔗 Meeting Link:</span> <a href="${meetingLink}" style="color:#4f46e5;">${meetingLink}</a></div>` : ''}
        ${location ? `<div><span style="color:#7c3aed;font-weight:600;">📍 Location:</span> <span style="color:#374151;">${location}</span></div>` : ''}
      </div>
      <a href="${dashboardLink}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;margin-top:16px;">View Details →</a>
    `),

  offerSent: ({ candidateName, companyName, jobTitle, dashboardLink }) =>
    baseTemplate(`
      <h2 style="color:#1e293b;margin:0 0 8px;">Offer Letter Received! 🎊</h2>
      <p style="color:#64748b;margin:0 0 24px;">Hi ${candidateName},</p>
      <div style="background:linear-gradient(135deg,#fff7ed,#fef9c3);border:1px solid #fbbf24;padding:24px;border-radius:12px;margin:24px 0;text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">🎉</div>
        <p style="color:#92400e;font-weight:700;font-size:18px;margin:0;">Congratulations!</p>
        <p style="color:#a16207;margin:8px 0 0;">You have received an offer from <strong>${companyName}</strong> for the position of <strong>${jobTitle}</strong>.</p>
      </div>
      <p style="color:#475569;">Please review your offer letter from your dashboard and confirm your acceptance.</p>
      <a href="${dashboardLink}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;margin-top:16px;">View Offer Letter →</a>
    `),
};

const getEmailTemplate = (templateName, data) => {
  if (!templates[templateName]) throw new Error(`Template '${templateName}' not found`);
  return templates[templateName](data);
};

module.exports = { getEmailTemplate };
