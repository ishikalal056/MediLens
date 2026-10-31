import sqlite3
import os

# =====================================================
# DATABASE CONFIGURATION
# =====================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "medilens.db")


# =====================================================
# MIGRATE DATABASE
# =====================================================

def migrate_database():

    print("Connecting to MediLens database...")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # -------------------------------------------------
    # Check whether record_source column already exists
    # -------------------------------------------------

    cursor.execute("PRAGMA table_info(patients)")
    columns = [column[1] for column in cursor.fetchall()]

    if "record_source" not in columns:

        print("Adding record_source column...")

        cursor.execute("""
            ALTER TABLE patients
            ADD COLUMN record_source TEXT DEFAULT 'Imported'
        """)

        print("record_source column added successfully!")

    else:

        print("record_source column already exists.")


    # -------------------------------------------------
    # Mark all existing patients as Imported
    # -------------------------------------------------

    cursor.execute("""
        UPDATE patients
        SET record_source = 'Imported'
        WHERE record_source IS NULL
           OR record_source = ''
    """)

    conn.commit()


    cursor.execute("""
    UPDATE patients
    SET record_source = 'New'
    WHERE Name = 'Tuktuk'
    """)

    conn.commit()
    print("Tuktuk marked as New!")


    # -------------------------------------------------
    # Count records
    # -------------------------------------------------

    cursor.execute("""
        SELECT COUNT(*)
        FROM patients
        WHERE record_source = 'Imported'
    """)

    imported_count = cursor.fetchone()[0]


    cursor.execute("""
        SELECT COUNT(*)
        FROM patients
        WHERE record_source = 'New'
    """)

    new_count = cursor.fetchone()[0]


    conn.close()


    # -------------------------------------------------
    # Result
    # -------------------------------------------------

    print()
    print("========================================")
    print("MediLens Database Migration Complete")
    print("========================================")
    print(f"Imported patients : {imported_count}")
    print(f"New patients      : {new_count}")
    print("========================================")


# =====================================================
# RUN
# =====================================================

if __name__ == "__main__":
    migrate_database()