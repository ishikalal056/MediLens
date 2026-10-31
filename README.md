# MediLens – Healthcare Analytics & Patient Management System

<p align="center">
  <img src="frontend/images/medilens-logo.png" alt="MediLens Logo" width="120"/>
</p>

<h3 align="center">Making Healthcare Data More Meaningful</h3>

<p align="center">
  A Web-Based Healthcare Analytics and Management Application
</p>

---

## About the Project

MediLens is a web-based healthcare application developed to manage patient records and explore healthcare data through interactive dashboards and visual reports.

The project brings together healthcare data analysis, patient management, a machine learning model, and a separate Patient Portal. It allows administrators to view patient information, analyze healthcare records, and manage patient care plans.

The main aim of MediLens is to make healthcare information easier to organize, access, and understand.

## Features

### 1. Healthcare Dashboard
- Displays overall patient statistics.
- Shows healthcare data through interactive charts.
- Provides insights into medical conditions and admission types.
- Includes billing and patient record analysis.
- Offers filters to explore specific patient records.

### 2. Patient Management
- View existing patient records.
- Add new patient details.
- Search and update patient information.
- Maintain patient IDs.
- Store patient records in an SQLite database.

### 3. Machine Learning Prediction
- Uses a Random Forest classification model.
- Predicts the Test Results category using available patient attributes.
- Supports three result categories:
  - Normal
  - Abnormal
  - Inconclusive
- Model training and evaluation are performed using Python and Scikit-learn.

### 4. Patient Portal
- Separate patient login page.
- Individual patient dashboard.
- Displays patient and medical information.
- Shows admission and billing details.
- Provides access to the patient's care plan.

### 5. Care Plan Management
- Admin can add and update patient care plans.
- Displays doctor-reviewed status.
- Stores care instructions.
- Includes next follow-up date and purpose.
- Records the last reviewed date.
- Updated information is visible in the respective Patient Portal.

## Technologies Used

| Category | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Python, Flask |
| Database | SQLite |
| Data Analysis | Pandas, NumPy |
| Machine Learning | Scikit-learn |
| ML Algorithm | Random Forest |
| Charts | Chart.js |
| IDE | Visual Studio Code |
| Notebook Environment | Jupyter Notebook |
| Version Control | Git and GitHub |

## Project Structure

```text
MediLens/
│
├── backend/
│   ├── add_patient_ids.py
│   ├── app.py
│   ├── care_plan.py
│   ├── database.py
│   ├── medilens.db
│   ├── migrate_database.py
│   └── patient_auth.py
│
├── data/
│   └── healthcare_dataset.csv
│
├── frontend/
│   ├── css/
│   │   └── style.css
│   │
│   ├── images/
│   │   └── medilens-logo.png
│   │
│   ├── js/
│   │   ├── patient.js
│   │   └── script.js
│   │
│   ├── index.html
│   ├── patient-dashboard.html
│   └── patient-login.html
│
├── ml/
│   ├── medilens_model.pkl
│   └── train_model.py
│
├── notebooks/
│   └── healthcare_analysis.ipynb
│
└── README.md
```

## Dataset

The project uses a healthcare dataset containing approximately 55,500 records.

Some of the main columns in the dataset are:

- Name
- Age
- Gender
- Blood Type
- Medical Condition
- Date of Admission
- Doctor
- Hospital
- Insurance Provider
- Billing Amount
- Room Number
- Admission Type
- Discharge Date
- Medication
- Test Results

The dataset is used for data cleaning, analysis, visualization, and machine learning experiments.

## Machine Learning Model

MediLens includes a Random Forest classification model that works with patient-related attributes to predict the Test Results category.

The model development process includes:

1. Loading the healthcare dataset.
2. Cleaning and preparing the data.
3. Performing Exploratory Data Analysis (EDA).
4. Preparing features for model training.
5. Training the Random Forest classifier.
6. Evaluating the model.
7. Saving the trained model.
8. Connecting the model with the Flask backend.

The trained model is saved as:

```text
ml/medilens_model.pkl
```

**Note:** The machine learning model is developed for academic and experimental purposes. Its predictions are not clinically validated and should not be treated as medical advice or diagnosis.

## Installation and Setup

Follow these steps to run the project on your local machine.

### Prerequisites

- Python 3.x
- Visual Studio Code
- Live Server Extension
- Git (optional)

### Step 1: Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### Step 2: Open the Project Folder

```bash
cd MediLens
```

### Step 3: Install Dependencies

```bash
pip install flask flask-cors pandas numpy scikit-learn
```

Install any additional packages required by the project.

### Step 4: Start the Backend

Open the terminal and navigate to the backend folder:

```bash
cd backend
```

Run the Flask application:

```bash
python app.py
```

The backend will run at:

```text
http://127.0.0.1:5000
```

### Step 5: Start the Frontend

1. Open the project in Visual Studio Code.
2. Open the `frontend` folder.
3. Right-click on `index.html`.
4. Select **Open with Live Server**.

### Step 6: Open the Patient Portal

Open the patient login page using Live Server:

```text
http://127.0.0.1:5500/frontend/patient-login.html
```

Log in using a valid Patient ID and the configured password.

## Database

MediLens uses SQLite to store and manage patient information.

Database file:

```text
backend/medilens.db
```

The database is used for:

- Storing patient records.
- Managing patient IDs.
- Retrieving patient information.
- Creating and updating care plans.
- Displaying patient-specific information in the portal.

## How the Application Works

1. Healthcare data is loaded into the project.
2. The Flask backend handles application requests.
3. The Admin Dashboard displays patient statistics and healthcare analysis.
4. Administrators can search, add, and update patient records.
5. The machine learning model provides experimental Test Results predictions.
6. Administrators can create and update patient care plans.
7. Patients can log in and view their own information and care plans.

## Future Improvements

- Improve machine learning model performance.
- Add more healthcare reports and visualizations.
- Improve patient authentication and access control.
- Strengthen patient data security.
- Add more patient monitoring features.
- Deploy the application to a secure hosting environment.

## Security and Disclaimer

MediLens is an academic project developed for learning and demonstration purposes.

The current version is a prototype. Before real-world use, proper authentication, authorization, password protection, and patient data security measures must be implemented.

The machine learning predictions are experimental and are not intended to replace professional medical advice, diagnosis, or treatment.

## Developed By

**Ishika**

B.Tech – Computer Science and Engineering

Bhagat Phool Singh Mahila Vishwavidyalaya, Khanpur Kalan, Sonipat

---

<p align="center">
  <b>MediLens – Making Healthcare Data More Meaningful.</b>
</p>