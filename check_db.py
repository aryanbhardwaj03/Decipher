import sqlite3
conn = sqlite3.connect('backend/data/studyai.db')
cursor = conn.cursor()
cursor.execute("SELECT id, user_id, filename FROM documents WHERE id='623a8296-7ee0-43ae-884d-1445ba5bf9b2'")
print("Doc:", cursor.fetchone())
cursor.execute("SELECT id, name, email FROM users")
print("Users:", cursor.fetchall())
