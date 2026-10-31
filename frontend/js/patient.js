const API_URL = "http://127.0.0.1:5000";


/* =====================================================
   PATIENT LOGIN
===================================================== */

const patientLoginForm =
    document.getElementById("patientLoginForm");

const patientLoginId =
    document.getElementById("patientLoginId");

const patientLoginPassword =
    document.getElementById("patientLoginPassword");

const patientLoginBtn =
    document.getElementById("patientLoginBtn");

const patientLoginError =
    document.getElementById("patientLoginError");


if (patientLoginForm) {

    patientLoginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const patientId =
                patientLoginId.value.trim();

            const password =
                patientLoginPassword.value;


            // Clear old error
            patientLoginError.style.display = "none";
            patientLoginError.textContent = "";


            // Validation
            if (!patientId || !password) {

                patientLoginError.textContent =
                    "Please enter your Patient ID and password.";

                patientLoginError.style.display = "block";

                return;
            }


            // Disable login button
            patientLoginBtn.disabled = true;

            patientLoginBtn.textContent =
                "Logging in...";


            try {

                const response = await fetch(
                    `${API_URL}/api/patient-login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            patient_id: patientId,
                            password: password
                        })
                    }
                );


                const data = await response.json();


                if (!response.ok || !data.success) {

                    throw new Error(
                        data.message ||
                        "Invalid Patient ID or password."
                    );
                }


                /* =====================================
                   SAVE PATIENT SESSION
                ===================================== */

                sessionStorage.setItem(
                    "medilensPatient",
                    JSON.stringify(data.patient)
                );


                /* =====================================
                   LOGIN SUCCESS
                ===================================== */

                patientLoginBtn.textContent =
                    "Login Successful";


                /*
                    Small delay so the user can see
                    Login Successful, then redirect.
                */

                setTimeout(function () {

                    window.location.replace(
                        "patient-dashboard.html"
                    );

                }, 300);


            } catch (error) {

                console.error(
                    "Patient login error:",
                    error
                );


                patientLoginError.textContent =
                    error.message ||
                    "Unable to login. Please try again.";

                patientLoginError.style.display =
                    "block";


                patientLoginBtn.disabled = false;

                patientLoginBtn.textContent =
                    "Login to Patient Portal";
            }
        }
    );
}


/* =====================================================
   PATIENT DASHBOARD
===================================================== */

document.addEventListener("DOMContentLoaded", async function () {

        const dashboardContent =
            document.getElementById("dashboardContent");

        const dashboardLoading =
            document.getElementById("dashboardLoading");

        const dashboardError =
            document.getElementById("dashboardError");


        /*
            Agar current page dashboard nahi hai,
            to kuch mat karo.
        */

        if (!dashboardContent) {
            return;
        }


        /* =====================================
           GET SAVED PATIENT
        ===================================== */

        const savedPatient =
            sessionStorage.getItem("medilensPatient");


        /*
            Agar patient login nahi hai,
            login page par bhej do.
        */

        if (!savedPatient) {

            if (dashboardLoading) {
                dashboardLoading.style.display = "none";
            }

            window.location.replace(
                "patient-login.html"
            );

            return;
        }


        try {

            const patient =
                JSON.parse(savedPatient);


            /* =====================================
               WELCOME
            ===================================== */

            const patientName =
                document.getElementById("patientName");

            if (patientName) {
                patientName.textContent =
                    patient.Name || "Patient";
            }


            /* =====================================
               SUMMARY
            ===================================== */

            const summaryName =
                document.getElementById("summaryName");

            if (summaryName) {
                summaryName.textContent =
                    patient.Name || "—";
            }


            const summaryPatientId =
                document.getElementById("summaryPatientId");

            if (summaryPatientId) {
                summaryPatientId.textContent =
                    patient.Patient_ID || "—";
            }


            const summaryHospital =
                document.getElementById("summaryHospital");

            if (summaryHospital) {
                summaryHospital.textContent =
                    patient.Hospital || "—";
            }


            const summaryAdmissionType =
                document.getElementById(
                    "summaryAdmissionType"
                );

            if (summaryAdmissionType) {
                summaryAdmissionType.textContent =
                    patient["Admission Type"] || "—";
            }


            /* =====================================
               PERSONAL INFORMATION
            ===================================== */

            const patientId =
                document.getElementById("patientId");

            if (patientId) {
                patientId.textContent =
                    patient.Patient_ID || "—";
            }


            const patientAge =
                document.getElementById("patientAge");

            if (patientAge) {
                patientAge.textContent =
                    patient.Age ?? "—";
            }


            const patientGender =
                document.getElementById("patientGender");

            if (patientGender) {
                patientGender.textContent =
                    patient.Gender || "—";
            }


            const patientBloodType =
                document.getElementById(
                    "patientBloodType"
                );

            if (patientBloodType) {
                patientBloodType.textContent =
                    patient["Blood Type"] || "—";
            }


            /* =====================================
               MEDICAL INFORMATION
            ===================================== */

            const patientCondition =
                document.getElementById(
                    "patientCondition"
                );

            if (patientCondition) {
                patientCondition.textContent =
                    patient["Medical Condition"] || "—";
            }


            const patientTestResult =
    document.getElementById(
        "patientTestResult"
    );

if (patientTestResult) {

    const testResult =
        patient["Test Results"] || "—";

    patientTestResult.textContent =
        testResult;

    // Remove previous status classes
    patientTestResult.classList.remove(
        "test-result-normal",
        "test-result-abnormal",
        "test-result-inconclusive"
    );


    // Apply status style
    const result =
        testResult.toLowerCase().trim();


    if (result === "normal") {

        patientTestResult.classList.add(
            "test-result-normal"
        );

    }
    else if (result === "abnormal") {

        patientTestResult.classList.add(
            "test-result-abnormal"
        );

    }
    else if (result === "inconclusive") {

        patientTestResult.classList.add(
            "test-result-inconclusive"
        );
    }
}


            const patientMedication =
                document.getElementById(
                    "patientMedication"
                );

            if (patientMedication) {
                patientMedication.textContent =
                    patient.Medication || "—";
            }


            const patientDoctor =
                document.getElementById("patientDoctor");

            if (patientDoctor) {
                patientDoctor.textContent =
                    patient.Doctor || "—";
            }


            /* =====================================
               ADMISSION INFORMATION
            ===================================== */

            const patientAdmissionDate =
                document.getElementById(
                    "patientAdmissionDate"
                );

            if (patientAdmissionDate) {
                patientAdmissionDate.textContent =
                    patient["Date of Admission"] || "—";
            }


            const patientDischargeDate =
                document.getElementById(
                    "patientDischargeDate"
                );

            if (patientDischargeDate) {
                patientDischargeDate.textContent =
                    patient["Discharge Date"] || "—";
            }


            const patientAdmissionType =
                document.getElementById(
                    "patientAdmissionType"
                );

            if (patientAdmissionType) {
                patientAdmissionType.textContent =
                    patient["Admission Type"] || "—";
            }


            const patientRoom =
                document.getElementById("patientRoom");

            if (patientRoom) {
                patientRoom.textContent =
                    patient["Room Number"] || "—";
            }


            /* =====================================
   ADMISSION TIMELINE
===================================== */

const timelineAdmissionDate =
    document.getElementById(
        "timelineAdmissionDate"
    );

if (timelineAdmissionDate) {

    timelineAdmissionDate.textContent =
        patient["Date of Admission"] || "—";
}


const timelineDischargeDate =
    document.getElementById(
        "timelineDischargeDate"
    );

if (timelineDischargeDate) {

    timelineDischargeDate.textContent =
        patient["Discharge Date"] || "—";
}


            /* =====================================
               HOSPITAL & INSURANCE
            ===================================== */

            const patientHospital =
                document.getElementById(
                    "patientHospital"
                );

            if (patientHospital) {
                patientHospital.textContent =
                    patient.Hospital || "—";
            }


            const patientInsurance =
                document.getElementById(
                    "patientInsurance"
                );

            if (patientInsurance) {
                patientInsurance.textContent =
                    patient["Insurance Provider"] || "—";
            }


            /* =====================================
               BILLING
            ===================================== */

            const patientBilling =
                document.getElementById(
                    "patientBilling"
                );

            const billing =
                Number(patient["Billing Amount"]);


            if (
                patientBilling &&
                !isNaN(billing)
            ) {

                patientBilling.textContent =
                    "₹" +
                    billing.toLocaleString(
                        "en-IN",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    );

            } else if (patientBilling) {

                patientBilling.textContent =
                    "₹0.00";
            }


            
/* =====================================
   LOAD PATIENT CARE PLAN
===================================== */

const carePlanLoading = document.getElementById("carePlanLoading");
const carePlanDetails = document.getElementById("carePlanDetails");
const carePlanEmpty = document.getElementById("carePlanEmpty");

try {
    const careResponse = await fetch(
        `${API_URL}/api/care-plans/${encodeURIComponent(patient.Patient_ID)}`
    );

    const careData = await careResponse.json();

    if (!careResponse.ok || !careData.success) {
        throw new Error(careData.message || "Unable to load care plan.");
    }

    const carePlan = careData.care_plan;

    if (carePlan) {
        document.getElementById("portalCareStatus").textContent =
            carePlan.doctor_reviewed_status || "Not specified";

        document.getElementById("portalCareInstructions").textContent =
            carePlan.care_instructions || "No instructions added.";

        document.getElementById("portalFollowUpDate").textContent =
            carePlan.follow_up_date || "Not scheduled";

        document.getElementById("portalFollowUpPurpose").textContent =
            carePlan.follow_up_purpose || "Not specified";

        document.getElementById("portalLastReviewed").textContent =
            carePlan.last_reviewed_date || "Not available";

        if (carePlanLoading) {
            carePlanLoading.style.display = "none";
        }

        if (carePlanDetails) {
            carePlanDetails.style.display = "block";
        }

    } else {
        if (carePlanLoading) {
            carePlanLoading.style.display = "none";
        }

        if (carePlanEmpty) {
            carePlanEmpty.style.display = "block";
        }
    }

} catch (careError) {
    console.error("Care Plan loading error:", careError);

    if (carePlanLoading) {
        carePlanLoading.style.display = "none";
    }

    if (carePlanEmpty) {
        carePlanEmpty.style.display = "block";
        carePlanEmpty.textContent =
            "Unable to load care plan. Please try again later.";
    }
}



            /* =====================================
               SHOW DASHBOARD
            ===================================== */

            if (dashboardLoading) {
                dashboardLoading.style.display =    
                    "none";
            }

            dashboardContent.style.display =
                "block";


        } catch (error) {

            console.error(
                "Dashboard loading error:",
                error
            );


            if (dashboardLoading) {
                dashboardLoading.style.display =
                    "none";
            }

            if (dashboardError) {
                dashboardError.style.display =
                    "block";
            }
        }
    }
);


/* =====================================================
   PATIENT LOGOUT
===================================================== */

const patientLogoutBtn =
    document.getElementById(
        "patientLogoutBtn"
    );


if (patientLogoutBtn) {

    patientLogoutBtn.addEventListener(
        "click",
        function () {

            /*
                Completely remove current
                patient session.
            */

            sessionStorage.removeItem(
                "medilensPatient"
            );


            /*
                Immediately go back to
                login page.
            */

            window.location.replace(
                "patient-login.html"
            );
        }
    );
}