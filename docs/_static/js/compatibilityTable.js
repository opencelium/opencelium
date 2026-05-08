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
    
            { data: 'database', title: 'Database' },
            { data: 'php', title: 'PHP' },
            { data: 'docker', title: 'Docker' },
            { data: 'os', title: 'OS' },
            { data: 'notes', title: 'Notes' }
        ],

        pageLength: 25,
        responsive: true
    });

}
    document.addEventListener(
    "DOMContentLoaded",
    loadCompatibility
);

