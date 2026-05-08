async function loadCompatibility() {

    const jsonUrl =
        `${DOCUMENTATION_OPTIONS.URL_ROOT}_static/data/compatibility.json`;

    const response = await fetch(jsonUrl);
    const data = await response.json();

    const table = $('#compatibility-datatable').DataTable({
        data: data,

        columns: [
            { data: 'source', title: 'Source' },
            { data: 'target', title: 'Target' },
            {
                data: 'status',
                title: 'Status',
                render: function (data) {
                    if (data === "OK") return "SUPPORTED";
                    if (data === "PARTIAL") return "PARTIAL";
                    if (data === "FAIL") return "NOT SUPPORTED";
                    return "UNKNOWN";
                }
            },
            {
                data: 'status',
                title: '',
                render: function (data) {
                    if (data === "OK") return "✅";
                    if (data === "PARTIAL") return "⚠️";
                    if (data === "FAIL") return "❌";
                    return "⚪";
                }
            },            
            { data: 'notes', title: 'Notes', searchable: true }
        ],

        pageLength: 10,
        responsive: true,
        dom: 't<"bottom"ip>'
    });



    // ==============================
    // 🔍 GLOBAL SEARCH (Bootstrap)
    // ==============================
    const searchBox = $('<input>', {
        type: 'text',
        class: 'form-control form-control-sm',
        placeholder: 'Search...'
    });

    searchBox.on('keyup', function () {
        table.search(this.value).draw();
    });

    $('.dt-search').append(searchBox);


    // ==============================
    // 🧩 DROPDOWN FILTERS (Bootstrap 5)
    // ==============================
    table.columns().every(function () {

        const column = this;
        const title = $(column.header()).text();

        if (title === '' || title === 'Notes') return;

        // unique values holen
        const uniqueValues = new Set();
        column.data().each(function (d) {
            if (d !== null && d !== undefined) {
                uniqueValues.add(d);
            }
        });

        const select = $('<select>', {
            class: 'form-select form-select-sm'
        });

        select.append(`<option value="">All ${title}</option>`);

        [...uniqueValues].sort().forEach(val => {
            select.append(`<option value="${val}">${val}</option>`);
        });

        select.on('change', function () {
            const val = $.fn.dataTable.util.escapeRegex($(this).val());

            column
                .search(val ? '^' + val + '$' : '', true, false)
                .draw();
        });

        $('.dt-filters').append(
            $('<div class="col-auto"></div>').append(select)
        );
    });

}

document.addEventListener("DOMContentLoaded", loadCompatibility);
