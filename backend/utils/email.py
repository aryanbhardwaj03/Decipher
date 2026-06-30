import smtplib
import os
import logging
from email.message import EmailMessage
from config import settings

logger = logging.getLogger(__name__)

async def send_notification_email(to_email: str, subject: str, body: str):
    """
    Sends an email notification using SMTP.
    Falls back to logging if SMTP details are missing.
    """
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT", 587)
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    
    msg = EmailMessage()
    msg.set_content(body)
    msg['Subject'] = subject
    msg['From'] = smtp_user or "noreply@studyai.com"
    msg['To'] = to_email
    
    if not (smtp_server and smtp_user and smtp_pass):
        logger.info(f"--- MOCK EMAIL ---")
        logger.info(f"To: {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body: {body}")
        logger.info(f"------------------")
        return True
        
    try:
        # In a real app we'd use aiosmtplib for async, but standard smtplib works for synchronous fallback
        with smtplib.SMTP(smtp_server, int(smtp_port)) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False
