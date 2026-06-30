from db.database import SessionLocal
from db import crud

db = SessionLocal()
try:
    guest_id = "0a0a39f8-09c5-40ec-8dae-e55b6510d76c"
    user_id = "1d218a60-c3f9-42db-bbcb-a81c3494c63b"
    crud.migrate_guest_data(db, guest_id, user_id)
    print("Migration successful")
finally:
    db.close()
