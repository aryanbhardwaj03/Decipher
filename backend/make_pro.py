import sqlite3

conn = sqlite3.connect('data/study_assistant.db')
cur = conn.cursor()
cur.execute("UPDATE users SET plan='Pro'")
print(f'Updated {cur.rowcount} rows')
conn.commit()
conn.close()
