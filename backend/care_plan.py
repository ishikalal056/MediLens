
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "medilens.db")


def create_care_plan_table():
    conn = sqlite3.connect(DB_PATH)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS care_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            doctor_reviewed_status TEXT,
            care_instructions TEXT,
            follow_up_date TEXT,
            follow_up_purpose TEXT,
            last_reviewed_date TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id)
                REFERENCES patients (Patient_ID)
        )
    """)

    conn.commit()
    conn.close()

    print("Care Plan table created successfully!")


if __name__ == "__main__":
    create_care_plan_table()
