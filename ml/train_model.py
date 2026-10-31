# ============================================================
# MEDILENS - MACHINE LEARNING MODEL TRAINING
# Predicting Test Results
# ============================================================

import os
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)


# ============================================================
# 1. PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(
    BASE_DIR,
    "..",
    "data",
    "healthcare_dataset.csv"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "medilens_model.pkl"
)


# ============================================================
# 2. LOAD DATASET
# ============================================================

print("\n==============================================")
print("       MEDILENS ML MODEL TRAINING")
print("==============================================")

print("\nReading healthcare dataset...")

df = pd.read_csv(DATA_PATH)

print(f"Dataset loaded successfully!")
print(f"Total records: {len(df)}")


# ============================================================
# 3. BASIC DATA CLEANING
# ============================================================

print("\nCleaning data...")

# Remove completely empty rows
df = df.dropna(how="all")

# Remove duplicate records
df = df.drop_duplicates()

# Remove negative billing amounts
if "Billing Amount" in df.columns:
    df = df[df["Billing Amount"] >= 0]

print(f"Records after cleaning: {len(df)}")


# ============================================================
# 4. SELECT FEATURES AND TARGET
# ============================================================

target = "Test Results"

features = [
    "Age",
    "Gender",
    "Blood Type",
    "Medical Condition",
    "Admission Type",
    "Billing Amount",
    "Insurance Provider",
    "Medication"
]

# Check required columns
required_columns = features + [target]

missing_columns = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing_columns:

    print("\nERROR!")
    print("The following columns are missing:")

    for column in missing_columns:
        print("-", column)

    raise ValueError("Required columns are missing from dataset.")


X = df[features].copy()
y = df[target].copy()


# ============================================================
# 5. CLEAN TARGET VALUES
# ============================================================

X = X.reset_index(drop=True)
y = y.reset_index(drop=True)

# Remove rows where target is missing
valid_rows = y.notna()

X = X.loc[valid_rows].reset_index(drop=True)
y = y.loc[valid_rows].reset_index(drop=True)

print("\nTarget classes:")

print(y.value_counts())


# ============================================================
# 6. DEFINE NUMERICAL AND CATEGORICAL FEATURES
# ============================================================

numeric_features = [
    "Age",
    "Billing Amount"
]

categorical_features = [
    "Gender",
    "Blood Type",
    "Medical Condition",
    "Admission Type",
    "Insurance Provider",
    "Medication"
]


# ============================================================
# 7. PREPROCESSING
# ============================================================

numeric_transformer = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="median")
        )
    ]
)


categorical_transformer = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="most_frequent")
        ),
        (
            "encoder",
            OneHotEncoder(
                handle_unknown="ignore"
            )
        )
    ]
)


preprocessor = ColumnTransformer(
    transformers=[
        (
            "num",
            numeric_transformer,
            numeric_features
        ),
        (
            "cat",
            categorical_transformer,
            categorical_features
        )
    ]
)


# ============================================================
# 8. TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


print("\nTraining data:", len(X_train))
print("Testing data :", len(X_test))


# ============================================================
# 9. DEFINE ML MODELS
# ============================================================

models = {

    "Logistic Regression":
        LogisticRegression(
            max_iter=1000
        ),

    "Decision Tree":
        DecisionTreeClassifier(
            random_state=42
        ),

    "Random Forest":
        RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            n_jobs=-1
        ),

    "Gradient Boosting":
        GradientBoostingClassifier(
            random_state=42
        )
}


# ============================================================
# 10. TRAIN AND EVALUATE MODELS
# ============================================================

results = {}

best_model = None
best_model_name = None
best_f1 = -1


print("\n==============================================")
print("          MODEL EVALUATION")
print("==============================================")


for model_name, model in models.items():

    print(f"\nTraining {model_name}...")

    pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                preprocessor
            ),
            (
                "model",
                model
            )
        ]
    )

    pipeline.fit(
        X_train,
        y_train
    )

    predictions = pipeline.predict(X_test)

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    precision = precision_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0
    )

    recall = recall_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0
    )

    f1 = f1_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0
    )


    results[model_name] = {

        "Accuracy": accuracy,
        "Precision": precision,
        "Recall": recall,
        "F1 Score": f1

    }


    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1 Score : {f1:.4f}")


    # Select model based on F1 score
    if f1 > best_f1:

        best_f1 = f1

        best_model = pipeline

        best_model_name = model_name


# ============================================================
# 11. DISPLAY MODEL COMPARISON
# ============================================================

print("\n==============================================")
print("          MODEL COMPARISON")
print("==============================================")

results_df = pd.DataFrame(results).T

print(
    results_df.round(4)
)


# ============================================================
# 12. BEST MODEL
# ============================================================

print("\n==============================================")
print("            SELECTED MODEL")
print("==============================================")

print(
    f"Selected model: {best_model_name}"
)

print(
    f"F1 Score: {best_f1:.4f}"
)


# ============================================================
# 13. FINAL EVALUATION
# ============================================================

final_predictions = best_model.predict(
    X_test
)


print("\nClassification Report:")

print(
    classification_report(
        y_test,
        final_predictions,
        zero_division=0
    )
)


print("\nConfusion Matrix:")

print(
    confusion_matrix(
        y_test,
        final_predictions
    )
)


# ============================================================
# 14. SAVE TRAINED MODEL
# ============================================================

joblib.dump(
    best_model,
    MODEL_PATH
)


print("\n==============================================")
print("        MODEL SAVED SUCCESSFULLY")
print("==============================================")

print(
    f"Model file: {MODEL_PATH}"
)

print("\nMediLens ML training completed!")