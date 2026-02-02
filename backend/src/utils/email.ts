import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@whiskey-canon.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export async function sendVerificationEmail(to: string, code: string): Promise<boolean> {
  try {
    const client = getResendClient();
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Verify your Whiskey Canon account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #5B9BD5; margin: 0;">Whiskey Canon</h1>
            <p style="color: #666; margin-top: 5px;">Your Whiskey Collection Manager</p>
          </div>

          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #333; margin-top: 0;">Verify Your Email</h2>
            <p style="color: #666; margin-bottom: 25px;">
              Enter the following code to verify your email address and complete your registration:
            </p>

            <div style="background-color: #fff; border: 2px solid #5B9BD5; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #333;">
                ${code}
              </span>
            </div>

            <p style="color: #999; font-size: 14px; margin-top: 25px;">
              This code will expire in 15 minutes.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            <p>If you didn't create an account with Whiskey Canon, you can safely ignore this email.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
  try {
    const client = getResendClient();
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Reset your Whiskey Canon password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #5B9BD5; margin: 0;">Whiskey Canon</h1>
            <p style="color: #666; margin-top: 5px;">Your Whiskey Collection Manager</p>
          </div>

          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
            <p style="color: #666; margin-bottom: 25px;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>

            <a href="${resetUrl}" style="display: inline-block; background-color: #5B9BD5; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Reset Password
            </a>

            <p style="color: #999; font-size: 14px; margin-top: 25px;">
              This link will expire in 1 hour.
            </p>

            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #5B9BD5; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}
