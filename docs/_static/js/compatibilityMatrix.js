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
                    if (data === "OK") return "✅ SUPPORTED";
                    if (data === "PARTIAL") return "⚠️ PARTIAL";
                    if (data === "FAIL") return "❌ NOT SUPPORTED";
                    return "⚪ UNKNOWN";
                }
            },
            { data: 'notes', title: 'Notes', searchable: false }
        ],
    
        pageLength: 10,
        responsive: true,
        dom: 't<"bottom"ip>' // kein Default-Suchfeld
    });
    
    
    // ==============================
    // 🔍 Global Search (rechts oben)
    // ==============================
    const searchBox = $('<input>', {
        type: 'text',
        placeholder: 'Search...'
    });
    
    searchBox.on('keyup', function () {
        table.search(this.value).draw();
    });
    
    $('.dt-search').append(searchBox);
    
    
    // ==============================
    // 🧩 Column Filters (Sticky Bar)
    // ==============================
    table.columns().every(function () {
        const column = this;
        const title = $(column.header()).text();
    
        if (title === 'Notes') return;
    
        const input = $('<input>', {
            type: 'text',
            placeholder: 'Filter ' + title
        });
    
        input.on('keyup change clear', function () {
            column.search(this.value).draw();
        });
    
        $('.dt-filters').append(input);
    });
  
}

document.addEventListener("DOMContentLoaded", loadCompatibility);
