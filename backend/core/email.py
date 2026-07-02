import os
import threading
import json

try:
    import httpx
except ImportError:
    httpx = None

BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "aryan.bhardwaj2323@gmail.com")
FROM_NAME = os.environ.get("FROM_NAME", "Decipher")


def _send_email_sync(to_email: str, subject: str, html_content: str):
    """Send email via Brevo (Sendinblue) HTTP API."""
    if not BREVO_API_KEY:
        print(f"⚠️ BREVO_API_KEY not configured. Skipping email to {to_email}: {subject}")
        return

    if httpx is None:
        print(f"⚠️ 'httpx' library not installed. Cannot send email.")
        return

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
            print(f"✅ Email sent to {to_email}: {subject}")
        else:
            print(f"❌ Brevo API error ({response.status_code}): {response.text}")
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")


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
    """Send a welcome email with upselling for Plus and Pro plans."""
    subject = "Welcome to Decipher! 🎉 Unlock the full power of AI"
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
        
        <div style="margin: 30px 0; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background: #fafafa;">
            <h3 style="margin-top: 0; color: #111;">🚀 Want to get more out of Decipher?</h3>
            <p style="font-size: 14px; color: #555;">You're currently on our <strong>Basic</strong> plan. Upgrade today to supercharge your workflow!</p>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                <tr>
                    <td width="50%" style="padding-right: 8px;" valign="top">
                        <div style="background: white; border: 2px solid #ea580c; border-radius: 12px; padding: 16px;">
                            <h4 style="margin: 0 0 10px 0; color: #ea580c;">⚡ Plus Plan</h4>
                            <ul style="padding-left: 16px; margin: 0; font-size: 13px; color: #555; line-height: 1.8;">
                                <li>Unlimited uploads</li>
                                <li>Unlimited cloud storage</li>
                                <li>AI summaries &amp; notes</li>
                            </ul>
                        </div>
                    </td>
                    <td width="50%" style="padding-left: 8px;" valign="top">
                        <div style="background: white; border: 2px solid #7c3aed; border-radius: 12px; padding: 16px;">
                            <h4 style="margin: 0 0 10px 0; color: #7c3aed;">💎 Pro Plan</h4>
                            <ul style="padding-left: 16px; margin: 0; font-size: 13px; color: #555; line-height: 1.8;">
                                <li>Everything in Plus</li>
                                <li>Premium AI Chat</li>
                                <li>Priority processing</li>
                            </ul>
                        </div>
                    </td>
                </tr>
            </table>
            
            <div style="text-align: center; margin-top: 24px;">
                <a href="https://decipherr.vercel.app/pricing" style="display: inline-block; background: linear-gradient(135deg, #ea580c, #f97316); color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">View Pricing Plans →</a>
            </div>
        </div>
        
        <p>Happy learning! 📚</p>
        <p style="color: #555;">— The Decipher Team</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0 15px;" />
        <p style="color: #aaa; font-size: 11px; text-align: center;">&copy; Decipher. All rights reserved.</p>
      </body>
    </html>
    """
    _send_email(to_email, subject, html_content)
