async function loadCompatibility2() {

const jsonUrl =
    `${DOCUMENTATION_OPTIONS.URL_ROOT}_static/data/compatibility.json`;

const response = await fetch(jsonUrl);
    const data = await response.json();

    let html = `
        <table class="compatibility-table">
            <thead>
                <tr>
                    <th>Source</th>
                    <th>Target</th>
                    <th>Status</th>
                    <th>Database</th>
                    <th>PHP</th>
                    <th>Docker</th>
                    <th>OS</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody id="compatibility-body"></tbody>
        </table>
    `;
alert("hier");
    document.getElementById("compatibility-table").innerHTML = html;

    const tbody = document.getElementById("compatibility-body");

    function render(filter = "") {

        tbody.innerHTML = "";

        data
            .filter(row =>
                JSON.stringify(row)
                    .toLowerCase()
                    .includes(filter.toLowerCase())
            )
            .forEach(row => {

                let badge = "⚪ UNKNOWN";

                if (row.status === "OK")
                    badge = "✅ SUPPORTED";

                if (row.status === "PARTIAL")
                    badge = "⚠️ PARTIAL";

                if (row.status === "FAIL")
                    badge = "❌ NOT SUPPORTED";

                tbody.innerHTML += `
                    <tr>
                        <td>${row.source}</td>
                        <td>${row.target}</td>
                        <td>${badge}</td>
                        <td>${row.database}</td>
                        <td>${row.php}</td>
                        <td>${row.docker}</td>
                        <td>${row.os}</td>
                        <td>${row.notes}</td>
                    </tr>
                `;
            });
    }

    render();

    document
        .getElementById("search")
        .addEventListener("input", e => {
            render(e.target.value);
        });
}

document.addEventListener(
    "DOMContentLoaded",
    loadCompatibility2
);
