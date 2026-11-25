
const STORAGE_KEY = "expenseflow_trips_v1";

let trips = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
);

let activeTripId = null;

const $ = id => document.getElementById(id);

const tripForm = $("trip-form");
const tripSelect = $("trip-select");
const workspace = $("trip-workspace");
const emptyState = $("empty-state");

function saveTrips() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(trips)
    );
}

function currentTrip() {
    return trips.find(t => t.id === activeTripId);
}

function money(n) {
    return "₹" + Number(n || 0).toFixed(2);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[ch]));
}

// Display trips
function renderTripOptions() {

    tripSelect.innerHTML = "";

    if (!trips.length) {
        tripSelect.innerHTML =
            '<option value="">No trips yet</option>';

        activeTripId = null;
        workspace.hidden = true;
        emptyState.hidden = false;
        return;
    }

    trips.forEach(t => {

        const option = document.createElement("option");

        option.value = t.id;
        option.textContent = t.name;

        tripSelect.appendChild(option);

    });

    if (!trips.some(t => t.id === activeTripId)) {
        activeTripId = trips[0].id;
    }

    tripSelect.value = activeTripId;

    renderTrip();
}

// Display selected trip
function renderTrip() {

    const trip = currentTrip();

    if (!trip) {
        workspace.hidden = true;
        emptyState.hidden = false;
        return;
    }

    workspace.hidden = false;
    emptyState.hidden = true;

    $("trip-meta").textContent =
        "Trip date: " + (trip.date || "Not set");

    $("member-count").textContent =
        trip.members.length;

    $("expense-count").textContent =
        trip.expenses.length;

    const total = trip.expenses.reduce(
        (sum, e) => sum + e.amount,
        0
    );

    $("total-expense").textContent = money(total);

    renderMembers();
    renderMemberSelects();
    renderParticipants();
    renderExpenses();
    renderSettlement();
}

// Add members to screen
function renderMembers() {

    const trip = currentTrip();

    $("member-list").innerHTML = "";

    trip.members.forEach((name, index) => {

        const li = document.createElement("li");

        li.innerHTML = `
            <span>${escapeHTML(name)}</span>

            <button
                class="remove-btn"
                data-remove-member="${index}"
                type="button">
                Remove
            </button>
        `;

        $("member-list").appendChild(li);

    });
}

// Update payer dropdown
function renderMemberSelects() {

    const trip = currentTrip();

    $("paid-by").innerHTML =
        '<option value="">Select payer</option>' +

        trip.members.map(name => `
            <option value="${escapeHTML(name)}">
                ${escapeHTML(name)}
            </option>
        `).join("");
}

// Select members who share an expense
function renderParticipants() {

    const trip = currentTrip();

    const selected = new Set(
        [...document.querySelectorAll(
            ".participant input:checked"
        )].map(x => x.value)
    );

    $("participant-list").innerHTML = "";

    trip.members.forEach(name => {

        const checked =
            selected.size ? selected.has(name) : true;

        const label = document.createElement("label");

        label.className = "participant";

        label.innerHTML = `
            <input
                type="checkbox"
                value="${escapeHTML(name)}"
                ${checked ? "checked" : ""}
            >
            ${escapeHTML(name)}
        `;

        $("participant-list").appendChild(label);

    });

    renderCustomInputs();
}

function getParticipants() {

    return [
        ...document.querySelectorAll(
            "#participant-list input:checked"
        )
    ].map(x => x.value);

}

// Custom split inputs
function renderCustomInputs() {

    const custom =
        $("split-type").value === "custom";

    $("custom-area").hidden = !custom;

    if (!custom) return;

    const participants = getParticipants();

    $("custom-inputs").innerHTML =
        participants.map(name => `
            <label class="custom-row">

                <span>${escapeHTML(name)}</span>

                <input
                    type="number"
                    min="0"
                    step="0.01"
                    data-custom-name="${escapeHTML(name)}"
                    placeholder="Share ₹"
                    required
                >

            </label>
        `).join("");

    updateCustomTotal();
}

function updateCustomTotal() {

    const total = [
        ...document.querySelectorAll("[data-custom-name]")
    ].reduce((sum, input) => {
        return sum + (Number(input.value) || 0);
    }, 0);

    $("custom-total").textContent =
        "Custom total: " + money(total);
}

// Show expense history
function renderExpenses() {

    const trip = currentTrip();

    $("expense-rows").innerHTML = "";

    trip.expenses.forEach(e => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${escapeHTML(e.title)}</td>

            <td>${escapeHTML(e.paidBy)}</td>

            <td>${money(e.amount)}</td>

            <td>${e.shares.length} member(s)</td>

            <td>
                <button
                    class="remove-btn"
                    data-delete-expense="${e.id}"
                    type="button">
                    Delete
                </button>
            </td>
        `;

        $("expense-rows").appendChild(tr);

    });

    if (!trip.expenses.length) {

        $("expense-rows").innerHTML = `
            <tr>
                <td colspan="5">
                    No expenses added yet.
                </td>
            </tr>
        `;

    }
}

// Calculate each member's balance
function calculateBalances(trip) {

    const balances = Object.fromEntries(
        trip.members.map(name => [name, 0])
    );

    trip.expenses.forEach(e => {

        balances[e.paidBy] += e.amount;

        e.shares.forEach(s => {

            balances[s.name] -= s.amount;

        });

    });

    (trip.settlementsPaid || []).forEach(p => {

        balances[p.from] += p.amount;
        balances[p.to] -= p.amount;

    });

    return balances;
}

// Greedy algorithm for settlements
function makeSettlements(balances) {

    const debtors = [];
    const creditors = [];

    Object.entries(balances).forEach(([name, balance]) => {

        if (balance < -0.009) {

            debtors.push({
                name,
                amount: -balance
            });

        } else if (balance > 0.009) {

            creditors.push({
                name,
                amount: balance
            });

        }

    });

    const result = [];

    let i = 0;
    let j = 0;

    while (
        i < debtors.length &&
        j < creditors.length
    ) {

        const amount = Math.min(
            debtors[i].amount,
            creditors[j].amount
        );

        if (amount > 0.009) {

            result.push({
                from: debtors[i].name,
                to: creditors[j].name,
                amount: Number(amount.toFixed(2))
            });

        }

        debtors[i].amount -= amount;
        creditors[j].amount -= amount;

        if (debtors[i].amount < 0.01) i++;

        if (creditors[j].amount < 0.01) j++;

    }

    return result;
}

// Display balances and settlement
function renderSettlement() {

    const trip = currentTrip();

    const balances = calculateBalances(trip);

    $("balance-list").innerHTML = "";

    Object.entries(balances).forEach(([name, balance]) => {

        const div = document.createElement("div");

        div.className = "balance-item";

        const status =
            Math.abs(balance) < 0.01
                ? "Settled"
                : balance > 0
                    ? "Gets back"
                    : "Owes";

        div.innerHTML = `
            <strong>${escapeHTML(name)}</strong>

            <span class="${
                balance >= 0 ? "positive" : "negative"
            }">
                ${status}: ${money(Math.abs(balance))}
            </span>
        `;

        $("balance-list").appendChild(div);

    });

    const settlements = makeSettlements(balances);

    const list = $("settlement-list");

    list.innerHTML = "";

    if (!settlements.length) {

        list.innerHTML =
            "<p>All expenses are settled.</p>";

        return;
    }

    settlements.forEach((s, index) => {

        const div = document.createElement("div");

        div.className = "settlement";

        div.innerHTML = `
            <span>
                <strong>${escapeHTML(s.from)}</strong>
                pays
                <strong>${escapeHTML(s.to)}</strong>

                <br>

                <span class="positive">
                    ${money(s.amount)}
                </span>
            </span>

            <button
                type="button"
                data-paid="${index}">
                Mark as Paid
            </button>
        `;

        list.appendChild(div);

    });

    list.dataset.settlements =
        JSON.stringify(settlements);
}

// CREATE TRIP
tripForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const name = $("trip-name").value.trim();
    const date = $("trip-date").value;

    if (!name) return;

    const trip = {
        id: Date.now().toString(),
        name,
        date,
        members: [],
        expenses: [],
        settlementsPaid: []
    };

    trips.push(trip);

    activeTripId = trip.id;

    saveTrips();

    tripForm.reset();

    renderTripOptions();

});

// Change trip
tripSelect.addEventListener("change", function() {

    activeTripId = tripSelect.value;

    renderTrip();

});

// ADD FRIEND
$("member-form").addEventListener("submit", function(event) {

    event.preventDefault();

    const trip = currentTrip();

    if (!trip) return;

    const name = $("member-name").value.trim();

    if (!name) return;

    if (trip.members.some(
        m => m.toLowerCase() === name.toLowerCase()
    )) {

        alert("This friend is already added.");

        return;
    }

    trip.members.push(name);

    $("member-name").value = "";

    saveTrips();

    renderTrip();

});

// REMOVE FRIEND
$("member-list").addEventListener("click", function(event) {

    const index = event.target.dataset.removeMember;

    if (index === undefined) return;

    const trip = currentTrip();

    const name = trip.members[Number(index)];

    const used = trip.expenses.some(e =>
        e.paidBy === name ||
        e.shares.some(s => s.name === name)
    );

    if (used) {

        alert(
            "This friend is already used in an expense. Delete or update those expenses first."
        );

        return;
    }

    if (!confirm("Remove " + name + "?")) return;

    trip.members.splice(Number(index), 1);

    saveTrips();

    renderTrip();

});

// Update participants and custom shares
$("participant-list").addEventListener(
    "change",
    renderCustomInputs
);

$("split-type").addEventListener(
    "change",
    renderCustomInputs
);

$("custom-inputs").addEventListener(
    "input",
    updateCustomTotal
);

// ADD EXPENSE
$("expense-form").addEventListener("submit", function(event) {

    event.preventDefault();

    const trip = currentTrip();

    if (!trip) return;

    if (trip.members.length < 1) {

        alert("Add at least one friend first.");

        return;
    }

    const title = $("expense-title").value.trim();

    const amount = Number($("expense-amount").value);

    const paidBy = $("paid-by").value;

    const participants = getParticipants();

    const type = $("split-type").value;

    if (
        !title ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !paidBy
    ) {

        alert("Enter valid expense details.");

        return;
    }

    if (!participants.length) {

        alert("Select at least one member.");

        return;
    }

    let shares = [];

    // EQUAL SPLIT
    if (type === "equal") {

        const each = Number(
            (amount / participants.length).toFixed(2)
        );

        let allocated = 0;

        shares = participants.map((name, index) => {

            const share =
                index === participants.length - 1
                    ? Number((amount - allocated).toFixed(2))
                    : each;

            allocated += share;

            return {
                name,
                amount: share
            };

        });

    }

    // CUSTOM SPLIT
    else {

        shares = [
            ...document.querySelectorAll(
                "[data-custom-name]"
            )
        ].map(input => ({
            name: input.dataset.customName,
            amount: Number(input.value)
        }));

        if (
            shares.length !== participants.length ||
            shares.some(
                s =>
                    !Number.isFinite(s.amount) ||
                    s.amount < 0
            )
        ) {

            alert("Enter valid custom shares.");

            return;
        }

        const sum = shares.reduce(
            (total, s) => total + s.amount,
            0
        );

        if (Math.abs(sum - amount) > 0.01) {

            alert(
                "Custom shares total " +
                money(sum) +
                ". They must equal " +
                money(amount)
            );

            return;
        }

    }

    trip.expenses.push({

        id: Date.now().toString(),

        title,
        amount,
        paidBy,
        splitType: type,
        shares,

        date: new Date().toISOString().slice(0, 10)

    });

    trip.settlementsPaid = [];

    saveTrips();

    $("expense-form").reset();

    renderTrip();

});

// DELETE EXPENSE
$("expense-rows").addEventListener("click", function(event) {

    const id = event.target.dataset.deleteExpense;

    if (!id) return;

    const trip = currentTrip();

    if (!confirm("Delete this expense?")) return;

    trip.expenses = trip.expenses.filter(
        e => e.id !== id
    );

    trip.settlementsPaid = [];

    saveTrips();

    renderTrip();

});

// MARK PAYMENT AS PAID
$("settlement-list").addEventListener("click", function(event) {

    const index = event.target.dataset.paid;

    if (index === undefined) return;

    const trip = currentTrip();

    const settlements = JSON.parse(
        $("settlement-list").dataset.settlements || "[]"
    );

    const s = settlements[Number(index)];

    if (!s) return;

    if (!confirm(
        `${s.from} paid ${s.to} ${money(s.amount)}?`
    )) return;

    trip.settlementsPaid.push({

        id: Date.now().toString(),

        from: s.from,
        to: s.to,
        amount: s.amount

    });

    saveTrips();

    renderTrip();

});

// DELETE TRIP
$("delete-trip").addEventListener("click", function() {

    const trip = currentTrip();

    if (!trip) return;

    if (!confirm(
        `Delete trip "${trip.name}" and all its data?`
    )) return;

    trips = trips.filter(t => t.id !== trip.id);

    activeTripId = null;

    saveTrips();

    renderTripOptions();

});

// INITIAL LOAD
renderTripOptions();
