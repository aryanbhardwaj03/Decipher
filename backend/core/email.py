import os
import threading
import json

try:
    import httpx
except ImportError:
    httpx = None

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "onboarding@resend.dev")


def _send_email_sync(to_email: str, subject: str, html_content: str):
    """Send email via Resend HTTP API."""
    if not RESEND_API_KEY:
        print(f"⚠️ RESEND_API_KEY not configured. Skipping email to {to_email}: {subject}")
        return

    if httpx is None:
        print(f"⚠️ 'httpx' library not installed. Cannot send email.")
        return

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": FROM_EMAIL,
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            },
            timeout=10,
        )
        if response.status_code == 200:
            print(f"✅ Email sent to {to_email}: {subject}")
        else:
            print(f"❌ Resend API error ({response.status_code}): {response.text}")
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
                <a href="https://decipherr.vercel.app/pricing" style="display: inline-block; background: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Pricing Plans</a>
            </div>
        </div>
        
        <p>Happy learning!</p>
        <p>- The Decipher Team</p>
      </body>
    </html>
    """
    _send_email(to_email, subject, html_content)
