import os
import sys

# Add the current directory to sys.path so we can import from core
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.email import _send_email_sync

from db.database import engine
from sqlalchemy import text

def get_users():
    query = text("""
        SELECT name, email FROM users 
        WHERE email IS NOT NULL 
          AND email != ''
          AND email NOT LIKE '%@studyai.local'
          AND email NOT LIKE '%@example.com'
          AND email NOT LIKE '%@test.com'
          AND email NOT LIKE 'test%'
          AND email != 'demo.user@gmail.com'
    """)
    with engine.connect() as conn:
        result = conn.execute(query)
        users = result.fetchall()
    return users

def get_html_content(name):
    greeting = f"Dear {name}," if name else "Dear User,"
    return f"""
    <html>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f4f4f9;">
        <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 20px;">
          
          <!-- Tricolor Header -->
          <div style="height: 15px; background-color: #FF9933;"></div>
          <div style="height: 15px; background-color: #FFFFFF; display: flex; justify-content: center; align-items: center;">
            <div style="width: 10px; height: 10px; border-radius: 50%; border: 1px solid #000080; position: relative;">
               <div style="position: absolute; top: 4px; left: 0; right: 0; height: 1px; background-color: #000080;"></div>
               <div style="position: absolute; top: 0; bottom: 0; left: 4px; width: 1px; background-color: #000080;"></div>
            </div>
          </div>
          <div style="height: 15px; background-color: #138808;"></div>

          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #000080; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">Happy Independence Day!</h1>
              <p style="color: #FF9933; font-weight: bold; font-size: 18px; margin-top: 10px;">Celebrating India's 80th Independence Day</p>
            </div>
            
            <p style="font-size: 16px; color: #333333; line-height: 1.6;">{greeting}</p>
            
            <p style="font-size: 16px; color: #333333; line-height: 1.6;">
              Today, as we mark the 80th Independence Day of our great nation, we celebrate the spirit of freedom, unity, and progress that binds us together. Let us honor the sacrifices of our heroes and look forward to a brighter, more innovative future.
            </p>
            
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: linear-gradient(to right, rgba(255,153,51,0.1), rgba(255,255,255,0.5), rgba(19,136,8,0.1)); border-radius: 8px;">
              <p style="font-size: 18px; font-weight: bold; color: #000080; margin: 0; font-style: italic;">
                "Freedom is not just a right, it is our responsibility to build a better tomorrow."
              </p>
            </div>
            
            <p style="font-size: 16px; color: #333333; line-height: 1.6;">
              May the tricolor always fly high. Wishing you and your loved ones a joyous and proud Independence Day!
            </p>
            
            <p style="font-size: 16px; color: #333333; margin-top: 30px;">
              Warm regards,<br/>
              <span style="font-weight: bold; color: #FF9933;">The Decipher Team</span>
            </p>
          </div>
          
          <!-- Tricolor Footer -->
          <div style="height: 8px; background: linear-gradient(to right, #FF9933 33.33%, #FFFFFF 33.33%, #FFFFFF 66.66%, #138808 66.66%);"></div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; margin-bottom: 20px;">
            <p style="color: #888888; font-size: 12px;">&copy; Decipher. All rights reserved.</p>
        </div>
      </body>
    </html>
    """

def get_text_content(name):
    greeting = f"Dear {name}," if name else "Dear User,"
    return f"""{greeting}

Happy Independence Day! Celebrating India's 80th Independence Day.

Today, as we mark the 80th Independence Day of our great nation, we celebrate the spirit of freedom, unity, and progress that binds us together. Let us honor the sacrifices of our heroes and look forward to a brighter, more innovative future.

"Freedom is not just a right, it is our responsibility to build a better tomorrow."

May the tricolor always fly high. Wishing you and your loved ones a joyous and proud Independence Day!

Warm regards,
The Decipher Team
"""

def main():
    try:
        # Reconfigure stdout to utf-8 to safely print emojis
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8')

        users = get_users()
        print(f"Found {len(users)} users to send emails to.")
        
        subject = "🇮🇳 Happy 80th Independence Day from Decipher!"
        
        for name, email in users:
            print(f"Sending email to {email}...")
            html_content = get_html_content(name)
            text_content = get_text_content(name)
            
            _send_email_sync(
                to_email=email,
                subject=subject,
                html_content=html_content,
                text_content=text_content
            )
            
        print("All emails processed.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
