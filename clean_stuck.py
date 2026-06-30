import sqlite3

def clean_stuck_documents():
    conn = sqlite3.connect(r"C:\Users\aryan\Desktop\AI research Assistant\backend\data\study_assistant.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM documents WHERE status = 'processing'")
    deleted = cursor.rowcount
    conn.commit()
    conn.close()
    print(f"Deleted {deleted} stuck documents.")

if __name__ == "__main__":
    clean_stuck_documents()
