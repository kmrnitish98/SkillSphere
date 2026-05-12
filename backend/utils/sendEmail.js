import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a verification-related email to mentor
 */
export const sendVerificationEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: `"SkillSphere" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    // Don't throw — email failure shouldn't block the API response
  }
};

/**
 * Generate approval email HTML
 */
export const getApprovalEmailHTML = (name, dashboardUrl) => `
  <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
    <div style="background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%); border-radius: 24px; padding: 48px 40px; border: 1px solid #e2e8f0; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.04); text-align: center;">
      
      <!-- Header / Logo -->
      <div style="margin-bottom: 32px;">
        <span style="font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
          Skill<span style="color: #16a34a;">Sphere</span>
        </span>
      </div>

      <!-- Icon / Celebration -->
      <div style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 20px; padding: 20px; margin-bottom: 24px; box-shadow: 0 10px 25px rgba(34, 197, 94, 0.25);">
        <span style="font-size: 40px; line-height: 1;">✅</span>
      </div>

      <!-- Heading -->
      <h1 style="color: #0f172a; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.5px; line-height: 1.2;">
        You're Verified as a Mentor!
      </h1>

      <!-- Body Content -->
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
        Hi <strong style="color: #0f172a; font-weight: 600;">${name}</strong>,
      </p>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
        Congratulations! Our admin team has successfully reviewed and approved your application. You are now officially a verified mentor on SkillSphere. You can immediately start creating and selling your own courses.
      </p>

      <!-- Tips Section -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 32px; text-align: left;">
        <div style="margin-bottom: 12px;">
          <span style="font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Next Steps to Success</span>
        </div>
        <ul style="margin: 0; padding-left: 20px; color: #0f172a; font-size: 15px; line-height: 1.8;">
          <li>Set up your complete instructor profile.</li>
          <li>Draft and upload your first premium course.</li>
          <li>Connect your payout details to start earning.</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="margin: 32px 0;">
        <a href="${dashboardUrl || `${process.env.CLIENT_URL}/mentor`}" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 100px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);">
          Go to Dashboard
        </a>
      </div>

      <!-- Support Text -->
      <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0;">
        We are thrilled to see what you teach. If you need any assistance, reach out to our team at <a href="mailto:support@skillsphere.com" style="color: #16a34a; text-decoration: none; font-weight: 500;">support@skillsphere.com</a>.
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />

      <!-- Footer -->
      <p style="color: #94a3b8; font-size: 13px; margin: 0;">
        © 2026 SkillSphere. Empowering your learning journey.
      </p>
    </div>
  </div>
`;

/**
 * Generate rejection email HTML
 */
export const getRejectionEmailHTML = (name, reason) => `
  <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #fef8f8; border-radius: 16px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #EF4444, #DC2626); border-radius: 16px; padding: 16px; margin-bottom: 12px;">
        <span style="font-size: 32px;">❌</span>
      </div>
      <h1 style="color: #1e293b; font-size: 22px; margin: 0;">Verification Not Approved</h1>
    </div>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">Hi <strong>${name}</strong>,</p>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      Unfortunately, your mentor verification was not approved at this time.
    </p>
    ${reason ? `
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #991b1b;"><strong>Reason:</strong> ${reason}</p>
    </div>` : ''}
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">You can update your application and resubmit for review.</p>
    <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 24px;">© SkillSphere — Your Learning Platform</p>
  </div>
`;

/**
 * Generate submission confirmation email HTML
 */
export const getSubmissionEmailHTML = (name) => `
  <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f8faf9; border-radius: 16px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #F59E0B, #D97706); border-radius: 16px; padding: 16px; margin-bottom: 12px;">
        <span style="font-size: 32px;">📋</span>
      </div>
      <h1 style="color: #1e293b; font-size: 22px; margin: 0;">Application Received!</h1>
    </div>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">Hi <strong>${name}</strong>,</p>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      Thank you for submitting your mentor verification application. Our team will review your profile within 
      <strong>24–48 hours</strong>.
    </p>
    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #92400e;">⏳ Your application is currently <strong>under review</strong>. We'll notify you once a decision is made.</p>
    </div>
    <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 24px;">© SkillSphere — Your Learning Platform</p>
  </div>
`;

/**
 * Generate course purchase success email HTML
 */
export const getCoursePurchaseEmailHTML = (studentName, courseName, courseUrl, orderId) => `
  <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
    <div style="background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); border-radius: 24px; padding: 48px 40px; border: 1px solid #e2e8f0; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.04); text-align: center;">
      
      <!-- Header / Logo -->
      <div style="margin-bottom: 32px;">
        <span style="font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
          Skill<span style="color: #3b82f6;">Sphere</span>
        </span>
      </div>

      <!-- Icon / Celebration -->
      <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 20px; padding: 20px; margin-bottom: 24px; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.25);">
        <span style="font-size: 40px; line-height: 1;">🎉</span>
      </div>

      <!-- Heading -->
      <h1 style="color: #0f172a; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.5px; line-height: 1.2;">
        Course Purchased Successfully!
      </h1>

      <!-- Body Content -->
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
        Hi <strong style="color: #0f172a; font-weight: 600;">${studentName}</strong>,
      </p>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
        Thank you for your purchase! We're thrilled to have you on board. Get ready to dive into your new course and level up your skills.
      </p>

      <!-- Order Details Card -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 32px; text-align: left;">
        <div style="margin-bottom: 12px;">
          <span style="font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Course Details</span>
        </div>
        <p style="margin: 0 0 8px 0; font-size: 15px; color: #0f172a;"><strong>Course:</strong> ${courseName}</p>
        <p style="margin: 0; font-size: 15px; color: #0f172a;"><strong>Order ID:</strong> #${orderId}</p>
      </div>

      <!-- CTA Button -->
      <div style="margin: 32px 0;">
        <a href="${courseUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 100px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
          Start Learning
        </a>
      </div>

      <!-- Support Text -->
      <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0;">
        Need help getting started? Our support team is here for you at <a href="mailto:support@skillsphere.com" style="color: #3b82f6; text-decoration: none; font-weight: 500;">support@skillsphere.com</a>.
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />

      <!-- Footer -->
      <p style="color: #94a3b8; font-size: 13px; margin: 0;">
        © 2026 SkillSphere. Empowering your learning journey.
      </p>
    </div>
  </div>
`;

/**
 * Send Course Purchase Email using Resend
 */
export const sendCoursePurchaseEmail = async ({ to, studentName, courseName, courseUrl, orderId }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not found. Skipped sending email via Resend.');
      return;
    }

    const htmlContent = getCoursePurchaseEmailHTML(studentName, courseName, courseUrl, orderId);

    const { data, error } = await resend.emails.send({
      from: 'SkillSphere <onboarding@resend.dev>', // Change to your verified domain (e.g., noreply@skillsphere.com)
      to,
      subject: '🎉 Course Purchased Successfully!',
      html: htmlContent,
    });

    if (error) {
      console.error('❌ Resend email error:', error);
      return;
    }
    
    console.log(`✅ Course purchase email sent to ${to} via Resend`);
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
  }
};
