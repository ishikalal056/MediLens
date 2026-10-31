import sqlite3
import os
from werkzeug.security import generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "medilens.db")


def setup_patient_credentials():

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Remove old credentials table
    cursor.execute("DROP TABLE IF EXISTS patient_credentials")

    # Create credentials table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patient_credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    """)

    print("Patient credentials table created successfully!")

    # Get all patients
    cursor.execute("""
        SELECT Patient_ID
        FROM patients
        WHERE Patient_ID IS NOT NULL
    """)

    patients = cursor.fetchall()

    added = 0

    # Temporary default password
    default_password = "MediLens@123"

    # Generate the hash only ONCE
    password_hash = generate_password_hash(
        default_password
    )

    for patient in patients:

        patient_id = patient[0]

        # Check if credentials already exist
        cursor.execute("""
            SELECT id
            FROM patient_credentials
            WHERE patient_id = ?
        """, (patient_id,))

        existing = cursor.fetchone()

        if existing:
            continue

        cursor.execute("""
            INSERT INTO patient_credentials
            (patient_id, password_hash)
            VALUES (?, ?)
        """, (
            patient_id,
            password_hash
        ))

        added += 1

    conn.commit()
    conn.close()

    print()
    print("========================================")
    print("Patient Authentication Setup Complete")
    print("========================================")
    print(f"Total patients processed : {len(patients)}")
    print(f"New credentials created : {added}")
    print()
    print("Default password:")
    print("MediLens@123")
    print("========================================")


if __name__ == "__main__":
    setup_patient_credentials()