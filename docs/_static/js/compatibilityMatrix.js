async function loadCompatibility() {

    const jsonUrl =
        `${DOCUMENTATION_OPTIONS.URL_ROOT}_static/data/compatibility.json`;

    const response = await fetch(jsonUrl);
    const data = await response.json();

    const STORAGE_KEY = "compatibility_filters";

    // =========================
    // Persistenz laden
    // =========================
    function loadFilters() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch {
            return {};
        }
    }

    function saveFilters(filters) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    }

    let savedFilters = loadFilters();

    $('#compatibility-table').html(`
        <table id="compatibility-datatable" class="display"></table>
    `);

    function getUniqueValues(arr, key) {
        return [...new Set(arr.map(item => item[key]).filter(Boolean))].sort();
    }

    const statusOptions = [
        { value: "OK", label: "SUPPORTED" },
        { value: "PARTIAL", label: "PARTIAL" },
        { value: "FAIL", label: "NOT SUPPORTED" }
    ];

    const sourceOptions = getUniqueValues(data, "source");
    const targetOptions = getUniqueValues(data, "target");

    const table = $('#compatibility-datatable').DataTable({

        data: data,

        columns: [
            { data: 'source', title: 'Source' },
            { data: 'target', title: 'Target' },

            {
                data: 'status',
                title: 'Status',
                render: function (data) {

                    let badge = "⚪ UNKNOWN";

                    if (data === "OK")
                        badge = "✅ SUPPORTED";

                    if (data === "PARTIAL")
                        badge = "⚠️ PARTIAL";

                    if (data === "FAIL")
                        badge = "❌ NOT SUPPORTED";

                    return badge;
                }
            },

            { data: 'notes', title: 'Notes', searchable: false }
        ],

        pageLength: 10,
        responsive: true,

        // =========================
        // FAIL Highlighting
        // =========================
        rowCallback: function (row, data) {
            if (data.status === "FAIL") {
                $(row).css("background-color", "#ffe6e6");
            }
        },

        initComplete: function () {

            const api = this.api();

            api.columns().every(function () {

                const column = this;
                const title = $(column.header()).text();

                if (title === 'Notes') return;

                const header = $(column.header());

                header.html(`
                    <div style="font-weight:600;">${title}</div>
                    <div class="filter-container"></div>
                `);

                const container = header.find(".filter-container");

                let savedValue = savedFilters[title] || [];

                // =========================
                // STATUS (Multi-Select)
                // =========================
                if (title === 'Status') {

                    const select = document.createElement("select");
                    select.multiple = true;
                    select.style.width = "100%";

                    select.innerHTML =
                        statusOptions.map(s =>
                            `<option value="${s.value}" ${savedValue.includes(s.value) ? "selected" : ""}>
                                ${s.label}
                            </option>`
                        ).join("");

                    $(select).appendTo(container)
                        .on('change', function () {

                            const values = $(this).val() || [];

                            savedFilters[title] = values;
                            saveFilters(savedFilters);

                            const regex = values.length
                                ? values.join("|")
                                : "";

                            column.search(regex, true, false).draw();
                        });

                    // initial apply
                    if (savedValue.length) {
                        column.search(savedValue.join("|"), true, false);
                    }

                    return;
                }

                // =========================
                // SOURCE / TARGET (Multi-Select)
                // =========================
                if (title === 'Source' || title === 'Target') {

                    const options = title === 'Source' ? sourceOptions : targetOptions;

                    const select = document.createElement("select");
                    select.multiple = true;
                    select.style.width = "100%";

                    select.innerHTML =
                        options.map(v =>
                            `<option value="${v}" ${savedValue.includes(v) ? "selected" : ""}>${v}</option>`
                        ).join("");

                    $(select).appendTo(container)
                        .on('change', function () {

                            const values = $(this).val() || [];

                            savedFilters[title] = values;
                            saveFilters(savedFilters);

                            const regex = values.length ? values.join("|") : "";

                            column.search(regex, true, false).draw();
                        });

                    if (savedValue.length) {
                        column.search(savedValue.join("|"), true, false);
                    }

                    return;
                }

                // =========================
                // DEFAULT TEXT FILTER
                // =========================
                const input = document.createElement("input");
                input.placeholder = "Filter " + title;
                input.style.width = "100%";
                input.value = savedValue || "";

                $(input).appendTo(container)
                    .on('keyup change clear', function () {

                        savedFilters[title] = this.value;
                        saveFilters(savedFilters);

                        column.search(this.value).draw();
                    });

                if (savedValue) {
                    column.search(savedValue).draw();
                }
            });
        }
    });
}

document.addEventListener("DOMContentLoaded", loadCompatibility);
