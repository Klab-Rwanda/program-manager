import nodemailer from 'nodemailer';

// Lazy initialization of transporter to ensure environment variables are loaded
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    // Log environment variables (without exposing password)
    console.log('Email configuration check:', {
      host: process.env.EMAIL_HOST || 'NOT SET',
      port: 465,
      user: process.env.EMAIL_USER || 'NOT SET',
      passSet: process.env.EMAIL_PASS ? 'YES' : 'NO',
      nodeEnv: process.env.NODE_ENV
    });

    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('EMAIL CONFIGURATION ERROR: Missing required environment variables');
      console.error('Required: EMAIL_HOST, EMAIL_USER, EMAIL_PASS');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // Add connection timeout settings
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });

    // Verify transporter connection
    transporter.verify((error, success) => {
      if (error) {
        console.error('Email transporter verification failed:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', JSON.stringify(error, null, 2));
      } else {
        console.log('Email server is ready to send messages');
      }
    });
  }
  return transporter;
};

const sendRegistrationEmail = async (to, name, password) => {
  const subject = 'Welcome to Klab Program Manager!';
  const htmlBody = `
        <h1>Hi ${name},</h1>
        <p>Welcome to the Klab Program Manager platform! An account has been created for you.</p>
        <p>You can log in using the following credentials:</p>
        <ul>
            <li><strong>Email:</strong> ${to}</li>
            <li><strong>Password:</strong> ${password}</li>
        </ul>
        <p>It is highly recommended that you change your password after your first login.</p>
        <p>Best regards,<br>The Klab Team</p>
        <p>you can log in using this link https://pms.klab.rw/auth/login</p>
    `;

  const mailOptions = {
    from: `"Klab Program Manager" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: subject,
    html: htmlBody
  };

  try {
    const transport = getTransporter();
    if (!transport) {
      console.error('Email transporter not available - check environment variables');
      throw new Error('Email service not configured');
    }
    const info = await transport.sendMail(mailOptions);
    console.log(`Registration email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error.message);
    throw new Error('Failed to send registration email');
  }
};

const sendPasswordResetEmail = async (email, name, resetToken) => {
  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://pms.klab.rw'
      : 'http://localhost:3000';

  const resetUrl = `${baseUrl}/auth/reset-password/${resetToken}`;
  const subject = 'Password Reset Request - Klab Program Manager';

  const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; margin-bottom: 10px;">Klab Program Manager</h1>
                <h2 style="color: #1f497d; margin-top: 0;">Password Reset Request</h2>
            </div>

            <p>Hello ${name},</p>
            <p>You have requested to reset your password for your Klab Program Manager account. Please click the button below to reset your password:</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}"
                    style="background-color: #1f497d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Reset Password
                </a>
            </div>

            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">${resetUrl}</p>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;"><strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.</p>
            </div>

            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged and secure.</p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
                If you're having trouble with the reset link, please contact our support team.<br>
                Best regards,<br>
                The Klab Team
            </p>
        </div>
    `;

  const mailOptions = {
    from: `"Klab Program Manager" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlBody
  };

  try {
    const transport = getTransporter();
    if (!transport) {
      console.error('Email transporter not available - check environment variables');
      throw new Error('Email service not configured');
    }
    const info = await transport.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}: ${info.messageId}`);
  } catch (error) {
    console.error(`Error sending password reset email to ${email}:`, error.message);
    throw new Error('Failed to send password reset email');
  }
};

const sendPasswordChangeConfirmationEmail = async (email, name) => {
  const subject = 'Password Changed Successfully - Klab Program Manager';

  const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; margin-bottom: 10px;">Klab Program Manager</h1>
                <h2 style="color: #28a745; margin-top: 0;">Password Changed Successfully</h2>
            </div>

            <p>Hello ${name},</p>
            <p>This is to confirm that your password has been successfully changed for your Klab Program Manager account.</p>

            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #155724;"><strong>✅ Confirmed:</strong> Your password was changed on ${new Date().toLocaleString()}.</p>
            </div>

            <p>If you did not make this change, please contact our support team immediately as your account may have been compromised.</p>

            <div style="text-align: center; margin: 30px 0;">
                <p style="margin: 0;"><strong>Need help?</strong></p>
                <p style="margin: 5px 0; color: #666;">Contact our support team if you have any concerns.</p>
            </div>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
                This is an automated security notification.<br>
                Best regards,<br>
                The Klab Team
            </p>
        </div>
    `;

  const mailOptions = {
    from: `"Klab Program Manager" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlBody
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log(
      `Password change confirmation email sent to ${email}: ${info.messageId}`
    );
  } catch (error) {
    console.error(
      `Error sending password change confirmation email to ${email}:`,
      error
    );
    // Don't throw error for confirmation emails as they're not critical
    console.log(
      'Password change confirmation email failed, but password change was successful'
    );
  }
};

const sendAssignmentNotificationEmail = async (
  traineeEmail,
  traineeName,
  assignmentTitle,
  courseTitle,
  programName,
  dueDate,
  facilitatorName
) => {
  const subject = `New Assignment: ${assignmentTitle} - ${courseTitle}`;

  const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; margin-bottom: 10px;">Klab Program Manager</h1>
                <h2 style="color: #1f497d; margin-top: 0;">New Assignment Available</h2>
            </div>

            <p>Hello ${traineeName},</p>
            <p>A new assignment has been created for your program. Here are the details:</p>

            <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1f497d; margin-top: 0;">Assignment Details</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="margin-bottom: 10px;"><strong>Assignment:</strong> ${assignmentTitle}</li>
                    <li style="margin-bottom: 10px;"><strong>Course:</strong> ${courseTitle}</li>
                    <li style="margin-bottom: 10px;"><strong>Program:</strong> ${programName}</li>
                    <li style="margin-bottom: 10px;"><strong>Due Date:</strong> ${new Date(
                      dueDate
                    ).toLocaleDateString()}</li>
                    <li style="margin-bottom: 10px;"><strong>Facilitator:</strong> ${facilitatorName}</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <p style="margin: 0;"><strong>Action Required</strong></p>
                <p style="margin: 5px 0; color: #666;">Please log in to your dashboard to view the full assignment details and submit your work.</p>
            </div>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;"><strong>⏰ Reminder:</strong> Make sure to submit your assignment before the due date to avoid any penalties.</p>
            </div>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
                This is an automated notification from Klab Program Manager.<br>
                If you have any questions, please contact your facilitator.<br>
                Best regards,<br>
                The Klab Team
            </p>
        </div>
    `;

  const mailOptions = {
    from: `"Klab Program Manager" <${process.env.EMAIL_USER}>`,
    to: traineeEmail,
    subject: subject,
    html: htmlBody
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log(
      `Assignment notification email sent to ${traineeEmail}: ${info.messageId}`
    );
    return true;
  } catch (error) {
    console.error(
      `Error sending assignment notification email to ${traineeEmail}:`,
      error
    );
    return false;
  }
};

const sendCertificateIssuedEmail = async (
  traineeEmail,
  traineeName,
  programName
) => {
  const subject = `Your Certificate for ${programName} is Issued!`;
  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://pms.klab.rw'
      : 'http://localhost:3000';
  const dashboardLink = `${baseUrl}/dashboard/Trainee/my-certificates`;

  const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; margin-bottom: 10px;">Klab Program Manager</h1>
                <h2 style="color: #28a745; margin-top: 0;">Certificate of Completion</h2>
            </div>

            <p>Hello ${traineeName},</p>
            <p>We are thrilled to inform you that your certificate for successfully completing the <strong>${programName}</strong> program has been issued!</p>

            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #155724; font-size: 16px;"><strong>Congratulations on your achievement! 🎉</strong></p>
            </div>

            <p>You can view and download your certificate from your dashboard:</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardLink}"
                   style="background-color: #1f497d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                    View My Certificates
                </a>
            </div>

            <p>We wish you all the best in your future endeavors!</p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666; text-align: center;">
                This is an automated notification.<br>
                Best regards,<br>
                The Klab Team
            </p>
        </div>
    `;

  const mailOptions = {
    from: `"Klab Program Manager" <${process.env.EMAIL_USER}>`,
    to: traineeEmail,
    subject: subject,
    html: htmlBody
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log(
      `Certificate issued email sent to ${traineeEmail}: ${info.messageId}`
    );
    return true;
  } catch (error) {
    console.error(
      `Error sending certificate issued email to ${traineeEmail}:`,
      error
    );
    return false;
  }
};

// --- NEW FUNCTION: Send Session Reminder Email ---
const sendSessionReminderEmail = async (
  traineeEmail,
  traineeName,
  sessionTitle,
  programName,
  sessionTime,
  facilitatorName,
  sessionLink
) => {
  const subject = `Reminder: Your Session is Starting Soon! - ${sessionTitle}`;

  const formattedSessionTime = new Date(sessionTime).toLocaleString([], {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; margin-bottom: 10px;">Klab Program Manager</h1>
                <h2 style="color: #1f497d; margin-top: 0;">Session Reminder</h2>
            </div>

            <p>Hello ${traineeName},</p>
            <p>Just a friendly reminder that your upcoming session is starting in <strong>10 minutes</strong>!</p>

            <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1f497d; margin-top: 0;">Session Details</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="margin-bottom: 10px;"><strong>Session:</strong> ${sessionTitle}</li>
                    <li style="margin-bottom: 10px;"><strong>Program:</strong> ${programName}</li>
                    <li style="margin-bottom: 10px;"><strong>Time:</strong> ${formattedSessionTime}</li>
                    <li style="margin-bottom: 10px;"><strong>Facilitator:</strong> ${facilitatorName}</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                ${
                  sessionLink
                    ? `
                    <a href="${sessionLink}"
                       style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                        Join Session Now
                    </a>
                    <p style="margin-top: 15px; color: #666; font-size: 12px;">(Link: <span style="word-break: break-all;">${sessionLink}</span>)</p>
                `
                    : `
                    <p style="color: #666;">Please check your dashboard for the session link if available.</p>
                `
                }
            </div>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;"><strong>⏰ Don't be late!</strong> Ensure you have a stable internet connection and quiet environment.</p>
            </div>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
                This is an automated notification from Klab Program Manager.<br>
                Best regards,<br>
                The Klab Team
            </p>
        </div>
    `;

  const mailOptions = {
    from: `"Klab Program Manager" <${process.env.EMAIL_USER}>`,
    to: traineeEmail,
    subject: subject,
    html: htmlBody
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log(
      `Session reminder email sent to ${traineeEmail}: ${info.messageId}`
    );
    return true;
  } catch (error) {
    console.error(
      `Error sending session reminder email to ${traineeEmail}:`,
      error
    );
    return false;
  }
};

/**
 * Send announcement email to multiple recipients
 */
const sendAnnouncementEmail = async ({ recipients, title, content, authorName, programName, priority }) => {
  const priorityColors = {
    low: '#6c757d',
    normal: '#1f497d',
    high: '#fd7e14',
    urgent: '#dc3545'
  };

  const priorityLabels = {
    low: 'Low Priority',
    normal: '',
    high: 'High Priority',
    urgent: '🚨 URGENT'
  };

  const priorityColor = priorityColors[priority] || priorityColors.normal;
  const priorityLabel = priorityLabels[priority] || '';

  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://pms.klab.rw'
    : 'http://localhost:3000';

  for (const recipient of recipients) {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin-bottom: 10px;">Klab Program Manager</h1>
          <h2 style="color: ${priorityColor}; margin-top: 0;">
            ${priorityLabel ? `<span style="background-color: ${priorityColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${priorityLabel}</span><br>` : ''}
            New Announcement
          </h2>
        </div>

        <p>Hello ${recipient.name},</p>
        <p>A new announcement has been posted for the <strong>${programName}</strong> program.</p>

        <div style="background-color: #f8f9fa; border-left: 4px solid ${priorityColor}; padding: 20px; margin: 20px 0;">
          <h3 style="color: ${priorityColor}; margin-top: 0;">${title}</h3>
          <div style="color: #333; line-height: 1.6;">
            ${content.replace(/\n/g, '<br>')}
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 15px; margin-bottom: 0;">
            Posted by: ${authorName}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/dashboard"
             style="background-color: #1f497d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            View in Dashboard
          </a>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          This is an automated notification from Klab Program Manager.<br>
          Best regards,<br>
          The Klab Team
        </p>
      </div>
    `;

    const mailOptions = {
      from: `"Klab Program Manager" <${process.env.EMAIL_USER}>`,
      to: recipient.email,
      subject: `${priorityLabel ? `[${priorityLabel}] ` : ''}${title} - ${programName}`,
      html: htmlBody
    };

    try {
      const info = await getTransporter().sendMail(mailOptions);
      console.log(`Announcement email sent to ${recipient.email}: ${info.messageId}`);
    } catch (error) {
      console.error(`Error sending announcement email to ${recipient.email}:`, error);
      // Continue sending to other recipients even if one fails
    }
  }
};

export {
  sendRegistrationEmail,
  sendPasswordResetEmail,
  sendPasswordChangeConfirmationEmail,
  sendAssignmentNotificationEmail,
  sendCertificateIssuedEmail,
  sendSessionReminderEmail,
  sendAnnouncementEmail
};
