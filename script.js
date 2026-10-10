// ======================================================
// JOIN QUEUE
// ======================================================

async function joinQueue() {

    const customerName =
        document.getElementById("customerName").value.trim();

    const serviceType =
        document.getElementById("serviceType").value;


    if (customerName === "") {

        alert("Please enter your name.");

        return;
    }


    try {

        const response = await fetch("/api/queue", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                customer_name: customerName,

                service_type: serviceType

            })

        });


        const data = await response.json();


        if (!data.success) {

            alert(data.message);

            return;
        }


        // Save token in browser

        localStorage.setItem(
            "queueToken",
            data.token_number
        );


        // Display token

        document.getElementById("newToken").textContent =
            "A-" +
            String(data.token_number).padStart(3, "0");


        // Display customer name

        const tokenResult =
            document.getElementById("tokenResult");

        const message =
            tokenResult.querySelector("p:last-child");

        message.textContent =
            "Hello " +
            data.customer_name +
            "! Please wait for your turn.";


        tokenResult.classList.remove("hidden");


        // Clear name

        document.getElementById(
            "customerName"
        ).value = "";


        // Update status immediately

        updateMyTokenStatus();


        // Scroll to token

        tokenResult.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


    } catch (error) {

        console.error(error);

        alert("Could not connect to the server.");

    }

}


// ======================================================
// LIVE QUEUE STATUS
// ======================================================

async function updateQueueStatus() {

    try {

        const response =
            await fetch("/api/queue/status");

        const data =
            await response.json();


        if (!data.success) {
            return;
        }


        // Waiting count

        document.getElementById(
            "waitingCount"
        ).textContent = data.waiting;


        document.getElementById(
            "statusWaiting"
        ).textContent = data.waiting;


        // Currently serving

        if (data.serving) {

            const token =
                "A-" +
                String(data.serving.token_number)
                    .padStart(3, "0");


            document.getElementById(
                "currentToken"
            ).textContent = token;


            document.getElementById(
                "statusServing"
            ).textContent = token;


        } else {

            document.getElementById(
                "currentToken"
            ).textContent = "—";


            document.getElementById(
                "statusServing"
            ).textContent = "—";

        }


    } catch (error) {

        console.error(
            "Queue status error:",
            error
        );

    }

}


// ======================================================
// CUSTOMER'S OWN TOKEN STATUS
// ======================================================

async function updateMyTokenStatus() {

    const token =
        localStorage.getItem("queueToken");


    if (!token) {
        return;
    }


    try {

        const response =
            await fetch("/api/queue/" + token);


        if (!response.ok) {
            return;
        }


        const data =
            await response.json();


        if (!data.success) {
            return;
        }


        const customer =
            data.customer;


        const tokenResult =
            document.getElementById("tokenResult");


        const message =
            tokenResult.querySelector("p:last-child");


        tokenResult.classList.remove("hidden");


        if (customer.status === "waiting") {

            message.textContent =
                "Hello " +
                customer.customer_name +
                "! Your token is waiting. Please stay nearby.";

        }


        else if (customer.status === "serving") {

            message.textContent =
                "🔔 Your turn! Please proceed to the service counter.";

        }


        else if (customer.status === "completed") {

            message.textContent =
                "✅ Your service has been completed. Thank you!";

        }


        else if (customer.status === "skipped") {

            message.textContent =
                "Your token was skipped. Please contact the service desk.";

        }

    } catch (error) {

        console.error(
            "Token status error:",
            error
        );

    }

}


// ======================================================
// INITIAL LOAD
// ======================================================

updateQueueStatus();

updateMyTokenStatus();


// ======================================================
// AUTOMATIC LIVE UPDATE
// ======================================================

setInterval(
    updateQueueStatus,
    3000
);

setInterval(
    updateMyTokenStatus,
    3000
);