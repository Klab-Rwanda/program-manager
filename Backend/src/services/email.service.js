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
    const resetUrl = `http://localhost:3000/auth/reset-password/${resetToken}`;
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

export { 
    sendRegistrationEmail, 
    sendPasswordResetEmail, 
    sendPasswordChangeConfirmationEmail 
};