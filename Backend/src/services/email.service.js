import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendRegistrationEmail = async (to, name, password) => {
    const subject = "Welcome to Klab Program Manager!";
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
        <p>you can log in using this link https://program-manager-klab.vercel.app/auth/login</p>
    `;

    const mailOptions = {
        from: `"Klab Program Manager" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: htmlBody,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Registration email sent to ${to}: ${info.messageId}`);
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
        throw new Error('Failed to send registration email');
    }
};

const sendPasswordResetEmail = async (email, name, resetToken) => {
    const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://program-manager-klab.vercel.app'  
       : 'http://localhost:3000'; 

    
    const resetUrl = `${baseUrl}/auth/reset-password/${resetToken}`;
    const subject = "Password Reset Request - Klab Program Manager";
    
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
        html: htmlBody,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}: ${info.messageId}`);
    } catch (error) {
        console.error(`Error sending password reset email to ${email}:`, error);
        throw new Error('Failed to send password reset email');
    }
};

const sendPasswordChangeConfirmationEmail = async (email, name) => {
    const subject = "Password Changed Successfully - Klab Program Manager";
    
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
        html: htmlBody,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Password change confirmation email sent to ${email}: ${info.messageId}`);
    } catch (error) {
        console.error(`Error sending password change confirmation email to ${email}:`, error);
        // Don't throw error for confirmation emails as they're not critical
        console.log('Password change confirmation email failed, but password change was successful');
    }
};

const sendAssignmentNotificationEmail = async (traineeEmail, traineeName, assignmentTitle, courseTitle, programName, dueDate, facilitatorName) => {
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
                    <li style="margin-bottom: 10px;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</li>
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
        html: htmlBody,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Assignment notification email sent to ${traineeEmail}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`Error sending assignment notification email to ${traineeEmail}:`, error);
        return false;
    }
};

const sendCertificateIssuedEmail = async (traineeEmail, traineeName, programName) => {
    const subject = `Your Certificate for ${programName} is Issued!`;
    const dashboardLink = `http://localhost:3000/dashboard/Trainee/my-certificates`; // Adjust to your frontend URL

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
        html: htmlBody,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Certificate issued email sent to ${traineeEmail}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`Error sending certificate issued email to ${traineeEmail}:`, error);
        return false;
    }
};

// --- NEW FUNCTION: Send Session Reminder Email ---
const sendSessionReminderEmail = async (traineeEmail, traineeName, sessionTitle, programName, sessionTime, facilitatorName, sessionLink) => {
    const subject = `Reminder: Your Session is Starting Soon! - ${sessionTitle}`;
    
    const formattedSessionTime = new Date(sessionTime).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' });

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
                ${sessionLink ? `
                    <a href="${sessionLink}" 
                       style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                        Join Session Now
                    </a>
                    <p style="margin-top: 15px; color: #666; font-size: 12px;">(Link: <span style="word-break: break-all;">${sessionLink}</span>)</p>
                ` : `
                    <p style="color: #666;">Please check your dashboard for the session link if available.</p>
                `}
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
        html: htmlBody,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Session reminder email sent to ${traineeEmail}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`Error sending session reminder email to ${traineeEmail}:`, error);
        return false;
    }
};




export { 
    sendRegistrationEmail, 
    sendPasswordResetEmail, 
    sendPasswordChangeConfirmationEmail,
    sendAssignmentNotificationEmail,
    sendCertificateIssuedEmail,
    sendSessionReminderEmail
};