# Email Verification Setup Guide

## Overview
The application now includes email verification functionality during user registration. This guide explains how to set up and test email verification.

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install nodemailer
```

### 2. Configure Email Service

Update `.env` file with your email credentials:

```
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
APP_URL=http://localhost:3000
```

### 3. Setup Gmail (Recommended)

**For Gmail Users:**
1. Enable 2-Step Verification in your Google Account
2. Generate an **App Password** (not your regular password):
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Google will generate a 16-character password
   - Use this password in `EMAIL_PASSWORD` in your `.env` file

**Example:**
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

### 4. Alternative Email Providers

For other email services (e.g., SendGrid, Mailgun, Outlook), configure accordingly:

```
# Outlook
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password

# SendGrid (requires additional setup)
EMAIL_SERVICE=SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
```

## Frontend Integration

The signup page now includes:
1. **Registration Form** - Takes username, full name, email, password
2. **Email Verification Step** - User receives 6-digit code in email
3. **Code Verification** - User enters code to verify email
4. **Auto-Login** - After verification, user is automatically logged in

## API Endpoints

### 1. Send Verification Code
**POST** `/api/auth/send-verification`
```json
{
  "email": "user@example.com",
  "username": "johndoe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to your email",
  "email": "user@example.com"
}
```

### 2. Verify Email Code
**POST** `/api/auth/verify-email`
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "verified": true
}
```

### 3. Register User
**POST** `/api/auth/register`
```json
{
  "username": "johndoe",
  "name": "John Doe",
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "123",
    "username": "johndoe",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### 4. Login User
**POST** `/api/auth/login`
```json
{
  "identifier": "johndoe",
  "password": "SecurePassword123"
}
```

## Testing Email Verification

### Test with Gmail
1. Use a real Gmail account
2. Generate an App Password (see setup above)
3. Run the application
4. Sign up with a test email
5. Check your inbox for verification code
6. Enter code in the app

### Test Locally (Demo Mode)
The application shows verification codes in:
- Browser console (development tools)
- Server logs

This allows testing without actual email sending.

## Email Templates

### 1. Verification Email
- Contains 6-digit code
- Expires in 10 minutes
- Professional HTML formatting
- Includes link back to application

### 2. Welcome Email
- Sent after successful registration
- Contains button to app home
- Personalized greeting
- Professional design

### 3. Password Reset Email (Future)
- Reset link
- 1-hour expiration
- Security notice

## Troubleshooting

### "Email authentication failed"
- Check EMAIL_USER and EMAIL_PASSWORD in .env
- Ensure Gmail App Password is used (not regular password)
- Verify 2-Step Verification is enabled

### "SMTP Error: 535"
- Gmail App Password incorrect
- Regular Gmail password used instead of App Password
- Account not set up for app access

### "No email received"
- Check spam/junk folder
- Verify email address is correct
- Check server logs for errors

### "Verification code expired"
- Code expires after 10 minutes
- Click "Resend Code" button
- Try signup again

## Security Best Practices

1. **Never commit `.env` with real credentials** to GitHub
2. **Use environment variables** for all sensitive data
3. **Hash passwords** before storing (implement bcrypt)
4. **Use database** to store codes instead of memory (production)
5. **Rate limit** email sending (prevent spam)
6. **Add CAPTCHA** for additional security

## Production Deployment

For production on Render or similar platforms:

1. **Add environment variables** in dashboard:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=app-specific-password
   APP_URL=https://your-domain.com
   NODE_ENV=production
   ```

2. **Use production database** with verified user table

3. **Implement email rate limiting** to prevent abuse

4. **Use database** instead of Map for storing verification codes

Example database table for verification codes:
```sql
CREATE TABLE verification_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  code VARCHAR(6),
  expires_at TIMESTAMP,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Next Steps

1. Set up your email service credentials
2. Test signup with real email
3. Verify email verification works
4. Implement password reset functionality
5. Add email notification for bookings
6. Add two-factor authentication

## Support

For issues or questions:
- Check server logs for detailed error messages
- Verify email service configuration
- Test with a simple email first
- Check application documentation
