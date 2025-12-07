const nodemailer = require('nodemailer');
require('dotenv').config();

// Email transporter configuration
// Using Gmail or custom email service
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password',
  },
});

// Generate a 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
const sendVerificationEmail = async (email, code, username) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@modex.com',
      to: email,
      subject: 'Email Verification - Modex Ticket Booking System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Email Verification</h2>
          <p>Hi ${username},</p>
          <p>Welcome to Modex Ticket Booking System! To complete your registration, please verify your email using the code below:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #999;">Your Verification Code</p>
            <h1 style="margin: 10px 0; font-size: 36px; letter-spacing: 4px; color: #667eea;">${code}</h1>
            <p style="margin: 0; font-size: 12px; color: #999;">This code expires in 10 minutes</p>
          </div>

          <p>If you didn't create an account, please ignore this email.</p>
          
          <p style="color: #999; font-size: 12px;">
            © 2025 Modex Ticket Booking System. All rights reserved.
          </p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✓ Verification email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('✗ Error sending verification email:', error);
    throw error;
  }
};

// Send welcome email after successful registration
const sendWelcomeEmail = async (email, username) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@modex.com',
      to: email,
      subject: 'Welcome to Modex Ticket Booking System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Welcome to Modex!</h2>
          <p>Hi ${username},</p>
          <p>Your account has been successfully created and verified. You can now start booking your bus tickets.</p>
          
          <div style="margin: 20px 0;">
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/home" style="display: inline-block; padding: 12px 30px; background-color: #667eea; color: white; text-decoration: none; border-radius: 8px;">
              Start Booking Tickets
            </a>
          </div>

          <p>If you have any questions, feel free to contact our support team.</p>
          
          <p style="color: #999; font-size: 12px;">
            © 2025 Modex Ticket Booking System. All rights reserved.
          </p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✓ Welcome email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('✗ Error sending welcome email:', error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@modex.com',
      to: email,
      subject: 'Password Reset - Modex Ticket Booking System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Reset Your Password</h2>
          <p>We received a request to reset your password. Click the link below to set a new password:</p>
          
          <div style="margin: 20px 0;">
            <a href="${resetLink}" style="display: inline-block; padding: 12px 30px; background-color: #667eea; color: white; text-decoration: none; border-radius: 8px;">
              Reset Password
            </a>
          </div>

          <p style="color: #999; font-size: 12px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
          
          <p style="color: #999; font-size: 12px;">
            © 2025 Modex Ticket Booking System. All rights reserved.
          </p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✓ Password reset email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('✗ Error sending password reset email:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  generateVerificationCode,
};
