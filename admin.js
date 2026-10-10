let currentCustomerId = null;


// ======================================================
// LOAD QUEUE
// ======================================================

async function loadQueue() {

    try {

        const response = await fetch("/api/admin/queue");
        const data = await response.json();

        if (!data.success) {
            alert(data.message);
            return;
        }

        const queue = data.queue;

        const table = document.getElementById("queueTable");

        table.innerHTML = "";


        // -----------------------------
        // Statistics
        // -----------------------------

        const waiting = queue.filter(
            customer => customer.status === "waiting"
        ).length;

        const serving = queue.find(
            customer => customer.status === "serving"
        );

        const completed = queue.filter(
            customer => customer.status === "completed"
        ).length;

        const skipped = queue.filter(
            customer => customer.status === "skipped"
        ).length;


        document.getElementById("waitingCount").textContent = waiting;

        document.getElementById("servingToken").textContent =
            serving
                ? "A-" + String(serving.token_number).padStart(3, "0")
                : "—";

        document.getElementById("completedCount").textContent =
            completed;

        document.getElementById("skippedCount").textContent =
            skipped;


        // -----------------------------
        // Current customer
        // -----------------------------

        if (serving) {

            currentCustomerId = serving.id;

            document.getElementById("currentToken").textContent =
                "A-" + String(serving.token_number).padStart(3, "0");

            document.getElementById("currentName").textContent =
                serving.customer_name;

            document.getElementById("currentService").textContent =
                serving.service_type;

        } else {

            currentCustomerId = null;

            document.getElementById("currentToken").textContent = "—";

            document.getElementById("currentName").textContent =
                "No customer";

            document.getElementById("currentService").textContent =
                "—";
        }


        // -----------------------------
        // Empty queue
        // -----------------------------

        if (queue.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="6">
                        No customers in the queue.
                    </td>
                </tr>
            `;

            return;
        }


        // -----------------------------
        // Create table rows
        // -----------------------------

        queue.forEach(customer => {

            const row = document.createElement("tr");

            const token =
                "A-" + String(customer.token_number).padStart(3, "0");


            let action = "";

            if (customer.status === "waiting") {

                action = `
                    <button
                        class="skip-btn"
                        onclick="skipCustomer(${customer.id})"
                    >
                        Skip
                    </button>
                `;

            } else if (customer.status === "serving") {

                action = `
                    <button
                        class="complete-btn"
                        onclick="completeCustomer(${customer.id})"
                    >
                        Complete
                    </button>
                `;

            } else {

                action = "—";
            }


            row.innerHTML = `

                <td>${token}</td>

                <td>${customer.customer_name}</td>

                <td>${customer.service_type}</td>

                <td>
                    ${new Date(customer.joined_at).toLocaleString()}
                </td>

                <td>
                    <span class="status ${customer.status}">
                        ${customer.status}
                    </span>
                </td>

                <td>
                    ${action}
                </td>

            `;

            table.appendChild(row);

        });


    } catch (error) {

        console.error("Queue loading error:", error);

        alert("Could not load queue.");

    }
}


// ======================================================
// CALL NEXT CUSTOMER
// ======================================================

async function callNextCustomer() {

    try {

        const response = await fetch(
            "/api/admin/call-next",
            {
                method: "POST"
            }
        );

        const data = await response.json();


        if (!data.success) {

            alert(data.message);

            return;
        }


        alert(
            "Now serving A-" +
            String(data.customer.token_number).padStart(3, "0") +
            " - " +
            data.customer.customer_name
        );


        loadQueue();

    } catch (error) {

        console.error(error);

        alert("Could not call the next customer.");

    }
}


// ======================================================
// COMPLETE CURRENT CUSTOMER
// ======================================================

async function completeCurrentCustomer() {

    if (!currentCustomerId) {

        alert("There is no customer currently being served.");

        return;
    }

    await completeCustomer(currentCustomerId);
}


// ======================================================
// COMPLETE CUSTOMER
// ======================================================

async function completeCustomer(id) {

    try {

        const response = await fetch(
            `/api/admin/complete/${id}`,
            {
                method: "POST"
            }
        );

        const data = await response.json();


        if (!data.success) {

            alert(data.message);

            return;
        }


        loadQueue();

    } catch (error) {

        console.error(error);

        alert("Could not complete customer.");

    }
}


// ======================================================
// SKIP CUSTOMER
// ======================================================

async function skipCustomer(id) {

    const confirmSkip = confirm(
        "Are you sure you want to skip this customer?"
    );

    if (!confirmSkip) {
        return;
    }


    try {

        const response = await fetch(
            `/api/admin/skip/${id}`,
            {
                method: "POST"
            }
        );

        const data = await response.json();


        if (!data.success) {

            alert(data.message);

            return;
        }


        loadQueue();

    } catch (error) {

        console.error(error);

        alert("Could not skip customer.");

    }
}


// ======================================================
// AUTOMATIC REFRESH
// ======================================================

loadQueue();

setInterval(loadQueue, 5000);