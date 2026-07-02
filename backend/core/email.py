import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.environ.get("SMTP_HOST", "")
try:
    SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
except ValueError:
    SMTP_PORT = 587
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", SMTP_USER)

def _send_email(to_email: str, subject: str, html_content: str):
    """Internal helper to send HTML emails."""
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASS:
        print(f"⚠️ Warning: SMTP not configured. Would have sent email to {to_email}: {subject}")
        print(f"Content: {html_content}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = FROM_EMAIL
    msg["To"] = to_email

    part = MIMEText(html_content, "html")
    msg.attach(part)

    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        print(f"✅ Email sent to {to_email}: {subject}")
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")


def send_otp_email(to_email: str, otp_code: str):
    """Send an OTP code for email verification."""
    subject = "Your Decipher Verification Code"
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome to Decipher!</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="margin: 0; font-size: 32px; letter-spacing: 4px; color: #f97316;">{otp_code}</h1>
        </div>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </body>
    </html>
    """
    _send_email(to_email, subject, html_content)


def send_welcome_email(to_email: str, name: str):
    """Send a welcome email with upselling for Plus and Pro plans."""
    subject = "Welcome to Decipher! 🎉 Unlock the full power of AI"
    greeting = f"Hi {name}," if name else "Hi there,"
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
        <h2 style="color: #f97316;">{greeting} Welcome to Decipher!</h2>
        <p>We're thrilled to have you on board. You can now start uploading your documents and let our AI uncover the knowledge hidden within them through summaries, chat, quizzes, and more.</p>
        
        <div style="margin: 30px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fafafa;">
            <h3 style="margin-top: 0; color: #111;">Want to get more out of Decipher?</h3>
            <p style="font-size: 14px;">You're currently on our Basic plan. Upgrade today to supercharge your workflow!</p>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                <tr>
                    <td width="50%" style="padding-right: 10px;" valign="top">
                        <div style="background: white; border: 1px solid #f97316; border-radius: 8px; padding: 15px;">
                            <h4 style="margin: 0 0 10px 0; color: #f97316;">Plus Plan</h4>
                            <ul style="padding-left: 15px; margin: 0; font-size: 13px; color: #555;">
                                <li>Unlimited uploads</li>
                                <li>Unlimited cloud storage</li>
                                <li>Basic AI summaries</li>
                            </ul>
                        </div>
                    </td>
                    <td width="50%" style="padding-left: 10px;" valign="top">
                        <div style="background: white; border: 1px solid #8b5cf6; border-radius: 8px; padding: 15px;">
                            <h4 style="margin: 0 0 10px 0; color: #8b5cf6;">Pro Plan</h4>
                            <ul style="padding-left: 15px; margin: 0; font-size: 13px; color: #555;">
                                <li>Everything in Plus</li>
                                <li>Premium AI Chat</li>
                                <li>Priority processing</li>
                            </ul>
                        </div>
                    </td>
                </tr>
            </table>
            
            <div style="text-align: center; margin-top: 20px;">
                <a href="https://decipher.com/pricing" style="display: inline-block; background: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Pricing Plans</a>
            </div>
        </div>
        
        <p>Happy learning!</p>
        <p>- The Decipher Team</p>
      </body>
    </html>
    """
    _send_email(to_email, subject, html_content)
