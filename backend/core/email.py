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

def _send_email_sync(to_email: str, subject: str, html_content: str, text_content: str = None):
    """Send email via Brevo (Sendinblue) HTTP API or fallback to SMTP."""
    if not text_content:
        import re
        # Crude fallback to strip HTML tags for plain text version
        text_content = re.sub(r'<[^>]+>', '', html_content)

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
                    "textContent": text_content,
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
            msg.set_content(text_content)
            msg.add_alternative(html_content, subtype='html')
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


def _send_email(to_email: str, subject: str, html_content: str, text_content: str = None):
    """Fire-and-forget email sending in a background thread so API never hangs."""
    thread = threading.Thread(
        target=_send_email_sync,
        args=(to_email, subject, html_content, text_content),
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
    """Send an enhanced welcome email including details about available plans."""
    subject = "Welcome to Decipher! Your AI Document Assistant"
    greeting = f"Hi {name}," if name else "Hi there,"
    
    text_content = f"""{greeting}

Welcome to Decipher! We're thrilled to have you on board.
You can now start uploading your documents and let our AI uncover the knowledge hidden within them through summaries, chat, quizzes, flashcards, and more.

To help you get the most out of Decipher, we offer flexible plans tailored to your needs:

- Free Plan: Perfect for getting started. Enjoy 5 documents per month, basic AI chat, and standard summaries at no cost.
- Plus Plan: Great for regular users. Up to 50 documents per month, priority AI processing, and advanced document analysis features.
- Pro Plan: Built for heavy workflows. Unlimited document uploads, maximum AI context size, early access to new features, and premium support.

You can view and upgrade your plan at any time from your Account Settings.

If you have any questions or need help getting started, feel free to reply directly to this email.

Happy learning!
— The Decipher Team
"""

    html_content = f"""
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #374151; line-height: 1.6; background-color: #f9fafb;">
        <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #f3f4f6; border-top: 4px solid #ea580c;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #ea580c; margin: 0; font-size: 28px; letter-spacing: -0.02em;">Decipher</h1>
              <p style="color: #6b7280; font-size: 15px; margin-top: 4px;">AI-Powered Document Intelligence</p>
            </div>
            
            <p style="font-size: 16px; color: #1f2937;">{greeting}</p>
            <p style="font-size: 16px;">Welcome to Decipher! We're thrilled to have you on board. You can now start uploading your documents and let our AI uncover the knowledge hidden within them through intelligent summaries, chat interactions, quizzes, and flashcards.</p>
            
            <div style="margin: 32px 0; padding: 24px; background-color: #fff7ed; border-radius: 8px; border: 1px solid #ffedd5;">
                <h3 style="margin-top: 0; color: #9a3412; font-size: 18px;">Unlock More with Decipher Plans</h3>
                <p style="font-size: 15px; margin-bottom: 16px; color: #9a3412;">We offer flexible plans to match how you work:</p>
                
                <ul style="padding-left: 20px; margin: 0; font-size: 15px; color: #7c2d12;">
                    <li style="margin-bottom: 12px;"><strong style="color: #ea580c;">Free Plan:</strong> Perfect for getting started. 5 documents/month, basic AI chat, and standard summaries.</li>
                    <li style="margin-bottom: 12px;"><strong style="color: #ea580c;">Plus Plan:</strong> For regular users. Up to 50 documents/month, priority processing, and advanced analysis tools.</li>
                    <li><strong style="color: #ea580c;">Pro Plan:</strong> For power users. Unlimited documents, maximum AI context size, and premium support.</li>
                </ul>
            </div>
            
            <p style="font-size: 16px;">You can view detailed plan comparisons and upgrade anytime directly from your Account Settings.</p>
            
            <p style="font-size: 16px;">If you have any questions or need help getting started, just reply to this email—our team is always here for you.</p>

            <p style="font-size: 16px; margin-top: 24px;">Happy learning! 📚<br/><span style="color: #ea580c; font-weight: 600;">— The Decipher Team</span></p>
        </div>
        
        <div style="text-align: center; margin-top: 24px;">
            <p style="color: #9ca3af; font-size: 12px;">&copy; Decipher. All rights reserved.</p>
            <p style="color: #9ca3af; font-size: 12px;">You are receiving this email because you recently signed up for a Decipher account.</p>
        </div>
      </body>
    </html>
    """
    _send_email(to_email, subject, html_content, text_content)

