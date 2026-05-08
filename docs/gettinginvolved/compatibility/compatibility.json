async function loadCompatibility() {
    const response = await fetch("compatibility.json");
    const data = await response.json();

    let html = `
        <input type="text" id="search" placeholder="Search..." />

        <table>
            <thead>
                <tr>
                    <th>Source</th>
                    <th>Target</th>
                    <th>Status</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody id="table-body"></tbody>
        </table>
    `;

    document.getElementById("compatibility-table").innerHTML = html;

    const tbody = document.getElementById("table-body");

    function render(filter = "") {
        tbody.innerHTML = "";

        data
            .filter(row =>
                JSON.stringify(row)
                    .toLowerCase()
                    .includes(filter.toLowerCase())
            )
            .forEach(row => {

                let icon = "⏳";

                if (row.status === "OK") icon = "✅";
                if (row.status === "FAIL") icon = "❌";
                if (row.status === "PARTIAL") icon = "⚠️";

                tbody.innerHTML += `
                    <tr>
                        <td>${row.source}</td>
                        <td>${row.target}</td>
                        <td>${icon}</td>
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

loadCompatibility();
