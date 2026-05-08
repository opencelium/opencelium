async function loadCompatibility() {

const jsonUrl =
    `${DOCUMENTATION_OPTIONS.URL_ROOT}_static/data/compatibility.json`;

    const response = await fetch(jsonUrl);
    const data = await response.json();

   $('#compatibility-table').html(`
        <table id="compatibility-datatable"
               class="display">
        </table>
    `);
    
    $('#compatibility-datatable').DataTable({
    
        data: data,
    
        columns: [
            { data: 'source', title: 'Source' },
            { data: 'target', title: 'Target' },
    
            {
                data: 'status',
                title: 'Status',
                render: function (data, type, row) {
    
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
    
            { data: 'notes', title: 'Notes' }
        ],

        pageLength: 10,
        responsive: true,
    
        initComplete: function () {
            const api = this.api();
    
            api.columns().every(function () {
                const column = this;
                const title = $(column.header()).text();
    
                if (title === 'Notes') return;
    
                const input = document.createElement("input");
                input.placeholder = "Filter " + title;
                input.style.width = "100%";
    
                $(input).appendTo($(column.header()).empty())
                    .on('keyup change clear', function () {
                        if (column.search() !== this.value) {
                            column.search(this.value).draw();
                        }
                    });
            });
        }        
    });

}
    document.addEventListener(
    "DOMContentLoaded",
    loadCompatibility
);

