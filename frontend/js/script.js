// =====================================================
// MediLens - Frontend JavaScript
// =====================================================

const API_URL = "http://127.0.0.1:5000";

// =====================================================
// GLOBAL VARIABLES
// =====================================================

let conditionChart = null;
let genderChart = null;
let admissionChart = null;
let testChart = null;

// =====================================================
// ANALYTICS CHART VARIABLES
// =====================================================

let billingConditionChart = null;
let stayConditionChart = null;
let admissionsYearChart = null;
let ageGroupChart = null;
let insuranceChart = null;
let billingGenderChart = null;

let currentPage = 1;
let rowsPerPage = 10;

// Patient view:
// "all" = all patients
// "new" = newly added patients
let patientView = "all";

// Used while editing a newly added patient
let editingPatientId = null;


// =====================================================
// DOM ELEMENTS
// =====================================================

const genderFilter = document.getElementById("genderFilter");
const conditionFilter = document.getElementById("conditionFilter");
const admissionFilter = document.getElementById("admissionFilter");
const testFilter = document.getElementById("testFilter");
const hospitalFilter = document.getElementById("hospitalFilter");
const resetButton = document.getElementById("resetFilters");


// =====================================================
// GET CURRENT FILTERS
// =====================================================

function getCurrentFilters() {
    return {
        gender: genderFilter ? genderFilter.value : "All",
        condition: conditionFilter ? conditionFilter.value : "All",
        admission: admissionFilter ? admissionFilter.value : "All",
        test: testFilter ? testFilter.value : "All",
        hospital: hospitalFilter ? hospitalFilter.value : "All"
    };
}


// =====================================================
// POPULATE FILTER
// =====================================================

function populateFilter(selectElement, data) {

    if (!selectElement) return;

    selectElement.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "All";
    allOption.textContent = "All";

    selectElement.appendChild(allOption);

    Object.keys(data || {}).forEach(item => {

        const option = document.createElement("option");

        option.value = item;
        option.textContent = item;

        selectElement.appendChild(option);
    });
}

// =====================================================
// POPULATE MEDICAL CONDITION FOR ADD PATIENT FORM
// =====================================================

function populateMedicalConditionForm(conditions) {

    const medicalCondition =
        document.getElementById("medicalCondition");

    if (!medicalCondition) return;

    medicalCondition.innerHTML = "";

    // Default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Medical Condition";
    medicalCondition.appendChild(defaultOption);

    // Existing conditions from database
    Object.keys(conditions || {}).forEach(condition => {

        const option =
            document.createElement("option");

        option.value = condition;
        option.textContent = condition;

        medicalCondition.appendChild(option);
    });

    // Other option for completely new conditions
    const otherOption =
        document.createElement("option");

    otherOption.value = "Other";
    otherOption.textContent = "Other";

    medicalCondition.appendChild(otherOption);
}


// =====================================================
// LOAD FILTER OPTIONS
// =====================================================

async function loadFilterOptions() {

    try {

        const [
            conditionResponse,
            genderResponse,
            admissionResponse,
            testResponse
        ] = await Promise.all([

            fetch(`${API_URL}/api/conditions`),

            fetch(`${API_URL}/api/gender`),

            fetch(`${API_URL}/api/admission`),

            fetch(`${API_URL}/api/test-results`)

        ]);

        if (
            !conditionResponse.ok ||
            !genderResponse.ok ||
            !admissionResponse.ok ||
            !testResponse.ok
        ) {
            throw new Error("Unable to load filter options");
        }

        const conditions =
            await conditionResponse.json();

        const genders =
            await genderResponse.json();

        const admissions =
            await admissionResponse.json();

        const tests =
            await testResponse.json();

        populateFilter(
            conditionFilter,
            conditions
        );

        populateMedicalConditionForm(
            conditions
        );

        populateFilter(
            genderFilter,
            genders
        );

        populateFilter(
            admissionFilter,
            admissions
        );

        populateFilter(
            testFilter,
            tests
        );

    } catch (error) {

        console.error(
            "Filter loading error:",
            error
        );

    }
}


// =====================================================
// LOAD FILTERED DASHBOARD
// =====================================================

async function loadFilteredDashboard() {

    try {

        const filters = getCurrentFilters();

        const url =
            `${API_URL}/api/filter` +
            `?gender=${encodeURIComponent(filters.gender)}` +
            `&condition=${encodeURIComponent(filters.condition)}` +
            `&admission=${encodeURIComponent(filters.admission)}` +
            `&test=${encodeURIComponent(filters.test)}` +
            `&hospital=${encodeURIComponent(filters.hospital)}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Dashboard API failed");
        }

        const data = await response.json();

        updateKPIs(data);

        updateConditionChart(data.conditions);

        updateGenderChart(data.gender);

        updateAdmissionChart(data.admission);

        updateTestChart(data.test_results);

        updateInsights(data);

    } catch (error) {

        console.error("Dashboard error:", error);
    }
}


// =====================================================
// UPDATE KPI CARDS
// =====================================================

function updateKPIs(data) {

    const totalPatients =
        document.getElementById("totalPatients");

    const averageBilling =
        document.getElementById("averageBilling");

    const averageAge =
        document.getElementById("averageAge");

    const averageStay =
        document.getElementById("averageStay");


    if (totalPatients) {

        totalPatients.textContent =
            Number(data.total_patients || 0)
                .toLocaleString();
    }


    if (averageBilling) {

        averageBilling.textContent =
            "$" +
            Number(data.average_billing || 0)
                .toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
    }


    if (averageAge) {

        averageAge.textContent =
            `${data.average_age || 0} yrs`;
    }


    if (averageStay) {

        averageStay.textContent =
            `${data.average_length_of_stay || 0} days`;
    }
}


// =====================================================
// CONDITION CHART
// =====================================================

function updateConditionChart(data) {

    const canvas =
        document.getElementById("conditionChart");

    if (!canvas) return;

    const labels = Object.keys(data || {});
    const values = Object.values(data || {});


    if (conditionChart) {

        conditionChart.data.labels = labels;

        conditionChart.data.datasets[0].data =
            values;

        conditionChart.update();

        return;
    }


    conditionChart = new Chart(canvas, {

        type: "bar",

        data: {

            labels: labels,

            datasets: [

                {
                    label: "Patients",

                    data: values,

                    backgroundColor: [
                        "#2563eb",
                        "#14b8a6",
                        "#8b5cf6",
                        "#f59e0b",
                        "#ef4444",
                        "#06b6d4"
                    ],

                    borderRadius: 6
                }
            ]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                }
            },

            scales: {

                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


// =====================================================
// GENDER CHART
// =====================================================

function updateGenderChart(data) {

    const canvas =
        document.getElementById("genderChart");

    if (!canvas) return;

    const labels = Object.keys(data || {});
    const values = Object.values(data || {});


    if (genderChart) {

        genderChart.data.labels = labels;

        genderChart.data.datasets[0].data =
            values;

        genderChart.update();

        return;
    }


    genderChart = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels: labels,

            datasets: [

                {
                    data: values,

                    backgroundColor: [
                        "#2563eb",
                        "#ec4899",
                        "#14b8a6"
                    ],

                    borderWidth: 2
                }
            ]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    position: "bottom"
                }
            }
        }
    });
}


// =====================================================
// ADMISSION CHART
// =====================================================

function updateAdmissionChart(data) {

    const canvas =
        document.getElementById("admissionChart");

    if (!canvas) return;

    const labels = Object.keys(data || {});
    const values = Object.values(data || {});


    if (admissionChart) {

        admissionChart.data.labels = labels;

        admissionChart.data.datasets[0].data =
            values;

        admissionChart.update();

        return;
    }


    admissionChart = new Chart(canvas, {

        type: "bar",

        data: {

            labels: labels,

            datasets: [

                {
                    label: "Admissions",

                    data: values,

                    backgroundColor: [
                        "#14b8a6",
                        "#8b5cf6",
                        "#f59e0b"
                    ],

                    borderRadius: 6
                }
            ]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                }
            },

            scales: {

                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


// =====================================================
// TEST RESULTS CHART
// =====================================================

function updateTestChart(data) {

    const canvas =
        document.getElementById("testChart");

    if (!canvas) return;

    const labels = Object.keys(data || {});
    const values = Object.values(data || {});


    if (testChart) {

        testChart.data.labels = labels;

        testChart.data.datasets[0].data =
            values;

        testChart.update();

        return;
    }


    testChart = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels: labels,

            datasets: [

                {
                    data: values,

                    backgroundColor: [
                        "#14b8a6",
                        "#f59e0b",
                        "#ef4444"
                    ],

                    borderWidth: 2
                }
            ]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    position: "bottom"
                }
            }
        }
    });
}



// =====================================================
// INSIGHTS
// =====================================================

function updateInsights(data) {

    const insightOne =
        document.getElementById("insightOne");

    const insightTwo =
        document.getElementById("insightTwo");

    const insightThree =
        document.getElementById("insightThree");


    // =================================================
    // CONDITION INSIGHT
    // =================================================

    const conditions =
        data.conditions || {};

    let highestCondition = "N/A";
    let highestConditionCount = 0;

    Object.entries(conditions).forEach(
        ([condition, count]) => {

            if (Number(count) > highestConditionCount) {

                highestCondition =
                    condition;

                highestConditionCount =
                    Number(count);
            }
        }
    );


    // =================================================
    // GENDER INSIGHT
    // =================================================

    const genders =
        data.gender || {};

    let highestGender = "N/A";
    let highestGenderCount = 0;

    Object.entries(genders).forEach(
        ([gender, count]) => {

            if (Number(count) > highestGenderCount) {

                highestGender =
                    gender;

                highestGenderCount =
                    Number(count);
            }
        }
    );


    // =================================================
    // INSIGHT 1
    // =================================================

    if (insightOne) {

        insightOne.textContent =
            `${highestCondition} has the highest number of patients (${highestConditionCount.toLocaleString()}) in the selected dataset.`;
    }


    // =================================================
    // INSIGHT 2
    // =================================================

    if (insightTwo) {

        const totalPatients =
            Number(data.total_patients || 0);

        let percentage = 0;

        if (totalPatients > 0) {

            percentage =
                (
                    highestGenderCount /
                    totalPatients
                ) * 100;
        }

        insightTwo.textContent =
            `${highestGender} represents the largest patient group with ${highestGenderCount.toLocaleString()} patients (${percentage.toFixed(1)}%) in the selected dataset.`;
    }


    // =================================================
    // INSIGHT 3
    // =================================================

    if (insightThree) {

        const averageBilling =
            Number(data.average_billing || 0);

        const averageStay =
            Number(
                data.average_length_of_stay || 0
            );

        insightThree.textContent =
            `Average billing is $${averageBilling.toLocaleString(
                "en-US",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )}, with an average stay of ${averageStay.toFixed(1)} days.`;
    }

}



// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// LOAD PATIENTS
// =====================================================

async function loadPatients() {

    const tableBody =
        document.getElementById("patientTableBody");

    const patientCount =
        document.getElementById("patientCount");

    const tableStatus =
        document.getElementById("tableStatus");


    if (!tableBody) return;


    try {

        const searchInput =
            document.getElementById("patientSearch");

        const search =
            searchInput
                ? searchInput.value.trim()
                : "";


        if (tableStatus) {
            tableStatus.textContent =
                "Loading patients...";
        }


        // =================================================
        // NEWLY ADDED PATIENTS
        // =================================================

        if (patientView === "new") {

            const response =
                await fetch(`${API_URL}/api/new-patients`);

            if (!response.ok) {
                throw new Error(
                    "New patients API failed"
                );
            }

            const data =
                await response.json();

            let patients =
                data.patients || [];


            // Search newly added patients on frontend
            if (search) {

                const searchLower =
                    search.toLowerCase();

                patients =
                    patients.filter(patient => {

                        return (

                            String(
                                patient.Patient_ID || ""
                            ).toLowerCase().includes(searchLower)

                            ||

                            String(
                                patient["Medical Condition"] || ""
                            ).toLowerCase().includes(searchLower)

                            ||

                            String(
                                patient["Admission Type"] || ""
                            ).toLowerCase().includes(searchLower)

                        );
                    });
            }


            tableBody.innerHTML = "";


            if (patientCount) {

                patientCount.textContent =
                    patients.length.toLocaleString();
            }


            if (patients.length === 0) {

                tableBody.innerHTML = `
                    <tr>
                        <td colspan="11"
                            style="
                                text-align:center;
                                padding:30px;
                            ">
                            No newly added patients found
                        </td>
                    </tr>
                `;

                if (tableStatus) {
                    tableStatus.textContent =
                        "No newly added patients found";
                }

                updatePagination(0);

                return;
            }


            patients.forEach(patient => {

                const row =
                    document.createElement("tr");


                row.innerHTML = `

                    <td>
                        <strong>
                            ${escapeHTML(patient.Patient_ID)}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(patient.Gender)}
                    </td>

                    <td>
                        ${escapeHTML(patient.Age)}
                    </td>

                    <td>
                        ${escapeHTML(patient["Blood Type"])}
                    </td>

                    <td>
                        ${escapeHTML(
                            patient["Date of Admission"]
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            patient["Discharge Date"]
                        )}
                    </td>

                    <td>
                        <span class="table-badge">
                            ${escapeHTML(
                                patient["Admission Type"]
                            )}
                        </span>
                    </td>

                    <td>
                        ${escapeHTML(
                            patient["Medical Condition"]
                        )}
                    </td>

                    <td>
                        $${Number(
                            patient["Billing Amount"] || 0
                        ).toLocaleString(
                            "en-US",
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            patient["Insurance Provider"]
                        )}
                    </td>

                    <td>
                        <button
                            type="button"
                            class="view-patient-btn">
                            View
                        </button>

                        <button
                            type="button"
                            class="edit-patient-btn"
                            data-id="${patient.id}">
                            Edit
                        </button>
                    </td>
                `;


                const viewButton =
                    row.querySelector(".view-patient-btn");


                if (viewButton) {

                    viewButton.addEventListener(
                        "click",
                        () => viewPatient(patient)
                    );
                }


                const editButton =
                    row.querySelector(".edit-patient-btn");


                if (editButton) {

                    editButton.addEventListener(
                        "click",
                        () => editPatient(patient)
                    );
                }


                tableBody.appendChild(row);
            });


            if (tableStatus) {

                tableStatus.textContent =
                    `Showing ${patients.length.toLocaleString()} newly added patients`;
            }


            // Newly added list normally small,
            // so pagination is disabled here.
            updatePagination(0);

            return;
        }


        // =================================================
        // ALL PATIENTS
        // =================================================

        const filters =
            getCurrentFilters();


        const url =
            `${API_URL}/api/patients` +
            `?search=${encodeURIComponent(search)}` +
            `&gender=${encodeURIComponent(filters.gender)}` +
            `&condition=${encodeURIComponent(filters.condition)}` +
            `&admission=${encodeURIComponent(filters.admission)}` +
            `&test=${encodeURIComponent(filters.test)}` +
            `&page=${currentPage}` +
            `&per_page=${rowsPerPage}`;


        const response =
            await fetch(url);


        if (!response.ok) {
            throw new Error("Patients API failed");
        }


        const data =
            await response.json();


        tableBody.innerHTML = "";


        if (patientCount) {

            patientCount.textContent =
                Number(data.total || 0)
                    .toLocaleString();
        }


        if (
            !data.patients ||
            data.patients.length === 0
        ) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="11"
                        style="
                            text-align:center;
                            padding:30px;
                        ">
                        No patients found
                    </td>
                </tr>
            `;


            if (tableStatus) {

                tableStatus.textContent =
                    "No patients found";
            }


            updatePagination(0);

            return;
        }


        data.patients.forEach(patient => {

            const row =
                document.createElement("tr");


            // Imported patients = View only
            // New patients = View + Edit

            const actionButtons =
                patient.record_source === "New"

                    ?

                    `
                        <button
                            type="button"
                            class="view-patient-btn">
                            View
                        </button>

                        <button
                            type="button"
                            class="edit-patient-btn"
                            data-id="${patient.id}">
                            Edit
                        </button>
                    `

                    :

                    `
                        <button
                            type="button"
                            class="view-patient-btn">
                            View
                        </button>
                    `;


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHTML(patient.Patient_ID)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(patient.Gender)}
                </td>

                <td>
                    ${escapeHTML(patient.Age)}
                </td>

                <td>
                    ${escapeHTML(patient["Blood Type"])}
                </td>

                <td>
                    ${escapeHTML(
                        patient["Date of Admission"]
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        patient["Discharge Date"]
                    )}
                </td>

                <td>
                    <span class="table-badge">
                        ${escapeHTML(
                            patient["Admission Type"]
                        )}
                    </span>
                </td>

                <td>
                    ${escapeHTML(
                        patient["Medical Condition"]
                    )}
                </td>

                <td>
                    $${Number(
                        patient["Billing Amount"] || 0
                    ).toLocaleString(
                        "en-US",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        patient["Insurance Provider"]
                    )}
                </td>

                <td>
                    ${actionButtons}
                </td>
            `;


            const viewButton =
                row.querySelector(".view-patient-btn");


            if (viewButton) {

                viewButton.addEventListener(
                    "click",
                    () => viewPatient(patient)
                );
            }


            const editButton =
                row.querySelector(".edit-patient-btn");


            if (editButton) {

                editButton.addEventListener(
                    "click",
                    () => editPatient(patient)
                );
            }


            tableBody.appendChild(row);
        });


        const start =
            ((data.page - 1) * data.per_page) + 1;


        const end =
            Math.min(
                data.page * data.per_page,
                data.total
            );


        if (tableStatus) {

            tableStatus.textContent =
                `Showing ${start}-${end} of ${Number(
                    data.total
                ).toLocaleString()} patients`;
        }


        updatePagination(data.total_pages);


    } catch (error) {

        console.error(
            "Patient loading error:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="11"
                    style="
                        text-align:center;
                        padding:30px;
                    ">
                    Unable to load patient data
                </td>
            </tr>
        `;


        if (tableStatus) {

            tableStatus.textContent =
                "Error loading patient data";
        }
    }
}


// =====================================================
// PATIENT DETAILS MODAL
// =====================================================

function viewPatient(patient) {

    let modal =
        document.getElementById(
            "patientDetailsModal"
        );


    if (!modal) {

        modal =
            document.createElement("div");

        modal.id =
            "patientDetailsModal";

        modal.className =
            "patient-modal";


        modal.innerHTML = `

            <div class="patient-modal-overlay"></div>

            <div class="patient-modal-content">

                <div class="patient-modal-header">

                    <div>

                        <span class="modal-label">
                            PATIENT RECORD
                        </span>

                        <h2 id="modalPatientName">
                            Patient Details
                        </h2>

                    </div>

                    <button
                        type="button"
                        class="modal-close"
                        id="closePatientModal">
                        ×
                    </button>

                </div>


                <div class="patient-modal-body">

                    <!-- PATIENT INFORMATION -->

                    <div class="patient-detail-section">

                        <div class="patient-detail-title">

                            <span class="detail-icon">
                                👤
                            </span>

                            <div>

                                <h3>
                                    Patient Information
                                </h3>

                                <p>
                                    Basic patient demographics
                                </p>

                            </div>

                        </div>


                        <div class="detail-grid">

                            <div class="detail-item">
                                <span>Name</span>
                                <strong id="detailName">-</strong>
                            </div>

                            <div class="detail-item">
                                <span>Age</span>
                                <strong id="detailAge">-</strong>
                            </div>

                            <div class="detail-item">
                                <span>Gender</span>
                                <strong id="detailGender">-</strong>
                            </div>

                            <div class="detail-item">
                                <span>Blood Type</span>
                                <strong id="detailBlood">-</strong>
                            </div>

                        </div>

                    </div>


                    <!-- ADMISSION INFORMATION -->

                    <div class="patient-detail-section">

                        <div class="patient-detail-title">

                            <span class="detail-icon">
                                🏥
                            </span>

                            <div>

                                <h3>
                                    Admission Information
                                </h3>

                                <p>
                                    Hospital admission details
                                </p>

                            </div>

                        </div>


                        <div class="detail-grid">

                            <div class="detail-item">
                                <span>
                                    Admission Date
                                </span>

                                <strong id="detailAdmissionDate">
                                    -
                                </strong>
                            </div>


                            <div class="detail-item">
                                <span>
                                    Discharge Date
                                </span>

                                <strong id="detailDischargeDate">
                                    -
                                </strong>
                            </div>


                            <div class="detail-item">
                                <span>
                                    Admission Type
                                </span>

                                <strong id="detailAdmissionType">
                                    -
                                </strong>
                            </div>


                            <div class="detail-item">
                                <span>
                                    Length of Stay
                                </span>

                                <strong id="detailStay">
                                    -
                                </strong>
                            </div>

                        </div>

                    </div>


                    <!-- MEDICAL INFORMATION -->

                    <div class="patient-detail-section">

                        <div class="patient-detail-title">

                            <span class="detail-icon">
                                🩺
                            </span>

                            <div>

                                <h3>
                                    Medical Information
                                </h3>

                                <p>
                                    Clinical and treatment details
                                </p>

                            </div>

                        </div>


                        <div class="detail-grid">

                            <div class="detail-item">

                                <span>
                                    Medical Condition
                                </span>

                                <strong id="detailCondition">
                                    -
                                </strong>

                            </div>


                            <div class="detail-item">

                                <span>
                                    Medication
                                </span>

                                <strong id="detailMedication">
                                    -
                                </strong>

                            </div>


                            <div class="detail-item">

                                <span>
                                    Test Result
                                </span>

                                <strong id="detailTest">
                                    -
                                </strong>

                            </div>


                            <div class="detail-item">

                                <span>
                                    Hospital
                                </span>

                                <strong id="detailHospital">
                                    -
                                </strong>

                            </div>

                        </div>

                    </div>


                    <!-- BILLING INFORMATION -->

                    <div class="patient-detail-section">

                        <div class="patient-detail-title">

                            <span class="detail-icon">
                                💰
                            </span>

                            <div>

                                <h3>
                                    Billing Information
                                </h3>

                                <p>
                                    Financial and insurance details
                                </p>

                            </div>

                        </div>


                        <div class="detail-grid">

                            <div class="detail-item">

                                <span>
                                    Billing Amount
                                </span>

                                <strong id="detailBilling">
                                    -
                                </strong>

                            </div>


                            <div class="detail-item">

                                <span>
                                    Insurance Provider
                                </span>

                                <strong id="detailInsurance">
                                    -
                                </strong>

                            </div>


                            <div class="detail-item">

                                <span>
                                    Doctor
                                </span>

                                <strong id="detailDoctor">
                                    -
                                </strong>

                            </div>


                            <div class="detail-item">

                                <span>
                                    Room Number
                                </span>

                                <strong id="detailRoom">
                                    -
                                </strong>

                            </div>

                        </div>

                    </div>

                </div>


                <div class="patient-modal-footer">

                    <button
                        type="button"
                        class="modal-close-btn"
                        id="closePatientModalBottom">

                        Close

                    </button>

                </div>

            </div>
        `;


        document.body.appendChild(modal);


        document
            .getElementById("closePatientModal")
            .onclick =
            closePatientModal;


        document
            .getElementById("closePatientModalBottom")
            .onclick =
            closePatientModal;


        modal
            .querySelector(".patient-modal-overlay")
            .onclick =
            closePatientModal;
    }


    document.getElementById(
        "modalPatientName"
    ).textContent =
        patient.Name || "Patient Details";


    document.getElementById(
        "detailName"
    ).textContent =
        patient.Name || "N/A";


    document.getElementById(
        "detailAge"
    ).textContent =
        patient.Age || "N/A";


    document.getElementById(
        "detailGender"
    ).textContent =
        patient.Gender || "N/A";


    document.getElementById(
        "detailBlood"
    ).textContent =
        patient["Blood Type"] || "N/A";


    document.getElementById(
        "detailAdmissionDate"
    ).textContent =
        patient["Date of Admission"] || "N/A";


    document.getElementById(
        "detailDischargeDate"
    ).textContent =
        patient["Discharge Date"] || "N/A";


    document.getElementById(
        "detailAdmissionType"
    ).textContent =
        patient["Admission Type"] || "N/A";


    document.getElementById(
        "detailCondition"
    ).textContent =
        patient["Medical Condition"] || "N/A";


    document.getElementById(
        "detailMedication"
    ).textContent =
        patient["Medication"] || "N/A";


    document.getElementById(
        "detailTest"
    ).textContent =
        patient["Test Results"] || "N/A";


    document.getElementById(
        "detailHospital"
    ).textContent =
        patient["Hospital"] || "N/A";


    document.getElementById(
        "detailInsurance"
    ).textContent =
        patient["Insurance Provider"] || "N/A";


    document.getElementById(
        "detailDoctor"
    ).textContent =
        patient["Doctor"] || "N/A";


    document.getElementById(
        "detailRoom"
    ).textContent =
        patient["Room Number"] || "N/A";


    const billing =
        Number(
            patient["Billing Amount"] || 0
        );


    document.getElementById(
        "detailBilling"
    ).textContent =
        "$" +
        billing.toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );


    const admissionDate =
        new Date(
            patient["Date of Admission"]
        );


    const dischargeDate =
        new Date(
            patient["Discharge Date"]
        );


    let stay = "N/A";


    if (
        !isNaN(admissionDate.getTime()) &&
        !isNaN(dischargeDate.getTime())
    ) {

        const difference =
            dischargeDate -
            admissionDate;


        stay =
            Math.round(
                difference /
                (1000 * 60 * 60 * 24)
            ) +
            " days";
    }


    document.getElementById(
        "detailStay"
    ).textContent =
        stay;


    modal.style.display =
        "flex";


    document.body.style.overflow =
        "hidden";
}


// =====================================================
// CLOSE PATIENT DETAILS
// =====================================================

function closePatientModal() {

    const modal =
        document.getElementById(
            "patientDetailsModal"
        );


    if (modal) {

        modal.style.display =
            "none";
    }


    document.body.style.overflow =
        "";
}


// =====================================================
// PAGINATION
// =====================================================

function updatePagination(totalPages) {

    const pageNumbers =
        document.getElementById(
            "pageNumbers"
        );

    const prevButton =
        document.getElementById(
            "prevPage"
        );

    const nextButton =
        document.getElementById(
            "nextPage"
        );


    if (!pageNumbers) return;


    pageNumbers.innerHTML = "";


    if (
        !totalPages ||
        totalPages <= 1
    ) {

        if (prevButton) {
            prevButton.disabled = true;
        }

        if (nextButton) {
            nextButton.disabled = true;
        }

        return;
    }


    if (prevButton) {

        prevButton.disabled =
            currentPage <= 1;
    }


    if (nextButton) {

        nextButton.disabled =
            currentPage >= totalPages;
    }


    const maxVisiblePages = 5;


    let startPage =
        Math.max(
            1,
            currentPage -
            Math.floor(
                maxVisiblePages / 2
            )
        );


    let endPage =
        Math.min(
            totalPages,
            startPage +
            maxVisiblePages -
            1
        );


    if (
        endPage -
        startPage +
        1 <
        maxVisiblePages
    ) {

        startPage =
            Math.max(
                1,
                endPage -
                maxVisiblePages +
                1
            );
    }


    if (startPage > 1) {

        createPageButton(
            1,
            pageNumbers
        );


        if (startPage > 2) {

            addPaginationDots(
                pageNumbers
            );
        }
    }


    for (
        let page = startPage;
        page <= endPage;
        page++
    ) {

        createPageButton(
            page,
            pageNumbers
        );
    }


    if (endPage < totalPages) {

        if (
            endPage <
            totalPages - 1
        ) {

            addPaginationDots(
                pageNumbers
            );
        }


        createPageButton(
            totalPages,
            pageNumbers
        );
    }
}


// =====================================================
// PAGINATION DOTS
// =====================================================

function addPaginationDots(container) {

    const dots =
        document.createElement("span");

    dots.className =
        "pagination-dots";

    dots.textContent =
        "...";

    container.appendChild(dots);
}


// =====================================================
// CREATE PAGE BUTTON
// =====================================================

function createPageButton(page, container) {

    const button =
        document.createElement("button");


    button.type =
        "button";


    button.className =
        "page-number";


    button.textContent =
        page;


    if (page === currentPage) {

        button.classList.add("active");
    }


    button.onclick =
        function () {

            if (
                page === currentPage
            ) {
                return;
            }


            currentPage =
                page;


            loadPatients();
        };


    container.appendChild(button);
}


// =====================================================
// SETUP PAGINATION
// =====================================================

function setupPagination() {

    const prevButton =
        document.getElementById(
            "prevPage"
        );


    const nextButton =
        document.getElementById(
            "nextPage"
        );


    const rowsSelect =
        document.getElementById(
            "rowsPerPage"
        );


    // PREVIOUS

    if (prevButton) {

        prevButton.type =
            "button";


        prevButton.onclick =
            function () {

                if (
                    currentPage > 1
                ) {

                    currentPage--;

                    loadPatients();
                }
            };
    }


    // NEXT

    if (nextButton) {

        nextButton.type =
            "button";


        nextButton.onclick =
            function () {

                currentPage++;

                loadPatients();
            };
    }


    // ROWS PER PAGE

    if (rowsSelect) {

        rowsSelect.onchange =
            function () {

                rowsPerPage =
                    Number(this.value);


                currentPage =
                    1;


                loadPatients();
            };
    }
}


// =====================================================
// PATIENT SEARCH
// =====================================================

function setupPatientSearch() {

    const searchInput =
        document.getElementById(
            "patientSearch"
        );


    const searchButton =
        document.getElementById(
            "searchPatientBtn"
        );


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            function () {

                currentPage =
                    1;

                loadPatients();
            }
        );
    }


    if (searchInput) {

        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    currentPage =
                        1;

                    loadPatients();
                }
            }
        );
    }
}


// =====================================================
// DOWNLOAD CSV
// =====================================================

async function downloadPatientsCSV() {

    try {

        const searchInput =
            document.getElementById(
                "patientSearch"
            );


        const search =
            searchInput
                ? searchInput.value.trim()
                : "";


        const filters =
            getCurrentFilters();


        const url =
            `${API_URL}/api/download` +
            `?search=${encodeURIComponent(search)}` +
            `&gender=${encodeURIComponent(filters.gender)}` +
            `&condition=${encodeURIComponent(filters.condition)}` +
            `&admission=${encodeURIComponent(filters.admission)}` +
            `&test=${encodeURIComponent(filters.test)}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "CSV download failed"
            );
        }


        const blob =
            await response.blob();


        const downloadURL =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href =
            downloadURL;


        link.download =
            "MediLens_Patient_Data.csv";


        document.body.appendChild(link);


        link.click();


        document.body.removeChild(link);


        URL.revokeObjectURL(
            downloadURL
        );


    } catch (error) {

        console.error(
            "CSV download error:",
            error
        );


        alert(
            "Unable to download CSV."
        );
    }
}


// =====================================================
// ANALYTICS DASHBOARD
// =====================================================

async function loadAnalyticsDashboard() {

    try {

        const [
            billingConditionResponse,
            stayConditionResponse,
            admissionsYearResponse,
            ageGroupResponse,
            insuranceResponse,
            billingGenderResponse
        ] = await Promise.all([

            fetch(`${API_URL}/api/analytics/billing-condition`),

            fetch(`${API_URL}/api/analytics/stay-condition`),

            fetch(`${API_URL}/api/analytics/admissions-year`),

            fetch(`${API_URL}/api/analytics/age-groups`),

            fetch(`${API_URL}/api/analytics/insurance`),

            fetch(`${API_URL}/api/analytics/billing-gender`)

        ]);


        if (
            !billingConditionResponse.ok ||
            !stayConditionResponse.ok ||
            !admissionsYearResponse.ok ||
            !ageGroupResponse.ok ||
            !insuranceResponse.ok ||
            !billingGenderResponse.ok
        ) {
            throw new Error("Analytics API failed");
        }


        const billingCondition =
            await billingConditionResponse.json();

        const stayCondition =
            await stayConditionResponse.json();

        const admissionsYear =
            await admissionsYearResponse.json();

        const ageGroups =
            await ageGroupResponse.json();

        const insurance =
            await insuranceResponse.json();

        const billingGender =
            await billingGenderResponse.json();


        drawBillingConditionChart(billingCondition);

        drawStayConditionChart(stayCondition);

        drawAdmissionsYearChart(admissionsYear);

        drawAgeGroupChart(ageGroups);

        drawInsuranceChart(insurance);

        drawBillingGenderChart(billingGender);


        console.log(
            "Analytics dashboard loaded successfully."
        );

    } catch (error) {

        console.error(
            "Analytics loading error:",
            error
        );

    }

}


// =====================================================
// 1. AVERAGE BILLING BY MEDICAL CONDITION
// =====================================================

function drawBillingConditionChart(data) {

    const canvas =
        document.getElementById(
            "billingConditionChart"
        );

    if (!canvas) return;


    const labels =
        data.map(
            item => item.condition
        );

    const values =
        data.map(
            item => item.average_billing
        );


    if (billingConditionChart) {

        billingConditionChart.data.labels =
            labels;

        billingConditionChart.data.datasets[0].data =
            values;

        billingConditionChart.update();

        return;
    }


    billingConditionChart =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels: labels,

                datasets: [

                    {

                        label: "Average Billing",

                        data: values,

                        backgroundColor:
                            "#2563eb",

                        borderRadius: 8

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: false
                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                return (
                                    "$" +
                                    Number(
                                        context.raw
                                    ).toLocaleString(
                                        "en-US",
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }
                                    )
                                );

                            }

                        }

                    }

                },

                scales: {

                    y: {

                        beginAtZero: false,

                        ticks: {

                            callback: function(value) {

                                return (
                                    "$" +
                                    Number(value)
                                        .toLocaleString()
                                );

                            }

                        }

                    }

                }

            }

        });

}


// =====================================================
// 2. AVERAGE LENGTH OF STAY
// =====================================================

function drawStayConditionChart(data) {

    const canvas =
        document.getElementById(
            "stayConditionChart"
        );

    if (!canvas) return;


    const labels =
        data.map(
            item => item.condition
        );

    const values =
        data.map(
            item => item.average_stay
        );


    if (stayConditionChart) {

        stayConditionChart.data.labels =
            labels;

        stayConditionChart.data.datasets[0].data =
            values;

        stayConditionChart.update();

        return;
    }


    stayConditionChart =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels: labels,

                datasets: [

                    {

                        label: "Average Stay",

                        data: values,

                        backgroundColor:
                            "#14b8a6",

                        borderRadius: 8

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: false
                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                return (
                                    context.raw +
                                    " days"
                                );

                            }

                        }

                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        title: {

                            display: true,

                            text: "Days"

                        }

                    }

                }

            }

        });

}


// =====================================================
// 3. ADMISSIONS BY YEAR
// =====================================================

function drawAdmissionsYearChart(data) {

    const canvas =
        document.getElementById(
            "admissionsYearChart"
        );

    if (!canvas) return;


    const labels =
        data.map(
            item => item.year
        );

    const values =
        data.map(
            item => item.admissions
        );


    if (admissionsYearChart) {

        admissionsYearChart.data.labels =
            labels;

        admissionsYearChart.data.datasets[0].data =
            values;

        admissionsYearChart.update();

        return;
    }


    admissionsYearChart =
        new Chart(canvas, {

            type: "line",

            data: {

                labels: labels,

                datasets: [

                    {

                        label: "Admissions",

                        data: values,

                        borderColor:
                            "#8b5cf6",

                        backgroundColor:
                            "rgba(139, 92, 246, 0.10)",

                        fill: true,

                        tension: 0.35,

                        pointRadius: 5,

                        pointHoverRadius: 7

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: false
                    }

                },

                scales: {

                    y: {

                        beginAtZero: true

                    }

                }

            }

        });

}


// =====================================================
// 4. AGE GROUP DISTRIBUTION
// =====================================================

function drawAgeGroupChart(data) {

    const canvas =
        document.getElementById(
            "ageGroupChart"
        );

    if (!canvas) return;


    const labels =
        data.map(
            item => item.age_group
        );

    const values =
        data.map(
            item => item.patients
        );


    if (ageGroupChart) {

        ageGroupChart.data.labels =
            labels;

        ageGroupChart.data.datasets[0].data =
            values;

        ageGroupChart.update();

        return;
    }


    ageGroupChart =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels: labels,

                datasets: [

                    {

                        data: values,

                        backgroundColor: [
                            "#2563eb",
                            "#14b8a6",
                            "#8b5cf6",
                            "#f59e0b",
                            "#ef4444"
                        ],

                        borderWidth: 2

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: "62%",

                plugins: {

                    legend: {

                        position: "bottom"

                    }

                }

            }

        });

}


// =====================================================
// 5. PATIENTS BY INSURANCE PROVIDER
// =====================================================

function drawInsuranceChart(data) {

    const canvas =
        document.getElementById(
            "insuranceChart"
        );

    if (!canvas) return;


    const labels =
        data.map(
            item => item.provider
        );

    const values =
        data.map(
            item => item.patients
        );


    if (insuranceChart) {

        insuranceChart.data.labels =
            labels;

        insuranceChart.data.datasets[0].data =
            values;

        insuranceChart.update();

        return;
    }


    insuranceChart =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels: labels,

                datasets: [

                    {

                        label: "Patients",

                        data: values,

                        backgroundColor:
                            "#06b6d4",

                        borderRadius: 8

                    }

                ]

            },

            options: {

                indexAxis: "y",

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: false
                    }

                },

                scales: {

                    x: {

                        beginAtZero: true

                    }

                }

            }

        });

}


// =====================================================
// 6. AVERAGE BILLING BY GENDER
// =====================================================

function drawBillingGenderChart(data) {

    const canvas =
        document.getElementById(
            "billingGenderChart"
        );

    if (!canvas) return;


    const labels =
        data.map(
            item => item.gender
        );

    const values =
        data.map(
            item => item.average_billing
        );


    if (billingGenderChart) {

        billingGenderChart.data.labels =
            labels;

        billingGenderChart.data.datasets[0].data =
            values;

        billingGenderChart.update();

        return;
    }


    billingGenderChart =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels: labels,

                datasets: [

                    {

                        data: values,

                        backgroundColor: [
                            "#2563eb",
                            "#ec4899",
                            "#14b8a6"
                        ],

                        borderWidth: 2

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: "60%",

                plugins: {

                    legend: {

                        position: "bottom"

                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                return (
                                    context.label +
                                    ": $" +
                                    Number(
                                        context.raw
                                    ).toLocaleString(
                                        "en-US",
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }
                                    )
                                );

                            }

                        }

                    }

                }

            }

        });

}


// =====================================================
// NAVIGATION
// =====================================================

function showSection(sectionId) {

    const section =
        document.getElementById(
            sectionId
        );


    if (!section) {

        console.warn(
            `Section ${sectionId} not found`
        );

        return;
    }


    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    const navLinks =
        document.querySelectorAll(
            ".nav-link"
        );


    navLinks.forEach(link => {

        link.classList.remove(
            "active"
        );


        const href =
            link.getAttribute("href");


        if (
            href ===
            `#${sectionId}`
        ) {

            link.classList.add(
                "active"
            );
        }
    });


    if (
    sectionId ===
    "patients"
) {

    loadPatients();
}


if (
    sectionId ===
    "analytics"
) {

    loadAnalyticsDashboard();
}
}


// =====================================================
// SETUP FILTERS
// =====================================================

function setupFilters() {

    const filters = [

        genderFilter,

        conditionFilter,

        admissionFilter,

        testFilter,

        hospitalFilter
    ];


    filters.forEach(filter => {

        if (!filter) return;


        filter.addEventListener(
            "change",
            function () {

                currentPage =
                    1;


                loadFilteredDashboard();

                // Only refresh patient table
                // when All Patients is selected.
                if (patientView === "all") {
                    loadPatients();
                }
            }
        );
    });


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            function () {

                if (genderFilter) {
                    genderFilter.value =
                        "All";
                }


                if (conditionFilter) {
                    conditionFilter.value =
                        "All";
                }


                if (admissionFilter) {
                    admissionFilter.value =
                        "All";
                }


                if (testFilter) {
                    testFilter.value =
                        "All";
                }


                // Reset hospital search

const hospitalSearch =
    document.getElementById(
        "hospitalSearch"
    );

if (hospitalSearch) {
    hospitalSearch.value = "";
}

if (hospitalFilter) {
    hospitalFilter.value = "All";
}

const hospitalResults =
    document.getElementById(
        "hospitalResults"
    );

if (hospitalResults) {
    hospitalResults.innerHTML = "";
    hospitalResults.style.display = "none";
}


                const searchInput =
                    document.getElementById(
                        "patientSearch"
                    );


                if (searchInput) {
                    searchInput.value =
                        "";
                }


                currentPage =
                    1;


                loadFilteredDashboard();

                loadPatients();
            }
        );
    }
}


// =====================================================
// SETUP DOWNLOAD BUTTON
// =====================================================

function setupDownloadButton() {

    const downloadButton =
        document.querySelector(
            ".download-btn"
        );


    if (!downloadButton) {

        console.warn(
            "Download button not found"
        );

        return;
    }


    downloadButton.addEventListener(
        "click",
        downloadPatientsCSV
    );
}


// =====================================================
// RESET ADD/EDIT FORM
// =====================================================

function resetPatientForm() {

    const form =
        document.getElementById(
            "addPatientForm"
        );

    if (form) {
        form.reset();
    }


    editingPatientId = null;


    const modalTitle =
        document.querySelector(
            ".add-patient-header h2"
        );


    const modalDescription =
        document.querySelector(
            ".add-patient-header p"
        );


    const saveButton =
        document.querySelector(
            ".save-patient-btn"
        );


    if (modalTitle) {

        modalTitle.textContent =
            "Add New Patient";
    }


    if (modalDescription) {

        modalDescription.textContent =
            "Enter patient information to add a new record to the MediLens database.";
    }


    if (saveButton) {

        saveButton.textContent =
            "✓ Save Patient";
    }
}


// =====================================================
// EDIT PATIENT
// =====================================================

function editPatient(patient) {

    // Only New patients can be edited
    if (patient.record_source !== "New") {

        alert(
            "Only newly added patients can be edited."
        );

        return;
    }


    const modal =
        document.getElementById(
            "addPatientModal"
        );


    const form =
        document.getElementById(
            "addPatientForm"
        );


    if (!modal || !form) {

        console.error(
            "Edit form/modal not found."
        );

        return;
    }


    editingPatientId =
        patient.id;


    // Fill form fields

    const fieldMap = {

        "Name": "patientName",

        "Age": "patientAge",

        "Gender": "patientGender",

        "Blood Type": "patientBloodType",

        "Date of Admission": "dateOfAdmission",

        "Discharge Date": "dischargeDate",

        "Admission Type": "admissionType",

        "Room Number": "roomNumber",

        "Medical Condition": "medicalCondition",

        "Medication": "medication",

        "Test Results": "testResults",

        "Doctor": "doctor",

        "Hospital": "hospital",

        "Insurance Provider": "insuranceProvider",

        "Billing Amount": "billingAmount"
    };


    Object.entries(fieldMap).forEach(

        ([key, elementId]) => {

            const element =
                document.getElementById(
                    elementId
                );


            if (!element) return;


            let value =
                patient[key];


            if (
                value === null ||
                value === undefined
            ) {
                value = "";
            }


            // HTML date input needs YYYY-MM-DD
            if (
                key === "Date of Admission" ||
                key === "Discharge Date"
            ) {

                value =
                    String(value).substring(0, 10);
            }


            element.value =
                value;
        }
    );

    // Handle custom medical conditions
const medicalCondition =
    document.getElementById("medicalCondition");

const customMedicalCondition =
    document.getElementById("customMedicalCondition");

if (medicalCondition && customMedicalCondition) {

    const currentCondition =
        patient["Medical Condition"];

    const standardConditions = [
        "Arthritis",
        "Asthma",
        "Cancer",
        "Diabetes",
        "Hypertension",
        "Obesity"
    ];

    if (
        currentCondition &&
        !standardConditions.includes(currentCondition)
    ) {

        medicalCondition.value = "Other";

        customMedicalCondition.value =
            currentCondition;

        customMedicalCondition.style.display =
            "block";

        customMedicalCondition.required =
            true;

    } else {

        customMedicalCondition.value = "";

        customMedicalCondition.style.display =
            "none";

        customMedicalCondition.required =
            false;
    }
}


    // Change modal text

    const modalTitle =
        document.querySelector(
            ".add-patient-header h2"
        );


    const modalDescription =
        document.querySelector(
            ".add-patient-header p"
        );


    const saveButton =
        document.querySelector(
            ".save-patient-btn"
        );


    if (modalTitle) {

        modalTitle.textContent =
            "Edit Patient";
    }


    if (modalDescription) {

        modalDescription.textContent =
            "Update the information for this newly added patient.";
    }


    if (saveButton) {

        saveButton.textContent =
            "✓ Update Patient";
    }


    // Open modal

    modal.style.display =
        "flex";


    document.body.style.overflow =
        "hidden";
}


// =====================================================
// SETUP PATIENT TABS
// =====================================================

function setupPatientTabs() {

    const allPatientsTab =
        document.getElementById(
            "allPatientsTab"
        );


    const newPatientsTab =
        document.getElementById(
            "newPatientsTab"
        );


    if (allPatientsTab) {

        allPatientsTab.addEventListener(
            "click",
            function () {

                patientView =
                    "all";

                currentPage =
                    1;


                allPatientsTab.classList.add(
                    "active"
                );


                if (newPatientsTab) {

                    newPatientsTab.classList.remove(
                        "active"
                    );
                }


                const searchInput =
                    document.getElementById(
                        "patientSearch"
                    );


                if (searchInput) {
                    searchInput.value = "";
                }


                loadPatients();
            }
        );
    }


    if (newPatientsTab) {

        newPatientsTab.addEventListener(
            "click",
            function () {

                patientView =
                    "new";

                currentPage =
                    1;


                newPatientsTab.classList.add(
                    "active"
                );


                if (allPatientsTab) {

                    allPatientsTab.classList.remove(
                        "active"
                    );
                }


                const searchInput =
                    document.getElementById(
                        "patientSearch"
                    );


                if (searchInput) {
                    searchInput.value = "";
                }


                loadPatients();
            }
        );
    }
}


// =====================================================
// ADD / EDIT PATIENT
// =====================================================

function setupAddPatient() {

        const medicalCondition =
        document.getElementById("medicalCondition");

    const customMedicalCondition =
        document.getElementById("customMedicalCondition");


    // Show custom condition field when "Other" is selected
    if (medicalCondition && customMedicalCondition) {

        medicalCondition.addEventListener(
            "change",
            function () {

                if (this.value === "Other") {

                    customMedicalCondition.style.display =
                        "block";

                    customMedicalCondition.required =
                        true;

                    customMedicalCondition.focus();

                } else {

                    customMedicalCondition.style.display =
                        "none";

                    customMedicalCondition.required =
                        false;

                    customMedicalCondition.value = "";

                }

            }
        );

    }

    const addPatientBtn =
        document.getElementById(
            "addPatientBtn"
        );


    const addPatientModal =
        document.getElementById(
            "addPatientModal"
        );


    const closeAddPatient =
        document.getElementById(
            "closeAddPatient"
        );


    const cancelAddPatient =
        document.getElementById(
            "cancelAddPatient"
        );


    const addPatientForm =
        document.getElementById(
            "addPatientForm"
        );


    if (
        !addPatientBtn ||
        !addPatientModal
    ) {

        console.warn(
            "Add Patient elements not found"
        );

        return;
    }


    // -------------------------------------------------
    // OPEN MODAL FOR NEW PATIENT
    // -------------------------------------------------

    addPatientBtn.addEventListener(
        "click",
        function () {

            resetPatientForm();


            addPatientModal.style.display =
                "flex";


            document.body.style.overflow =
                "hidden";
        }
    );


    // -------------------------------------------------
    // CLOSE MODAL
    // -------------------------------------------------

    function closeAddPatientModal() {

        addPatientModal.style.display =
            "none";


        document.body.style.overflow =
            "";


        editingPatientId = null;
    }


    if (closeAddPatient) {

        closeAddPatient.addEventListener(
            "click",
            closeAddPatientModal
        );
    }


    if (cancelAddPatient) {

        cancelAddPatient.addEventListener(
            "click",
            closeAddPatientModal
        );
    }


    // -------------------------------------------------
    // CLOSE WHEN CLICKING OVERLAY
    // -------------------------------------------------

    addPatientModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target.classList.contains(
                    "add-patient-overlay"
                )
            ) {

                closeAddPatientModal();
            }
        }
    );


    // -------------------------------------------------
    // ESC KEY
    // -------------------------------------------------

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                addPatientModal.style.display === "flex"
            ) {

                closeAddPatientModal();
            }
        }
    );


    // -------------------------------------------------
    // SUBMIT FORM
    // -------------------------------------------------

    if (addPatientForm) {

        addPatientForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const formData =
                    new FormData(
                        addPatientForm
                    );


                const patientData = {

                    "Name":
                        formData.get("Name"),

                    "Age":
                        formData.get("Age"),

                    "Gender":
                        formData.get("Gender"),

                    "Blood Type":
                        formData.get("Blood Type"),

                    "Date of Admission":
                        formData.get(
                            "Date of Admission"
                        ),

                    "Discharge Date":
                        formData.get(
                            "Discharge Date"
                        ),

                    "Admission Type":
                        formData.get(
                            "Admission Type"
                        ),

                    "Room Number":
                        formData.get(
                            "Room Number"
                        ),

                    "Medical Condition":
    formData.get("Medical Condition") === "Other"
        ? document
            .getElementById("customMedicalCondition")
            .value
            .trim()
        : formData.get("Medical Condition"),

                    "Medication":
                        formData.get(
                            "Medication"
                        ),

                    "Test Results":
                        formData.get(
                            "Test Results"
                        ),

                    "Doctor":
                        formData.get(
                            "Doctor"
                        ),

                    "Hospital":
                        formData.get(
                            "Hospital"
                        ),

                    "Insurance Provider":
                        formData.get(
                            "Insurance Provider"
                        ),

                    "Billing Amount":
                        formData.get(
                            "Billing Amount"
                        )
                };


                // -------------------------------------------------
                // VALIDATION
                // -------------------------------------------------

                const requiredFields = [

                    "Name",

                    "Age",

                    "Gender",

                    "Blood Type",

                    "Date of Admission",

                    "Discharge Date",

                    "Admission Type",

                    "Room Number",

                    "Medical Condition",

                    "Medication",

                    "Test Results",

                    "Doctor",

                    "Hospital",

                    "Insurance Provider",

                    "Billing Amount"
                ];


                const missingField =
                    requiredFields.find(
                        field =>
                            !patientData[field] ||
                            String(
                                patientData[field]
                            ).trim() === ""
                    );


                if (missingField) {

                    alert(
                        `Please fill ${missingField}.`
                    );

                    return;
                }


                // -------------------------------------------------
                // DETERMINE ADD OR EDIT
                // -------------------------------------------------

                const isEditing =
                    editingPatientId !== null;


                const requestURL =
                    isEditing

                        ?

                        `${API_URL}/api/patients/${editingPatientId}`

                        :

                        `${API_URL}/api/patients`;


                const requestMethod =
                    isEditing
                        ? "PUT"
                        : "POST";


                // -------------------------------------------------
                // SEND TO FLASK BACKEND
                // -------------------------------------------------

                try {

                    const response =
                        await fetch(
                            requestURL,
                            {
                                method:
                                    requestMethod,

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        patientData
                                    )
                            }
                        );


                    let result = {};


                    try {

                        result =
                            await response.json();

                    } catch (jsonError) {

                        console.warn(
                            "Response was not JSON",
                            jsonError
                        );
                    }


                    if (!response.ok) {

                        alert(
                            result.message ||
                            (
                                isEditing
                                    ? "Unable to update patient."
                                    : "Unable to add patient."
                            )
                        );

                        return;
                    }


                    if (isEditing) {

                        alert(
                            "Patient updated successfully! ✓"
                        );

                    } else {

                        alert(
                            "Patient added successfully! 🎉"
                        );
                    }


                    // Clear form

                    addPatientForm.reset();


                    // Reset edit mode

                    editingPatientId =
                        null;


                    // Reset modal text

                    const modalTitle =
                        document.querySelector(
                            ".add-patient-header h2"
                        );


                    const modalDescription =
                        document.querySelector(
                            ".add-patient-header p"
                        );


                    const saveButton =
                        document.querySelector(
                            ".save-patient-btn"
                        );


                    if (modalTitle) {

                        modalTitle.textContent =
                            "Add New Patient";
                    }


                    if (modalDescription) {

                        modalDescription.textContent =
                            "Enter patient information to add a new record to the MediLens database.";
                    }


                    if (saveButton) {

                        saveButton.textContent =
                            "✓ Save Patient";
                    }


                    // Close modal

                    addPatientModal.style.display =
                        "none";


                    document.body.style.overflow =
                        "";


                    // Go to first page

                    currentPage =
                        1;


                    // Refresh patient table

                    await loadPatients();


                    // Refresh dashboard

                    await loadFilteredDashboard();


                    // Refresh filter options

                    await loadFilterOptions();


                } catch (error) {

                    console.error(
                        isEditing
                            ? "Update patient error:"
                            : "Add patient error:",
                        error
                    );


                    alert(
                        "Unable to connect to MediLens server. Please make sure Flask backend is running."
                    );
                }
            }
        );
    }
}


// =====================================================
// KEYBOARD - ESC FOR PATIENT DETAILS
// =====================================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            closePatientModal();
        }
    }
);


// =====================================================
// START DASHBOARD
// =====================================================

async function startDashboard() {

    console.log(
        "MediLens Dashboard starting..."
    );


    // 1. Load dropdown options

    await loadFilterOptions();


    // 2. Load dashboard

    await loadFilteredDashboard();


    // 3. Setup pagination

    setupPagination();


    // 4. Load first page

    await loadPatients();


    // 5. Setup filters

    setupFilters();


    // 6. Setup search

    setupPatientSearch();


    // 7. Setup CSV download

    setupDownloadButton();


    // 8. Setup Add/Edit Patient

    setupAddPatient();


    // 9. Setup Patient Tabs

    setupPatientTabs();


    // 10. Prepare Analytics Dashboard

    loadAnalyticsDashboard();


    console.log(
        "MediLens Dashboard loaded successfully."
    );
}


// =====================================================
// START APPLICATION
// =====================================================

startDashboard();


// =====================================================
// CHART MENU
// =====================================================

function toggleChartMenu(button) {

    const wrapper = button.closest(".chart-menu-wrapper");

    if (!wrapper) return;

    document
        .querySelectorAll(".chart-menu-wrapper.open")
        .forEach(menu => {

            if (menu !== wrapper) {
                menu.classList.remove("open");
            }

        });

    wrapper.classList.toggle("open");
}


// =====================================================
// CHANGE CHART TYPE
// =====================================================

function changeChartType(chartId, newType) {

    let chart = null;

    if (chartId === "conditionChart") {
        chart = conditionChart;
    }
    else if (chartId === "genderChart") {
        chart = genderChart;
    }
    else if (chartId === "admissionChart") {
        chart = admissionChart;
    }
    else if (chartId === "testChart") {
        chart = testChart;
    }

    if (!chart) {
        console.error("Chart not found:", chartId);
        return;
    }

    chart.config.type = newType;

    if (newType === "doughnut" || newType === "pie") {

        chart.options.scales = {};

        chart.options.plugins.legend.display = true;
        chart.options.plugins.legend.position = "bottom";

    } else {

        chart.options.scales = {
            y: {
                beginAtZero: true
            }
        };

        chart.options.plugins.legend.display = false;
    }

    chart.update();

    closeChartMenus();
}


// =====================================================
// CLOSE CHART MENUS
// =====================================================

function closeChartMenus() {

    document
        .querySelectorAll(".chart-menu-wrapper.open")
        .forEach(menu => {
            menu.classList.remove("open");
        });

}

// =====================================================
// CLOSE MENU WHEN CLICKING OUTSIDE
// =====================================================

document.addEventListener("click", function (event) {

    if (!event.target.closest(".chart-menu-wrapper")) {
        closeChartMenus();
    }

});

// =====================================================
// AI PREDICTION
// =====================================================

function setupPrediction() {

    const predictionForm =
        document.getElementById("predictionForm");

    if (!predictionForm) return;


    predictionForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const patientIdInput =
                document.getElementById(
                    "predictionPatientId"
                );

            const predictButton =
                document.getElementById(
                    "predictButton"
                );

            const result =
                document.getElementById(
                    "predictionResult"
                );

            const predictionValue =
                document.getElementById(
                    "predictionValue"
                );

            const predictionConfidence =
                document.getElementById(
                    "predictionConfidence"
                );

            const patientStatus =
                document.getElementById(
                    "predictionPatientStatus"
                );


            // Get Patient ID
            const patientId =
                patientIdInput
                    ? patientIdInput.value.trim()
                    : "";


            // Check Patient ID
            if (!patientId) {

                if (patientStatus) {

                    patientStatus.style.display =
                        "block";

                    patientStatus.textContent =
                        "Please enter a Patient ID.";

                }

                return;
            }


            // Loading state
            if (predictButton) {

                predictButton.disabled = true;

                predictButton.textContent =
                    "⏳ Predicting...";

            }


            if (patientStatus) {

                patientStatus.style.display =
                    "block";

                patientStatus.textContent =
                    "Finding patient record...";

            }


            try {

                // Send Patient ID to backend
                const response =
                    await fetch(
                        `${API_URL}/api/predict`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                patient_id: patientId
                            })
                        }
                    );


                const prediction =
                    await response.json();


                // Handle backend error
                if (!response.ok) {

                    throw new Error(
                        prediction.message ||
                        "Prediction failed."
                    );

                }


                // Show result
if (result) {

    result.style.display = "block";

}

// Hide prediction placeholder
const predictionPlaceholder =
    document.querySelector(
        ".prediction-placeholder"
    );

if (predictionPlaceholder) {

    predictionPlaceholder.style.display =
        "none";

}


                // Show patient information
                if (patientStatus) {

                    patientStatus.textContent =
                        `Patient: ${prediction.patient_name} (${prediction.patient_id})`;

                }


                // Get predicted result
                const predictedResult =
                    prediction.prediction;


                if (predictionValue) {

                    predictionValue.textContent =
                        predictedResult;


                    // Remove previous styling
                    predictionValue.classList.remove(
                        "prediction-normal",
                        "prediction-abnormal",
                        "prediction-inconclusive"
                    );


                    // Add result-specific styling
                    if (
                        predictedResult ===
                        "Normal"
                    ) {

                        predictionValue.classList.add(
                            "prediction-normal"
                        );

                    }

                    else if (
                        predictedResult ===
                        "Abnormal"
                    ) {

                        predictionValue.classList.add(
                            "prediction-abnormal"
                        );

                    }

                    else if (
                        predictedResult ===
                        "Inconclusive"
                    ) {

                        predictionValue.classList.add(
                            "prediction-inconclusive"
                        );

                    }

                }


                // Show confidence
                if (predictionConfidence) {

                    if (
                        prediction.confidence !== null &&
                        prediction.confidence !== undefined
                    ) {

                        predictionConfidence.textContent =
                            `Model Probability: ${prediction.confidence}%`;

                    }

                    else {

                        predictionConfidence.textContent =
                            "Model Probability: Not available";

                    }

                }


                console.log(
                    "Prediction successful:",
                    prediction
                );


            }

            catch (error) {

                console.error(
                    "Prediction error:",
                    error
                );


                if (patientStatus) {

                    patientStatus.style.display =
                        "block";

                    patientStatus.textContent =
                        error.message ||
                        "Unable to generate prediction.";

                }

            }


            finally {

                if (predictButton) {

                    predictButton.disabled =
                        false;

                    predictButton.textContent =
                        "🧠 Predict Test Result";

                }

            }

        }
    );
}


// =====================================================
// START AI PREDICTION
// =====================================================

setupPrediction();

// ===============================
// HOSPITAL SEARCH
// ===============================

const hospitalSearch = document.getElementById("hospitalSearch");
const hospitalResults = document.getElementById("hospitalResults");

let hospitalSearchTimeout;

if (hospitalSearch) {

    hospitalSearch.addEventListener("input", function () {

        clearTimeout(hospitalSearchTimeout);

        const searchText = this.value.trim();

        // Clear selected hospital when user changes search
        if (hospitalFilter) {
            hospitalFilter.value = "All";
        }

        if (!searchText) {
            if (hospitalResults) {
                hospitalResults.innerHTML = "";
                hospitalResults.style.display = "none";
            }
            return;
        }

        // Small delay so we don't send a request for every keystroke
        hospitalSearchTimeout = setTimeout(async function () {

            try {

                const response = await fetch(
                    `${API_URL}/api/hospitals/search?q=${encodeURIComponent(searchText)}`
                );

                if (!response.ok) {
                    throw new Error("Hospital search failed");
                }

                const hospitals = await response.json();

                hospitalResults.innerHTML = "";

                if (hospitals.length === 0) {

                    hospitalResults.innerHTML = `
                        <div class="hospital-no-result">
                            No hospital found
                        </div>
                    `;

                    hospitalResults.style.display = "block";
                    return;
                }

                hospitals.forEach(function (item) {

                    const hospitalItem = document.createElement("button");

                    hospitalItem.type = "button";
                    hospitalItem.className = "hospital-result-item";

                    hospitalItem.innerHTML = `
                        <span>${item.hospital}</span>
                        <small>${item.count} patients</small>
                    `;

                    hospitalItem.addEventListener("click", function () {

                        hospitalSearch.value = item.hospital;

                        if (hospitalFilter) {
                            hospitalFilter.value = item.hospital;
                        }

                        hospitalResults.innerHTML = "";
                        hospitalResults.style.display = "none";

                        // Apply hospital filter
                        loadFilteredDashboard();

                    });

                    hospitalResults.appendChild(hospitalItem);

                });

                hospitalResults.style.display = "block";

            } catch (error) {

                console.error(
                    "Hospital search error:",
                    error
                );

            }

        }, 300);

    });

}



/* =====================================================
   MEDILENS - CARE PLAN FORM
===================================================== */

const carePlanForm = document.getElementById("carePlanForm");

if (carePlanForm) {
    carePlanForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const message = document.getElementById("carePlanMessage");
        const saveButton = carePlanForm.querySelector(
            'button[type="submit"]'
        );

        const payload = {
            patient_id: document.getElementById("carePatientId").value.trim(),
            doctor_reviewed_status: document.getElementById("careStatus").value,
            care_instructions: document.getElementById("careInstructions").value.trim(),
            follow_up_date: document.getElementById("careFollowUpDate").value,
            follow_up_purpose: document.getElementById("careFollowUpPurpose").value.trim(),
            last_reviewed_date: document.getElementById("careReviewDate").value
        };

        message.textContent = "";
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        try {
            const response = await fetch(
                "http://127.0.0.1:5000/api/care-plans",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to save care plan."
                );
            }

            message.textContent = "Care Plan saved successfully!";
            message.style.color = "green";

            carePlanForm.reset();

        } catch (error) {
            message.textContent =
                "Error: " + error.message +
                " Please check that the Flask server is running.";
            message.style.color = "red";

        } finally {
            saveButton.disabled = false;
            saveButton.innerHTML = "<span>✓</span> Save Care Plan";
        }
    });
}
