import os
import threading
import json
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

try:
    import httpx
except ImportError:
    httpx = None

BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "aryan.bhardwaj2323@gmail.com")
FROM_NAME = os.environ.get("FROM_NAME", "Decipher")

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = os.environ.get("SMTP_PORT", 587)
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")

def _send_email_sync(to_email: str, subject: str, html_content: str):
    """Send email via Brevo (Sendinblue) HTTP API or fallback to SMTP."""
    if BREVO_API_KEY and httpx is not None:
        try:
            response = httpx.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "api-key": BREVO_API_KEY,
                    "Content-Type": "application/json",
                    "accept": "application/json",
                },
                json={
                    "sender": {"name": FROM_NAME, "email": FROM_EMAIL},
                    "to": [{"email": to_email}],
                    "subject": subject,
                    "htmlContent": html_content,
                },
                timeout=10,
            )
            if response.status_code in (200, 201):
                print(f"[SUCCESS] Email sent to {to_email} via Brevo: {subject}")
            else:
                print(f"[ERROR] Brevo API error ({response.status_code}): {response.text}")
        except Exception as e:
            print(f"[ERROR] Failed to send email via Brevo to {to_email}: {e}")
        return

    if SMTP_USER and SMTP_PASS:
        try:
            msg = EmailMessage()
            msg.set_content(html_content, subtype='html')
            msg['Subject'] = subject
            msg['From'] = f"{FROM_NAME} <{FROM_EMAIL}>" if FROM_EMAIL else SMTP_USER
            msg['To'] = to_email

            with smtplib.SMTP(SMTP_HOST, int(SMTP_PORT)) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
            print(f"[SUCCESS] Email sent to {to_email} via SMTP: {subject}")
        except Exception as e:
            print(f"[ERROR] Failed to send email via SMTP to {to_email}: {e}")
        return

    print(f"[WARN] Neither BREVO_API_KEY nor SMTP_USER configured. Skipping email to {to_email}: {subject}")


def _send_email(to_email: str, subject: str, html_content: str):
    """Fire-and-forget email sending in a background thread so API never hangs."""
    thread = threading.Thread(
        target=_send_email_sync,
        args=(to_email, subject, html_content),
        daemon=True,
    )
    thread.start()


def send_otp_email(to_email: str, otp_code: str):
    """Send an OTP code for email verification."""
    subject = "Your Decipher Verification Code"
    html_content = f"""
    <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #111; margin: 0;">Decipher</h2>
          <p style="color: #666; font-size: 14px; margin-top: 4px;">AI-Powered Document Intelligence</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #333; font-size: 16px;">Your verification code is:</p>
        <div style="background: linear-gradient(135deg, #fff7ed, #ffedd5); padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0; border: 1px solid #fed7aa;">
          <h1 style="margin: 0; font-size: 36px; letter-spacing: 6px; color: #ea580c; font-family: monospace;">{otp_code}</h1>
        </div>
        <p style="color: #555; font-size: 14px;">This code will expire in <strong>15 minutes</strong>.</p>
        <p style="color: #999; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0 15px;" />
        <p style="color: #aaa; font-size: 11px; text-align: center;">&copy; Decipher. All rights reserved.</p>
      </body>
    </html>
    """
    _send_email(to_email, subject, html_content)


def send_welcome_email(to_email: str, name: str):
    """Send a welcome email with simple transactional text to avoid spam/promotions."""
    subject = "Welcome to Decipher!"
    greeting = f"Hi {name}," if name else "Hi there,"
    
    html_content = f"""
    <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #333; line-height: 1.7; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #111; margin: 0;">Decipher</h2>
          <p style="color: #666; font-size: 14px; margin-top: 4px;">AI-Powered Document Intelligence</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

        <h2 style="color: #ea580c;">{greeting} Welcome to Decipher!</h2>
        <p>We're thrilled to have you on board. You can now start uploading your documents and let our AI uncover the knowledge hidden within them through summaries, chat, quizzes, flashcards, and more.</p>
        
        <p>If you have any questions or need help getting started, feel free to reach out to our team at any time.</p>

        <p>Happy learning! 📚</p>
        <p style="color: #555;">— The Decipher Team</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0 15px;" />
        <p style="color: #aaa; font-size: 11px; text-align: center;">&copy; Decipher. All rights reserved.</p>
      </body>
    </html>
    """
    _send_email(to_email, subject, html_content)
