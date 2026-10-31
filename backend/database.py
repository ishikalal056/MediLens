import sqlite3
import pandas as pd
import os


# Database path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "medilens.db")

# CSV path
CSV_PATH = os.path.join(BASE_DIR, "..", "data", "healthcare_dataset.csv")


def create_database():
    print("Reading healthcare dataset...")

    # Read CSV
    df = pd.read_csv(CSV_PATH)

    print(f"Total records found: {len(df)}")

    # Connect to SQLite database
    conn = sqlite3.connect(DB_PATH)

    # Store dataframe in patients table
    df.to_sql(
        "patients",
        conn,
        if_exists="replace",
        index=False
    )

    conn.close()

    print("Database created successfully!")
    print(f"Database location: {DB_PATH}")
    print("Table created: patients")


if __name__ == "__main__":
    create_database()