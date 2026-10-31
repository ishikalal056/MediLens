import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "medilens.db")


def add_patient_ids():

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Checking patients table...")

    # Check existing columns
    cursor.execute("PRAGMA table_info(patients)")
    columns = [column[1] for column in cursor.fetchall()]

    # Add Patient_ID column if it doesn't exist
    if "Patient_ID" not in columns:

        print("Adding Patient_ID column...")

        cursor.execute("""
            ALTER TABLE patients
            ADD COLUMN Patient_ID TEXT
        """)

        print("Patient_ID column added!")

    else:
        print("Patient_ID column already exists.")

    # Get all patients
    cursor.execute("""
        SELECT rowid
        FROM patients
        ORDER BY rowid
    """)

    patients = cursor.fetchall()

    print(f"Total patients found: {len(patients)}")

    # Generate IDs
    for index, (row_id,) in enumerate(patients, start=1):

        patient_id = f"MLP{index:05d}"

        cursor.execute("""
            UPDATE patients
            SET Patient_ID = ?
            WHERE rowid = ?
        """, (patient_id, row_id))

    conn.commit()

    # Verify
    cursor.execute("""
        SELECT Patient_ID, Name
        FROM patients
        LIMIT 10
    """)

    records = cursor.fetchall()

    print()
    print("========================================")
    print("Patient IDs Generated Successfully")
    print("========================================")

    for patient_id, name in records:
        print(patient_id, "-", name)

    print("========================================")

    conn.close()


if __name__ == "__main__":
    add_patient_ids()