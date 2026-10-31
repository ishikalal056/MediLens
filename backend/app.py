from flask import Flask, jsonify, request, Response
import sqlite3
import pandas as pd
import os
import joblib
from werkzeug.security import check_password_hash

app = Flask(__name__)

# =====================================================
# DATABASE CONFIGURATION
# =====================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "medilens.db")

# =====================================================
# MACHINE LEARNING MODEL
# =====================================================

MODEL_PATH = os.path.join(
    BASE_DIR,
    "..",
    "ml",
    "medilens_model.pkl"
)

model = joblib.load(MODEL_PATH)

print("MediLens ML model loaded successfully!")


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# =====================================================
# PATIENT LOGIN
# =====================================================

@app.route("/api/patient-login", methods=["POST"])
def patient_login():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "No login data provided."
        }), 400

    patient_id = str(
        data.get("patient_id", "")
    ).strip()

    password = str(
        data.get("password", "")
    )

    # Check required fields
    if not patient_id or not password:

        return jsonify({
            "success": False,
            "message": "Patient ID and password are required."
        }), 400

    conn = get_db_connection()

    # Get login credentials
    credential = conn.execute("""
        SELECT patient_id, password_hash
        FROM patient_credentials
        WHERE patient_id = ?
    """, (
        patient_id,
    )).fetchone()

    # Patient ID not found
    if credential is None:

        conn.close()

        return jsonify({
            "success": False,
            "message": "Invalid Patient ID or password."
        }), 401

    # Verify password
    password_correct = check_password_hash(
        credential["password_hash"],
        password
    )

    if not password_correct:

        conn.close()

        return jsonify({
            "success": False,
            "message": "Invalid Patient ID or password."
        }), 401

    # Get only this patient's record
    patient = conn.execute("""
        SELECT
            Patient_ID,
            Name,
            Age,
            Gender,
            "Blood Type",
            "Medical Condition",
            "Date of Admission",
            "Discharge Date",
            Doctor,
            Hospital,
            "Room Number",
            "Admission Type",
            Medication,
            "Test Results",
            "Billing Amount",
            "Insurance Provider"
        FROM patients
        WHERE Patient_ID = ?
        LIMIT 1
    """, (
        patient_id,
    )).fetchone()

    conn.close()

    if patient is None:

        return jsonify({
            "success": False,
            "message": "Patient record not found."
        }), 404

    patient_data = dict(patient)

    # Round billing amount
    if patient_data["Billing Amount"] is not None:

        patient_data["Billing Amount"] = round(
            patient_data["Billing Amount"],
            2
        )

    return jsonify({
        "success": True,
        "message": "Login successful.",
        "patient": patient_data
    })


# =====================================================
# CORS
# =====================================================

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, OPTIONS"
    return response


# =====================================================
# HOME
# =====================================================

@app.route("/")
def home():
    return jsonify({
        "message": "MediLens API is running successfully!",
        "database": "SQLite"
    })


# =====================================================
# SUMMARY
# =====================================================

@app.route("/api/summary")
def summary():

    conn = get_db_connection()

    query = """
        SELECT
            COUNT(*) AS total_patients,
            AVG(Age) AS average_age,
            AVG("Billing Amount") AS average_billing
        FROM patients
    """

    result = conn.execute(query).fetchone()

    avg_stay_query = """
        SELECT AVG(
            julianday("Discharge Date") -
            julianday("Date of Admission")
        ) AS average_stay
        FROM patients
    """

    stay_result = conn.execute(avg_stay_query).fetchone()

    conn.close()

    return jsonify({
        "total_patients": result["total_patients"],
        "average_age": round(result["average_age"], 2),
        "average_billing": round(result["average_billing"], 2),
        "average_length_of_stay": round(
            stay_result["average_stay"], 2
        )
    })


# =====================================================
# MEDICAL CONDITIONS
# =====================================================

@app.route("/api/conditions")
def conditions():

    conn = get_db_connection()

    query = """
        SELECT "Medical Condition", COUNT(*) AS count
        FROM patients
        GROUP BY "Medical Condition"
    """

    rows = conn.execute(query).fetchall()
    conn.close()

    data = {
        row["Medical Condition"]: row["count"]
        for row in rows
    }

    return jsonify(data)


# =====================================================
# GENDER
# =====================================================

@app.route("/api/gender")
def gender():

    conn = get_db_connection()

    query = """
        SELECT Gender, COUNT(*) AS count
        FROM patients
        GROUP BY Gender
    """

    rows = conn.execute(query).fetchall()
    conn.close()

    data = {
        row["Gender"]: row["count"]
        for row in rows
    }

    return jsonify(data)


# =====================================================
# ADMISSION TYPE
# =====================================================

@app.route("/api/admission")
def admission():

    conn = get_db_connection()

    query = """
        SELECT "Admission Type", COUNT(*) AS count
        FROM patients
        GROUP BY "Admission Type"
    """

    rows = conn.execute(query).fetchall()
    conn.close()

    data = {
        row["Admission Type"]: row["count"]
        for row in rows
    }

    return jsonify(data)


# =====================================================
# TEST RESULTS
# =====================================================

@app.route("/api/test-results")
def test_results():

    conn = get_db_connection()

    query = """
        SELECT "Test Results", COUNT(*) AS count
        FROM patients
        GROUP BY "Test Results"
    """

    rows = conn.execute(query).fetchall()
    conn.close()

    data = {
        row["Test Results"]: row["count"]
        for row in rows
    }

    return jsonify(data)


# =====================================================
# HOSPITALS
# =====================================================

@app.route("/api/hospitals")
def hospitals():

    conn = get_db_connection()

    query = """
        SELECT Hospital, COUNT(*) AS count
        FROM patients
        GROUP BY Hospital
        ORDER BY Hospital
    """

    rows = conn.execute(query).fetchall()
    conn.close()

    data = {
        row["Hospital"]: row["count"]
        for row in rows
    }

    return jsonify(data)


# =====================================================
# HOSPITAL SEARCH
# =====================================================

@app.route("/api/hospitals/search")
def search_hospitals():

    query_text = request.args.get("q", "").strip()

    if not query_text:
        return jsonify([])

    conn = get_db_connection()

    query = """
        SELECT Hospital, COUNT(*) AS count
        FROM patients
        WHERE Hospital LIKE ?
        GROUP BY Hospital
        ORDER BY Hospital
        LIMIT 15
    """

    rows = conn.execute(
        query,
        (f"%{query_text}%",)
    ).fetchall()

    conn.close()

    results = [
        {
            "hospital": row["Hospital"],
            "count": row["count"]
        }
        for row in rows
    ]

    return jsonify(results)


# =====================================================
# INSURANCE PROVIDERS
# =====================================================

@app.route("/api/insurance")
def insurance_providers():

    conn = get_db_connection()

    query = """
        SELECT "Insurance Provider", COUNT(*) AS count
        FROM patients
        GROUP BY "Insurance Provider"
    """

    rows = conn.execute(query).fetchall()
    conn.close()

    data = {
        row["Insurance Provider"]: row["count"]
        for row in rows
    }

    return jsonify(data)


# =====================================================
# MEDICATIONS
# =====================================================

@app.route("/api/medications")
def medications():

    conn = get_db_connection()

    query = """
        SELECT Medication, COUNT(*) AS count
        FROM patients
        GROUP BY Medication
    """

    rows = conn.execute(query).fetchall()
    conn.close()

    data = {
        row["Medication"]: row["count"]
        for row in rows
    }

    return jsonify(data)


# =====================================================
# FILTER DATA
# =====================================================

@app.route("/api/filter")
def filter_data():

    conn = get_db_connection()

    gender = request.args.get("gender", "All")
    condition = request.args.get("condition", "All")
    admission = request.args.get("admission", "All")
    test_result = request.args.get("test", "All")
    hospital = request.args.get("hospital", "All")

    conditions = []
    parameters = []

    if gender != "All":
        conditions.append("Gender = ?")
        parameters.append(gender)

    if condition != "All":
        conditions.append('"Medical Condition" = ?')
        parameters.append(condition)

    if admission != "All":
        conditions.append('"Admission Type" = ?')
        parameters.append(admission)

    if test_result != "All":
        conditions.append('"Test Results" = ?')
        parameters.append(test_result)

    if hospital != "All":
        conditions.append("Hospital = ?")
        parameters.append(hospital)

    where_clause = ""

    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    # Summary
    summary_query = f"""
        SELECT
            COUNT(*) AS total_patients,
            AVG(Age) AS average_age,
            AVG("Billing Amount") AS average_billing
        FROM patients
        {where_clause}
    """

    summary_result = conn.execute(
        summary_query,
        parameters
    ).fetchone()

    # Average stay
    stay_query = f"""
        SELECT AVG(
            julianday("Discharge Date") -
            julianday("Date of Admission")
        ) AS average_stay
        FROM patients
        {where_clause}
    """

    stay_result = conn.execute(
        stay_query,
        parameters
    ).fetchone()

    # Conditions
    condition_query = f"""
        SELECT "Medical Condition", COUNT(*) AS count
        FROM patients
        {where_clause}
        GROUP BY "Medical Condition"
    """

    condition_rows = conn.execute(
        condition_query,
        parameters
    ).fetchall()

    # Gender
    gender_query = f"""
        SELECT Gender, COUNT(*) AS count
        FROM patients
        {where_clause}
        GROUP BY Gender
    """

    gender_rows = conn.execute(
        gender_query,
        parameters
    ).fetchall()

    # Admission
    admission_query = f"""
        SELECT "Admission Type", COUNT(*) AS count
        FROM patients
        {where_clause}
        GROUP BY "Admission Type"
    """

    admission_rows = conn.execute(
        admission_query,
        parameters
    ).fetchall()

    # Test results
    test_query = f"""
        SELECT "Test Results", COUNT(*) AS count
        FROM patients
        {where_clause}
        GROUP BY "Test Results"
    """

    test_rows = conn.execute(
        test_query,
        parameters
    ).fetchall()

    conn.close()

    return jsonify({
        "total_patients": summary_result["total_patients"],

        "average_age": round(
            summary_result["average_age"], 2
        )
        if summary_result["average_age"] is not None
        else 0,

        "average_billing": round(
            summary_result["average_billing"], 2
        )
        if summary_result["average_billing"] is not None
        else 0,

        "average_length_of_stay": round(
            stay_result["average_stay"], 2
        )
        if stay_result["average_stay"] is not None
        else 0,

        "conditions": {
            row["Medical Condition"]: row["count"]
            for row in condition_rows
        },

        "gender": {
            row["Gender"]: row["count"]
            for row in gender_rows
        },

        "admission": {
            row["Admission Type"]: row["count"]
            for row in admission_rows
        },

        "test_results": {
            row["Test Results"]: row["count"]
            for row in test_rows
        }
    })


# =====================================================
# GET PATIENTS
# =====================================================

@app.route("/api/patients", methods=["GET"])
def patients():

    conn = get_db_connection()

    search = request.args.get("search", "").strip()

    gender = request.args.get("gender", "All")
    condition = request.args.get("condition", "All")
    admission = request.args.get("admission", "All")

    try:
        page = int(request.args.get("page", 1))
    except ValueError:
        page = 1

    try:
        per_page = int(request.args.get("per_page", 10))
    except ValueError:
        per_page = 10

    if per_page not in [10, 25, 50]:
        per_page = 10

    if page < 1:
        page = 1

    conditions = []
    parameters = []

    # Search by Patient ID
    if search:

        conditions.append("""
            (
                LOWER(Patient_ID) LIKE ?
                OR LOWER("Medical Condition") LIKE ?
                OR LOWER("Admission Type") LIKE ?
            )
        """)

        search_value = f"%{search.lower()}%"

        parameters.extend([
            search_value,
            search_value,
            search_value
        ])

    # Filters
    if gender != "All":
        conditions.append("Gender = ?")
        parameters.append(gender)

    if condition != "All":
        conditions.append('"Medical Condition" = ?')
        parameters.append(condition)

    if admission != "All":
        conditions.append('"Admission Type" = ?')
        parameters.append(admission)

    where_clause = ""

    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    # Total records
    count_query = f"""
        SELECT COUNT(*) AS total
        FROM patients
        {where_clause}
    """

    total = conn.execute(
        count_query,
        parameters
    ).fetchone()["total"]

    total_pages = (
        (total + per_page - 1) // per_page
        if total > 0
        else 1
    )

    if page > total_pages:
        page = total_pages

    offset = (page - 1) * per_page

    # Patient records
    query = f"""
        SELECT
            rowid AS id,
            Patient_ID,
            Name,
            Gender,
            Age,
            "Blood Type",
            "Date of Admission",
            "Discharge Date",
            "Admission Type",
            "Medical Condition",
            "Billing Amount",
            "Insurance Provider",
            Doctor,
            Hospital,
            "Room Number",
            Medication,
            "Test Results",
            record_source
        FROM patients
        {where_clause}
        LIMIT ? OFFSET ?
    """

    query_parameters = parameters + [
        per_page,
        offset
    ]

    rows = conn.execute(
        query,
        query_parameters
    ).fetchall()

    conn.close()

    patient_records = []

    for row in rows:

        patient = dict(row)

        patient["Billing Amount"] = (
            round(
                patient["Billing Amount"],
                2
            )
            if patient["Billing Amount"] is not None
            else "N/A"
        )

        patient_records.append(patient)

    return jsonify({
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "patients": patient_records
    })


# =====================================================
# ADD NEW PATIENT
# =====================================================

@app.route("/api/patients", methods=["POST"])
def add_patient():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "No patient data received."
        }), 400

    required_fields = [
        "Name",
        "Gender",
        "Age",
        "Blood Type",
        "Medical Condition",
        "Date of Admission",
        "Doctor",
        "Hospital",
        "Insurance Provider",
        "Billing Amount",
        "Room Number",
        "Admission Type",
        "Discharge Date",
        "Medication",
        "Test Results"
    ]

    missing_fields = [
        field
        for field in required_fields
        if field not in data
        or str(data[field]).strip() == ""
    ]

    if missing_fields:
        return jsonify({
            "success": False,
            "message": "Missing required fields.",
            "missing_fields": missing_fields
        }), 400

    try:

        conn = get_db_connection()

        query = """
            INSERT INTO patients (
                Name,
                Gender,
                Age,
                "Blood Type",
                "Medical Condition",
                "Date of Admission",
                Doctor,
                Hospital,
                "Insurance Provider",
                "Billing Amount",
                "Room Number",
                "Admission Type",
                "Discharge Date",
                Medication,
                "Test Results",
                record_source
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        values = (
            data["Name"],
            data["Gender"],
            int(data["Age"]),
            data["Blood Type"],
            data["Medical Condition"],
            data["Date of Admission"],
            data["Doctor"],
            data["Hospital"],
            data["Insurance Provider"],
            float(data["Billing Amount"]),
            int(data["Room Number"]),
            data["Admission Type"],
            data["Discharge Date"],
            data["Medication"],
            data["Test Results"],
            "New"
        )

        cursor = conn.execute(
            query,
            values
        )

        new_patient_rowid = cursor.lastrowid

        # Generate Patient ID for new patient
        new_patient_id = f"MLP{new_patient_rowid:05d}"

        conn.execute(
            """
            UPDATE patients
            SET Patient_ID = ?
            WHERE rowid = ?
            """,
            (
                new_patient_id,
                new_patient_rowid
            )
        )

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Patient added successfully!",
            "patient_id": new_patient_id
        }), 201

    except ValueError:

        return jsonify({
            "success": False,
            "message": (
                "Age, Billing Amount and Room Number "
                "must contain valid numbers."
            )
        }), 400

    except Exception as e:

        return jsonify({
            "success": False,
            "message": f"Error adding patient: {str(e)}"
        }), 500


# =====================================================
# NEWLY ADDED PATIENTS
# =====================================================

@app.route("/api/new-patients")
def new_patients():

    conn = get_db_connection()

    rows = conn.execute("""
        SELECT
            rowid AS id,
            Patient_ID,
            Name,
            Gender,
            Age,
            "Blood Type",
            "Date of Admission",
            "Discharge Date",
            "Admission Type",
            "Medical Condition",
            "Billing Amount",
            "Insurance Provider",
            Doctor,
            Hospital,
            "Room Number",
            Medication,
            "Test Results",
            record_source
        FROM patients
        WHERE record_source = 'New'
        ORDER BY rowid DESC
    """).fetchall()

    conn.close()

    patients = []

    for row in rows:

        patient = dict(row)

        patient["Billing Amount"] = (
            round(
                patient["Billing Amount"],
                2
            )
            if patient["Billing Amount"] is not None
            else "N/A"
        )

        patients.append(patient)

    return jsonify({
        "total": len(patients),
        "patients": patients
    })


# =====================================================
# UPDATE NEW PATIENT
# =====================================================

@app.route("/api/patients/<int:patient_id>", methods=["PUT"])
def update_patient(patient_id):

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "No data received"
        }), 400

    conn = get_db_connection()

    # Only New patients can be edited
    existing = conn.execute("""
        SELECT rowid
        FROM patients
        WHERE rowid = ?
        AND record_source = 'New'
    """, (patient_id,)).fetchone()

    if not existing:

        conn.close()

        return jsonify({
            "success": False,
            "message": "Only newly added patients can be edited."
        }), 404

    try:

        query = """
            UPDATE patients
            SET
                Name = ?,
                Age = ?,
                Gender = ?,
                "Blood Type" = ?,
                "Date of Admission" = ?,
                "Discharge Date" = ?,
                "Admission Type" = ?,
                "Room Number" = ?,
                "Medical Condition" = ?,
                Medication = ?,
                "Test Results" = ?,
                Doctor = ?,
                Hospital = ?,
                "Insurance Provider" = ?,
                "Billing Amount" = ?
            WHERE rowid = ?
        """

        conn.execute(
            query,
            (
                data.get("Name"),
                int(data.get("Age")),
                data.get("Gender"),
                data.get("Blood Type"),
                data.get("Date of Admission"),
                data.get("Discharge Date"),
                data.get("Admission Type"),
                int(data.get("Room Number")),
                data.get("Medical Condition"),
                data.get("Medication"),
                data.get("Test Results"),
                data.get("Doctor"),
                data.get("Hospital"),
                data.get("Insurance Provider"),
                float(data.get("Billing Amount")),
                patient_id
            )
        )

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Patient updated successfully!"
        })

    except ValueError:

        conn.rollback()
        conn.close()

        return jsonify({
            "success": False,
            "message": (
                "Age, Billing Amount and Room Number "
                "must contain valid numbers."
            )
        }), 400

    except Exception as e:

        conn.rollback()
        conn.close()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =====================================================
# DOWNLOAD CSV
# =====================================================

@app.route("/api/download")
def download_csv():

    conn = get_db_connection()

    gender = request.args.get("gender", "All")
    condition = request.args.get("condition", "All")
    admission = request.args.get("admission", "All")
    test_result = request.args.get("test", "All")
    search = request.args.get("search", "").strip()

    conditions = []
    parameters = []

    # Search by Patient ID
    if search:

        conditions.append("""
            (
                LOWER(Patient_ID) LIKE ?
                OR LOWER("Medical Condition") LIKE ?
                OR LOWER("Admission Type") LIKE ?
            )
        """)

        search_value = f"%{search.lower()}%"

        parameters.extend([
            search_value,
            search_value,
            search_value
        ])

    if gender != "All":
        conditions.append("Gender = ?")
        parameters.append(gender)

    if condition != "All":
        conditions.append('"Medical Condition" = ?')
        parameters.append(condition)

    if admission != "All":
        conditions.append('"Admission Type" = ?')
        parameters.append(admission)

    if test_result != "All":
        conditions.append('"Test Results" = ?')
        parameters.append(test_result)

    where_clause = ""

    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    query = f"""
        SELECT *
        FROM patients
        {where_clause}
    """

    rows = conn.execute(
        query,
        parameters
    ).fetchall()

    conn.close()

    data = [dict(row) for row in rows]

    result_df = pd.DataFrame(data)

    csv_data = result_df.to_csv(index=False)

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={
            "Content-Disposition":
            "attachment; filename=MediLens_Patient_Data.csv"
        }
    )


# =====================================================
# ANALYTICS APIs
# =====================================================

# 1. Average Billing by Medical Condition

@app.route("/api/analytics/billing-condition")
def billing_by_condition():

    conn = get_db_connection()

    query = """
        SELECT
            "Medical Condition" AS condition,
            ROUND(
                AVG("Billing Amount"),
                2
            ) AS average_billing
        FROM patients
        GROUP BY "Medical Condition"
        ORDER BY average_billing DESC
    """

    rows = conn.execute(query).fetchall()
    conn.close()

    return jsonify([
        {
            "condition": row["condition"],
            "average_billing": row["average_billing"]
        }
        for row in rows
    ])


# 2. Average Billing by Gender

@app.route("/api/analytics/billing-gender")
def billing_by_gender():

    conn = get_db_connection()

    query = """
        SELECT
            Gender AS gender,
            ROUND(
                AVG("Billing Amount"),
                2
            ) AS average_billing
        FROM patients
        GROUP BY Gender
    """

    rows = conn.execute(query).fetchall()
    conn.close()

    return jsonify([
        {
            "gender": row["gender"],
            "average_billing": row["average_billing"]
        }
        for row in rows
    ])


# 3. Admissions by Year

@app.route("/api/analytics/admissions-year")
def admissions_by_year():

    conn = get_db_connection()

    query = """
        SELECT
            strftime(
                '%Y',
                "Date of Admission"
            ) AS year,
            COUNT(*) AS admissions
        FROM patients
        GROUP BY year
        ORDER BY year
    """

    rows = conn.execute(query).fetchall()
    conn.close()

    return jsonify([
        {
            "year": row["year"],
            "admissions": row["admissions"]
        }
        for row in rows
    ])


# 4. Average Length of Stay by Medical Condition

@app.route("/api/analytics/stay-condition")
def stay_by_condition():

    conn = get_db_connection()

    query = """
        SELECT
            "Medical Condition" AS condition,
            ROUND(
                AVG(
                    julianday("Discharge Date") -
                    julianday("Date of Admission")
                ),
                2
            ) AS average_stay
        FROM patients
        GROUP BY "Medical Condition"
        ORDER BY average_stay DESC
    """

    rows = conn.execute(query).fetchall()
    conn.close()

    return jsonify([
        {
            "condition": row["condition"],
            "average_stay": row["average_stay"]
        }
        for row in rows
    ])


# 5. Patients by Insurance Provider

@app.route("/api/analytics/insurance")
def insurance_analysis():

    conn = get_db_connection()

    query = """
        SELECT
            "Insurance Provider" AS provider,
            COUNT(*) AS patients
        FROM patients
        GROUP BY "Insurance Provider"
        ORDER BY patients DESC
    """

    rows = conn.execute(query).fetchall()
    conn.close()

    return jsonify([
        {
            "provider": row["provider"],
            "patients": row["patients"]
        }
        for row in rows
    ])


# 6. Medication Distribution

@app.route("/api/analytics/medication")
def medication_analysis():

    conn = get_db_connection()

    query = """
        SELECT
            Medication AS medication,
            COUNT(*) AS patients
        FROM patients
        GROUP BY Medication
        ORDER BY patients DESC
    """

    rows = conn.execute(query).fetchall()
    conn.close()

    return jsonify([
        {
            "medication": row["medication"],
            "patients": row["patients"]
        }
        for row in rows
    ])


# 7. Age Group Distribution

@app.route("/api/analytics/age-groups")
def age_group_analysis():

    conn = get_db_connection()

    query = """
        SELECT
            CASE
                WHEN Age <= 18 THEN '0-18'
                WHEN Age <= 35 THEN '19-35'
                WHEN Age <= 50 THEN '36-50'
                WHEN Age <= 65 THEN '51-65'
                ELSE '65+'
            END AS age_group,
            COUNT(*) AS patients
        FROM patients
        GROUP BY age_group
        ORDER BY
            CASE age_group
                WHEN '0-18' THEN 1
                WHEN '19-35' THEN 2
                WHEN '36-50' THEN 3
                WHEN '51-65' THEN 4
                WHEN '65+' THEN 5
            END
    """

    rows = conn.execute(query).fetchall()
    conn.close()

    return jsonify([
        {
            "age_group": row["age_group"],
            "patients": row["patients"]
        }
        for row in rows
    ])


# 8. Billing vs Length of Stay

@app.route("/api/analytics/billing-stay")
def billing_vs_stay():

    conn = get_db_connection()

    query = """
        SELECT
            Age,
            "Billing Amount" AS billing_amount,
            (
                julianday("Discharge Date") -
                julianday("Date of Admission")
            ) AS length_of_stay,
            "Medical Condition" AS condition
        FROM patients
        WHERE "Billing Amount" IS NOT NULL
        AND "Date of Admission" IS NOT NULL
        AND "Discharge Date" IS NOT NULL
        LIMIT 5000
    """

    rows = conn.execute(query).fetchall()
    conn.close()

    return jsonify([
        {
            "age": row["Age"],
            "billing_amount": row["billing_amount"],
            "length_of_stay": row["length_of_stay"],
            "condition": row["condition"]
        }
        for row in rows
    ])


# =====================================================
# MACHINE LEARNING PREDICTION
# =====================================================

@app.route("/api/predict", methods=["POST"])
def predict_test_result():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "No prediction data received."
            }), 400


        # ============================================
        # GET PATIENT ID
        # ============================================

        patient_id = str(
            data.get("patient_id", "")
        ).strip()


        if not patient_id:

            return jsonify({
                "success": False,
                "message": "Patient ID is required."
            }), 400


        # ============================================
        # GET PATIENT FROM DATABASE
        # ============================================

        conn = get_db_connection()

        patient = conn.execute("""
            SELECT
                Patient_ID,
                Name,
                Age,
                Gender,
                "Blood Type",
                "Medical Condition",
                "Admission Type",
                "Billing Amount",
                "Insurance Provider",
                Medication
            FROM patients
            WHERE Patient_ID = ?
            LIMIT 1
        """, (
            patient_id,
        )).fetchone()

        conn.close()


        # ============================================
        # PATIENT NOT FOUND
        # ============================================

        if patient is None:

            return jsonify({
                "success": False,
                "message": f"Patient ID '{patient_id}' was not found."
            }), 404


        # ============================================
        # CONVERT DATABASE RECORD TO DICTIONARY
        # ============================================

        patient_data = dict(patient)


        # ============================================
        # CHECK REQUIRED ML FEATURES
        # ============================================

        required_features = [
            "Age",
            "Gender",
            "Blood Type",
            "Medical Condition",
            "Admission Type",
            "Billing Amount",
            "Insurance Provider",
            "Medication"
        ]


        missing_fields = [
            field
            for field in required_features
            if patient_data.get(field) is None
            or str(patient_data.get(field)).strip() == ""
        ]


        if missing_fields:

            return jsonify({
                "success": False,
                "message": "Patient record is missing required ML data.",
                "missing_fields": missing_fields
            }), 400


        # ============================================
        # CREATE MODEL INPUT
        # ============================================

        input_data = pd.DataFrame([{

            "Age": float(
                patient_data["Age"]
            ),

            "Gender":
                patient_data["Gender"],

            "Blood Type":
                patient_data["Blood Type"],

            "Medical Condition":
                patient_data["Medical Condition"],

            "Admission Type":
                patient_data["Admission Type"],

            "Billing Amount":
                float(
                    patient_data["Billing Amount"]
                ),

            "Insurance Provider":
                patient_data["Insurance Provider"],

            "Medication":
                patient_data["Medication"]

        }])


        # ============================================
        # MAKE PREDICTION
        # ============================================

        prediction = model.predict(
            input_data
        )[0]


        # ============================================
        # GET MODEL CONFIDENCE
        # ============================================

        confidence = None

        if hasattr(model, "predict_proba"):

            probabilities = model.predict_proba(
                input_data
            )[0]

            confidence = float(
                max(probabilities) * 100
            )


        # ============================================
        # RESPONSE
        # ============================================

        response_data = {

            "success": True,

            "patient_id":
                patient_data["Patient_ID"],

            "patient_name":
                patient_data["Name"],

            "prediction":
                str(prediction),

            "confidence":
                round(
                    confidence,
                    2
                )
                if confidence is not None
                else None

        }


        return jsonify(
            response_data
        )


    except ValueError:

        return jsonify({
            "success": False,
            "message": (
                "Patient Age and Billing Amount "
                "must contain valid numbers."
            )
        }), 400


    except Exception as e:

        return jsonify({
            "success": False,
            "message": f"Prediction error: {str(e)}"
        }), 500


# =====================================================
# RUN SERVER
# =====================================================



# =====================================================
# PATIENT CARE PLAN APIs
# =====================================================

@app.route("/api/care-plans/<patient_id>", methods=["GET"])
def get_care_plan(patient_id):
    conn = get_db_connection()

    try:
        patient = conn.execute("""
            SELECT Patient_ID, Name, "Medical Condition"
            FROM patients
            WHERE Patient_ID = ?
            LIMIT 1
        """, (patient_id,)).fetchone()

        if patient is None:
            return jsonify({
                "success": False,
                "message": "Patient not found."
            }), 404

        care_plan = conn.execute("""
            SELECT *
            FROM care_plans
            WHERE patient_id = ?
            ORDER BY id DESC
            LIMIT 1
        """, (patient_id,)).fetchone()

        return jsonify({
            "success": True,
            "patient": dict(patient),
            "care_plan": dict(care_plan) if care_plan else None
        })

    finally:
        conn.close()


@app.route("/api/care-plans", methods=["POST"])
def save_care_plan():
    data = request.get_json(silent=True) or {}

    patient_id = str(data.get("patient_id", "")).strip()
    status = str(data.get("doctor_reviewed_status", "")).strip()
    instructions = str(data.get("care_instructions", "")).strip()
    follow_up_date = str(data.get("follow_up_date", "")).strip()
    follow_up_purpose = str(data.get("follow_up_purpose", "")).strip()
    last_reviewed_date = str(data.get("last_reviewed_date", "")).strip()

    if not patient_id:
        return jsonify({
            "success": False,
            "message": "Patient ID is required."
        }), 400

    if not status or not instructions:
        return jsonify({
            "success": False,
            "message": "Doctor-reviewed status and care instructions are required."
        }), 400

    conn = get_db_connection()

    try:
        patient = conn.execute("""
            SELECT Patient_ID
            FROM patients
            WHERE Patient_ID = ?
            LIMIT 1
        """, (patient_id,)).fetchone()

        if patient is None:
            return jsonify({
                "success": False,
                "message": "Patient not found."
            }), 404

        conn.execute("""
            INSERT INTO care_plans (
                patient_id,
                doctor_reviewed_status,
                care_instructions,
                follow_up_date,
                follow_up_purpose,
                last_reviewed_date
            )
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            patient_id,
            status,
            instructions,
            follow_up_date or None,
            follow_up_purpose or None,
            last_reviewed_date or None
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Care plan saved successfully.",
            "patient_id": patient_id
        }), 201

    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({
            "success": False,
            "message": "Database error while saving care plan."
        }), 500

    finally:
        conn.close()



if __name__ == "__main__":
    app.run(debug=True)