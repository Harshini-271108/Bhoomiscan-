/* =========================================
   BHOOMI-X LAND SURVEY SYSTEM
========================================= */

const STORAGE_KEY = "bhoomiXRecords";

let records = [];
let map = null;
let currentLocation = null;


/* =========================================
   LOAD RECORDS
========================================= */

function getRecords() {
    try {
        return JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        ) || [];
    } catch (error) {
        console.error("Unable to load records:", error);
        return [];
    }
}


function saveRecords() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(records)
    );
}


/* =========================================
   PAGE NAVIGATION
========================================= */

function showPage(pageId, button = null) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active-page");
    });

    const page = document.getElementById(pageId);

    if (!page) return;

    page.classList.add("active-page");


    document.querySelectorAll(".menu-item").forEach(item => {
        item.classList.remove("active");
    });


    if (button) {

        button.classList.add("active");

    } else {

        document.querySelectorAll(".menu-item").forEach(item => {

            const text =
                item.innerText.toLowerCase();

            if (
                (pageId === "home" &&
                    text.includes("home")) ||

                (pageId === "register" &&
                    text.includes("registration")) ||

                (pageId === "resurvey" &&
                    text.includes("resurvey")) ||

                (pageId === "search" &&
                    text.includes("search")) ||

                (pageId === "records" &&
                    text.includes("all records")) ||

                (pageId === "mapPage" &&
                    text.includes("land map"))
            ) {
                item.classList.add("active");
            }

        });
    }


    const titles = {

        home: [
            "Dashboard",
            "Smart agricultural land survey management"
        ],

        register: [
            "Survey Registration",
            "Register a new land survey record"
        ],

        resurvey: [
            "Resurvey",
            "Update existing land information"
        ],

        search: [
            "Search Records",
            "Search registered land records"
        ],

        records: [
            "All Records",
            "Complete survey records"
        ],

        mapPage: [
            "Land Map",
            "Interactive land visualization"
        ]

    };


    if (titles[pageId]) {

        const title =
            document.getElementById("pageTitle");

        const subtitle =
            document.getElementById("pageSubtitle");

        if (title) {
            title.textContent =
                titles[pageId][0];
        }

        if (subtitle) {
            subtitle.textContent =
                titles[pageId][1];
        }
    }


    if (pageId === "records") {
        renderRecordsTable();
    }


    if (pageId === "mapPage") {

        setTimeout(() => {

            initializeMap();

            if (map) {

                map.invalidateSize();

                updateMap();

            }

        }, 250);

    }


    if (pageId === "home") {
        updateDashboardStats();
    }
}


/* =========================================
   DATE
========================================= */

function showDate() {

    const element =
        document.getElementById("currentDate");

    if (!element) return;

    const now = new Date();

    element.textContent =
        now.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
}


/* =========================================
   DASHBOARD STATISTICS
========================================= */

function updateDashboardStats() {

    records = getRecords();


    function countType(type) {

        return records.filter(record => {

            return String(
                record.landType || ""
            )
                .trim()
                .toLowerCase()
                === type.toLowerCase();

        }).length;

    }


    function setValue(id, value) {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent = value;
        }

    }


    setValue(
        "totalSurveys",
        records.length
    );

    setValue(
        "agriculturalCount",
        countType("Agricultural")
    );

    setValue(
        "wetCount",
        countType("Wet")
    );

    setValue(
        "dryCount",
        countType("Dry")
    );

    setValue(
        "residentialCount",
        countType("Residential")
    );

    setValue(
        "forestCount",
        countType("Forest")
    );

    setValue(
        "barrenCount",
        countType("Barren")
    );

    setValue(
        "otherCount",
        countType("Other")
    );
}


/* =========================================
   LOCATION SEARCH
========================================= */

async function findLocation() {

    const addressInput =
        document.getElementById("address");

    const status =
        document.getElementById("locationStatus");

    if (!addressInput || !status) return;


    const address =
        addressInput.value.trim();


    if (!address) {

        status.innerHTML =
            "⚠️ Please enter a location first.";

        return;
    }


    status.innerHTML =
        "📍 Finding complete location details...";


    try {

        const url =
            "https://nominatim.openstreetmap.org/search?" +
            "format=jsonv2" +
            "&addressdetails=1" +
            "&limit=1" +
            "&countrycodes=in" +
            "&q=" +
            encodeURIComponent(address);


        const response =
            await fetch(
                url,
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Location service unavailable"
            );

        }


        const data =
            await response.json();


        if (!data.length) {

            status.innerHTML =
                "❌ Location not found. Try Village + Mandal + District.";

            currentLocation = null;

            return;
        }


        const place =
            data[0];

        const a =
            place.address || {};


        const lat =
            Number(place.lat);

        const lon =
            Number(place.lon);


        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lon)
        ) {

            throw new Error(
                "Invalid coordinates"
            );

        }


        currentLocation = {

            lat: lat,

            lng: lon

        };


        /* ADDRESS COMPONENTS */

        const village =
            a.village ||
            a.hamlet ||
            a.suburb ||
            a.town ||
            a.city ||
            "Not available";


        const mandal =
            a.municipality ||
            a.township ||
            a.county ||
            a.city_district ||
            "Not available";


        const district =
            a.state_district ||
            a.district ||
            a.county ||
            "Not available";


        const state =
            a.state ||
            "Not available";


        const pincode =
            a.postcode ||
            "Not available";


        const country =
            a.country ||
            "India";


        /* DISPLAY COMPLETE LOCATION */

        status.innerHTML = `

            <div class="location-details">

                <div class="location-title">
                    📍 Location Details
                </div>

                <div class="location-grid">

                    <div>
                        <span>Village / Town</span>
                        <strong>
                            ${escapeHTML(village)}
                        </strong>
                    </div>

                    <div>
                        <span>Mandal / Taluk</span>
                        <strong>
                            ${escapeHTML(mandal)}
                        </strong>
                    </div>

                    <div>
                        <span>District</span>
                        <strong>
                            ${escapeHTML(district)}
                        </strong>
                    </div>

                    <div>
                        <span>State</span>
                        <strong>
                            ${escapeHTML(state)}
                        </strong>
                    </div>

                    <div>
                        <span>Pincode</span>
                        <strong>
                            ${escapeHTML(pincode)}
                        </strong>
                    </div>

                    <div>
                        <span>Country</span>
                        <strong>
                            ${escapeHTML(country)}
                        </strong>
                    </div>

                </div>

                <div class="location-success">
                    ✓ Location selected successfully
                </div>

            </div>
        `;


        /* MOVE MAP */

        if (map) {

            map.setView(
                [lat, lon],
                16
            );

        }

    } catch (error) {

        console.error(
            "Location search error:",
            error
        );

        currentLocation = null;

        status.innerHTML =
            "⚠️ Location details could not be loaded. Please try again.";

    }
}


/* =========================================
   RESET LOCATION
========================================= */

function resetLocation() {

    currentLocation = null;

    const status =
        document.getElementById(
            "locationStatus"
        );

    if (status) {

        status.textContent =
            "Location not selected";

    }
}


/* =========================================
   SURVEY REGISTRATION
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const form =
            document.getElementById(
                "surveyForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                function(event) {

                    event.preventDefault();


                    records =
                        getRecords();


                    const surveyInput =
                        document.getElementById(
                            "surveyNo"
                        );

                    const ownerInput =
                        document.getElementById(
                            "ownerName"
                        );

                    const landTypeInput =
                        document.getElementById(
                            "landType"
                        );

                    const areaInput =
                        document.getElementById(
                            "area"
                        );

                    const addressInput =
                        document.getElementById(
                            "address"
                        );


                    if (
                        !surveyInput ||
                        !ownerInput ||
                        !landTypeInput ||
                        !areaInput ||
                        !addressInput
                    ) {
                        return;
                    }


                    const surveyNo =
                        surveyInput.value.trim();


                    const ownerName =
                        ownerInput.value.trim();


                    const landType =
                        landTypeInput.value;


                    const area =
                        areaInput.value;


                    const address =
                        addressInput.value.trim();


                    if (
                        !surveyNo ||
                        !ownerName ||
                        !landType ||
                        !address
                    ) {

                        alert(
                            "Please fill all required fields."
                        );

                        return;
                    }


                    /* DUPLICATE CHECK */

                    const duplicate =
                        records.some(
                            record =>

                                String(
                                    record.surveyNo
                                )
                                    .toLowerCase()
                                    ===
                                surveyNo.toLowerCase()
                        );


                    if (duplicate) {

                        alert(
                            "This Survey Number is already registered."
                        );

                        return;
                    }


                    /* NEW RECORD */

                    const newRecord = {

                        id:
                            Date.now(),

                        surveyNo:
                            surveyNo,

                        ownerName:
                            ownerName,

                        landType:
                            landType,

                        area:
                            area || "0",

                        address:
                            address,

                        lat:
                            currentLocation
                                ? currentLocation.lat
                                : null,

                        lng:
                            currentLocation
                                ? currentLocation.lng
                                : null,

                        date:
                            new Date()
                                .toISOString()

                    };


                    records.push(
                        newRecord
                    );


                    saveRecords();


                    alert(
                        "Survey registered successfully!"
                    );


                    form.reset();


                    resetLocation();


                    updateDashboardStats();


                    renderRecordsTable();


                    updateMap();

                }
            );
        }


        records =
            getRecords();


        showDate();


        updateDashboardStats();


        renderRecordsTable();

    }
);
/* =========================================
   SEARCH RECORDS
========================================= */

function searchRecords() {

    records =
        getRecords();


    const input =
        document.getElementById(
            "recordSearch"
        );


    const result =
        document.getElementById(
            "searchResults"
        );


    if (!input || !result) return;


    const query =
        input.value
            .trim()
            .toLowerCase();


    if (!query) {

        result.innerHTML =
            "<p class='location-status'>Enter a survey number or owner name.</p>";

        return;
    }


    const matches =
        records.filter(
            record =>

                String(
                    record.surveyNo
                )
                    .toLowerCase()
                    .includes(query)

                ||

                String(
                    record.ownerName
                )
                    .toLowerCase()
                    .includes(query)

                ||

                String(
                    record.landType
                )
                    .toLowerCase()
                    .includes(query)

        );


    if (!matches.length) {

        result.innerHTML =
            "<p class='location-status'>No matching records found.</p>";

        return;
    }


    result.innerHTML =
        matches.map(
            record => {

                return `

                    <div class="result-card">

                        <h3>
                            ${escapeHTML(
                                record.surveyNo
                            )}
                        </h3>

                        <p>
                            <b>Owner:</b>
                            ${escapeHTML(
                                record.ownerName
                            )}
                        </p>

                        <p>
                            <b>Land Type:</b>
                            ${escapeHTML(
                                record.landType
                            )}
                        </p>

                        <p>
                            <b>Area:</b>
                            ${escapeHTML(
                                record.area
                            )}
                            acres
                        </p>

                        <p>
                            <b>Address:</b>
                            ${escapeHTML(
                                record.address
                            )}
                        </p>

                        <div class="result-actions">

                            <button
                                class="small-btn"
                                onclick="showRecordOnMap(${record.id})">
                                🗺️ Show on Map
                            </button>

                            <button
                                class="small-btn"
                                onclick="deleteRecord(${record.id})">
                                🗑 Delete
                            </button>

                        </div>

                    </div>

                `;

            }
        ).join("");

}


/* =========================================
   RESURVEY
========================================= */

function loadResurvey() {

    records =
        getRecords();


    const searchInput =
        document.getElementById(
            "resurveySearch"
        );


    const result =
        document.getElementById(
            "resurveyResult"
        );


    if (!searchInput || !result) {
        return;
    }


    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!search) {

        result.innerHTML =
            "<p class='location-status'>Enter a Survey Number.</p>";

        return;
    }


    const record =
        records.find(
            item =>

                String(
                    item.surveyNo
                )
                    .toLowerCase()
                    === search
        );


    if (!record) {

        result.innerHTML =
            "<p class='location-status'>Survey record not found.</p>";

        return;
    }


    result.innerHTML = `

        <div class="result-card">

            <h3>
                Resurvey:
                ${escapeHTML(record.surveyNo)}
            </h3>

            <div class="form-grid">

                <div class="form-group">

                    <label>
                        Owner Name
                    </label>

                    <input
                        id="updateOwner"
                        value="${escapeAttribute(
                            record.ownerName
                        )}">

                </div>


                <div class="form-group">

                    <label>
                        Land Type
                    </label>

                    <select
                        id="updateLandType">

                        <option
                            value="Agricultural"
                            ${
                                record.landType ===
                                "Agricultural"
                                    ? "selected"
                                    : ""
                            }>
                            Agricultural
                        </option>

                        <option
                            value="Wet"
                            ${
                                record.landType ===
                                "Wet"
                                    ? "selected"
                                    : ""
                            }>
                            Wet
                        </option>

                        <option
                            value="Dry"
                            ${
                                record.landType ===
                                "Dry"
                                    ? "selected"
                                    : ""
                            }>
                            Dry
                        </option>

                        <option
                            value="Residential"
                            ${
                                record.landType ===
                                "Residential"
                                    ? "selected"
                                    : ""
                            }>
                            Residential
                        </option>

                        <option
                            value="Forest"
                            ${
                                record.landType ===
                                "Forest"
                                    ? "selected"
                                    : ""
                            }>
                            Forest
                        </option>

                        <option
                            value="Barren"
                            ${
                                record.landType ===
                                "Barren"
                                    ? "selected"
                                    : ""
                            }>
                            Barren
                        </option>

                        <option
                            value="Other"
                            ${
                                record.landType ===
                                "Other"
                                    ? "selected"
                                    : ""
                            }>
                            Other
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label>
                        Area
                    </label>

                    <input
                        id="updateArea"
                        type="number"
                        step="0.01"
                        value="${escapeAttribute(
                            record.area
                        )}">

                </div>


                <div class="form-group">

                    <label>
                        Address
                    </label>

                    <input
                        id="updateAddress"
                        value="${escapeAttribute(
                            record.address
                        )}">

                </div>

            </div>


            <div class="form-actions">

                <button
                    class="primary-btn"
                    onclick="updateRecord(${record.id})">

                    💾 Save Resurvey

                </button>

            </div>

        </div>

    `;
}


/* =========================================
   UPDATE RECORD
========================================= */

function updateRecord(id) {

    records =
        getRecords();


    const record =
        records.find(
            item =>
                item.id === id
        );


    if (!record) return;


    const owner =
        document.getElementById(
            "updateOwner"
        );

    const landType =
        document.getElementById(
            "updateLandType"
        );

    const area =
        document.getElementById(
            "updateArea"
        );

    const address =
        document.getElementById(
            "updateAddress"
        );


    if (
        !owner ||
        !landType ||
        !area ||
        !address
    ) {
        return;
    }


    record.ownerName =
        owner.value.trim();


    record.landType =
        landType.value;


    record.area =
        area.value;


    record.address =
        address.value.trim();


    record.updatedAt =
        new Date().toISOString();


    saveRecords();


    alert(
        "Resurvey updated successfully!"
    );


    updateDashboardStats();


    renderRecordsTable();


    updateMap();


    loadResurvey();
}


/* =========================================
   RECORD TABLE
========================================= */

function renderRecordsTable() {

    records =
        getRecords();


    const body =
        document.getElementById(
            "recordsTableBody"
        );


    if (!body) return;


    if (!records.length) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#78847c;
                    ">

                    No survey records available.

                </td>

            </tr>

        `;

        return;
    }


    body.innerHTML =
        records.map(
            record => {

                return `

                    <tr>

                        <td>

                            <b>
                                ${escapeHTML(
                                    record.surveyNo
                                )}
                            </b>

                        </td>

                        <td>
                            ${escapeHTML(
                                record.ownerName
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                record.landType
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                record.area
                            )}
                            acres
                        </td>

                        <td>
                            ${escapeHTML(
                                record.address
                            )}
                        </td>

                        <td>

                            <button
                                class="small-btn"
                                onclick="showRecordOnMap(${record.id})">

                                🗺️ Map

                            </button>

                            <button
                                class="small-btn"
                                onclick="deleteRecord(${record.id})">

                                🗑

                            </button>

                        </td>

                    </tr>

                `;

            }
        ).join("");
}


/* =========================================
   DELETE RECORD
========================================= */

function deleteRecord(id) {

    if (
        !confirm(
            "Delete this survey record?"
        )
    ) {
        return;
    }


    records =
        getRecords().filter(
            record =>
                record.id !== id
        );


    saveRecords();


    updateDashboardStats();


    renderRecordsTable();


    updateMap();


    searchRecords();
}


/* =========================================
   CLEAR ALL RECORDS
========================================= */

function clearAllRecords() {

    records =
        getRecords();


    if (!records.length) {

        alert(
            "No records available."
        );

        return;
    }


    if (
        !confirm(
            "Are you sure you want to delete all survey records?"
        )
    ) {
        return;
    }


    localStorage.removeItem(
        STORAGE_KEY
    );


    records = [];


    updateDashboardStats();


    renderRecordsTable();


    updateMap();


    alert(
        "All records deleted."
    );
}


/* =========================================
   MAP INITIALIZATION
========================================= */
function initializeMap() {

    if (typeof L === "undefined") {

        console.warn(
            "Leaflet library could not be loaded."
        );

        return;
    }


    if (map) {

        setTimeout(
            () => {

                map.invalidateSize();

            },
            100
        );

        return;
    }


    const mapElement =
        document.getElementById(
            "map"
        );


    if (!mapElement) {
        return;
    }


    try {

        /*
         * MAP SETTINGS
         *
         * Maximum zoom limited to 18
         * to avoid unavailable tile levels.
         */

        map =
            L.map(
                "map",
                {
                    zoomControl: true,

                    minZoom: 5,

                    maxZoom: 18
                }
            );


        /*
         * ESRI STREET MAP
         *
         * maxNativeZoom prevents the map
         * from requesting unsupported
         * higher zoom tiles.
         */

        L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
            {
                minZoom: 5,

                maxZoom: 18,

                maxNativeZoom: 18,

                attribution:
                    "© Esri"
            }
        ).addTo(map);


        /*
         * DEFAULT LOCATION
         */

        map.setView(
            [
                16.5062,
                80.6480
            ],
            10
        );


        /*
         * TILE ERROR HANDLING
         */

        map.on(
            "tileerror",
            function(event) {

                console.warn(
                    "A map tile could not be loaded:",
                    event
                );

            }
        );


        /*
         * MAP SIZE FIX
         */

        setTimeout(
            () => {

                if (map) {

                    map.invalidateSize();

                    updateMap();

                }

            },
            400
        );


    } catch (error) {

        console.error(
            "Map initialization error:",
            error
        );

    }
}


/* =========================================
   LAND STYLE
========================================= */

function getLandStyle(type) {

    const styles = {

        Agricultural: {

            color: "#218c4b",

            fillColor: "#52b96b",

            emoji: "🌱"

        },

        Wet: {

            color: "#287eb5",

            fillColor: "#61b3e2",

            emoji: "💧"

        },

        Dry: {

            color: "#b38a16",

            fillColor: "#e4c44d",

            emoji: "🌾"

        },

        Residential: {

            color: "#c7651b",

            fillColor: "#ed9a55",

            emoji: "🏠"

        },

        Forest: {

            color: "#145a35",

            fillColor: "#318052",

            emoji: "🌳"

        },

        Barren: {

            color: "#80613e",

            fillColor: "#aa8a65",

            emoji: "🪨"

        },

        Other: {

            color: "#707070",

            fillColor: "#a5a5a5",

            emoji: "•"

        }

    };


    return (
        styles[type] ||
        styles.Other
    );
}


/* =========================================
   UPDATE MAP
========================================= */

function updateMap() {

    if (!map) return;


    try {

        /*
         * REMOVE OLD SURVEY LAYERS
         */

        map.eachLayer(
            function(layer) {

                if (
                    layer instanceof L.Polygon ||
                    layer instanceof L.Marker
                ) {

                    map.removeLayer(
                        layer
                    );

                }

            }
        );


        records =
            getRecords();


        /*
         * ONLY RECORDS WITH LOCATION
         */

        const validRecords =
            records.filter(
                record =>

                    Number.isFinite(
                        Number(
                            record.lat
                        )
                    )

                    &&

                    Number.isFinite(
                        Number(
                            record.lng
                        )
                    )
            );


        /*
         * DRAW EVERY SURVEY PLOT
         */

        validRecords.forEach(
            function(record) {

                const lat =
                    Number(
                        record.lat
                    );


                const lng =
                    Number(
                        record.lng
                    );


                const style =
                    getLandStyle(
                        record.landType
                    );


                /*
                 * SMALL VISUAL PLOT
                 */

                const size =
                    0.0008;


                const polygon = [

                    [
                        lat - size,
                        lng - size
                    ],

                    [
                        lat - size,
                        lng + size
                    ],

                    [
                        lat + size,
                        lng + size
                    ],

                    [
                        lat + size,
                        lng - size
                    ]

                ];


                /*
                 * LAND POLYGON
                 */

                const landPolygon =
                    L.polygon(
                        polygon,
                        {

                            color:
                                style.color,

                            fillColor:
                                style.fillColor,

                            fillOpacity:
                                0.55,

                            weight:
                                2

                        }
                    ).addTo(map);


                /*
                 * POPUP
                 */

                landPolygon.bindPopup(`

                    <div
                        style="
                            min-width:200px;
                            line-height:1.6;
                        ">

                        <h3
                            style="
                                margin-bottom:8px;
                            ">

                            ${style.emoji}

                            ${escapeHTML(
                                record.surveyNo
                            )}

                        </h3>

                        <b>
                            Owner:
                        </b>

                        ${escapeHTML(
                            record.ownerName
                        )}

                        <br>

                        <b>
                            Land Type:
                        </b>

                        ${escapeHTML(
                            record.landType
                        )}

                        <br>

                        <b>
                            Area:
                        </b>

                        ${escapeHTML(
                            record.area
                        )}
                        acres

                        <br>

                        <b>
                            Address:
                        </b>

                        ${escapeHTML(
                            record.address
                        )}

                    </div>

                `);


                /*
                 * SURVEY NUMBER LABEL
                 */

                const labelIcon =
                    L.divIcon({

                        className:
                            "survey-label",

                        html:

                            `<div style="
                                background:white;
                                border:1px solid ${style.color};
                                padding:3px 6px;
                                border-radius:5px;
                                font-weight:bold;
                                font-size:11px;
                                color:${style.color};
                                white-space:nowrap;
                                box-shadow:0 1px 4px rgba(0,0,0,.15);
                            ">

                                ${style.emoji}

                                ${escapeHTML(
                                    record.surveyNo
                                )}

                            </div>`,

                        iconSize:
                            [90, 25],

                        iconAnchor:
                            [45, 12]

                    });


                L.marker(
                    [
                        lat,
                        lng
                    ],
                    {
                        icon:
                            labelIcon
                    }
                ).addTo(map);

            }
        );


        /*
         * FIT ALL REGISTERED PLOTS
         */

        if (
            validRecords.length
        ) {

            const bounds =
                L.latLngBounds(
                    validRecords.map(
                        record => [

                            Number(
                                record.lat
                            ),

                            Number(
                                record.lng
                            )

                        ]
                    )
                );


            if (
                bounds.isValid()
            ) {

                map.fitBounds(
                    bounds.pad(0.2)
                );

            }

        }

    } catch (error) {

        console.error(
            "Map update error:",
            error
        );

    }
}


/* =========================================
   SHOW RECORD ON MAP
========================================= */

function showRecordOnMap(id) {

    records =
        getRecords();


    const record =
        records.find(
            item =>
                item.id === id
        );


    if (!record) {
        return;
    }


    showPage(
        "mapPage"
    );


    setTimeout(
        function() {

            initializeMap();


            if (!map) {
                return;
            }


            const lat =
                Number(
                    record.lat
                );


            const lng =
                Number(
                    record.lng
                );


            if (
                Number.isFinite(lat)
                &&
                Number.isFinite(lng)
            ) {

                map.setView(
                    [
                        lat,
                        lng
                    ],
                    17
                );


                updateMap();


            } else {

                alert(
                    "This survey does not have a saved map location."
                );

            }

        },
        400
    );
}


/* =========================================
   REFRESH MAP
========================================= */

function refreshMap() {

    initializeMap();


    if (map) {

        map.invalidateSize();

        updateMap();

    }
}


/* =========================================
   SECURITY HELPERS
========================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


function escapeAttribute(value) {

    return escapeHTML(
        value
    );
}
