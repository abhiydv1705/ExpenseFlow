
// Get HTML elements
const form = document.getElementById("transaction-form");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");

const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("income");
const expenseElement = document.getElementById("expense");
const transactionList = document.getElementById("transaction-list");

// Store transactions
let transactions = JSON.parse(
    localStorage.getItem("transactions")
) || [];

// Add new transaction
form.addEventListener("submit", function(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;

    if (title === "" || !Number.isFinite(amount) || amount <= 0) {
        alert("Please enter valid details!");
        return;
    }

    
const transaction = {
    id: Date.now(),
    title: title,
    amount: amount,
    type: type,
    category: category,
    date: new Date().toISOString().slice(0, 10),
    month: new Date().toISOString().slice(0, 7)
};


    transactions.push(transaction);

    saveTransactions();
    displayTransactions();
    updateSummary();

    form.reset();
});

// Save data in browser
function saveTransactions() {
    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );
}

// Display transactions

function displayTransactions() {
    transactionList.innerHTML = "";

    transactions.forEach(function(t) {
        const li = document.createElement("li");
        const date = t.date || "Date unavailable";

        li.innerHTML = `
            <strong>${t.title}</strong>
            (${t.category})
            <br>
            <small>Date: ${date}</small>
            <span style="float:right;">
                ${t.type === "income" ? "+" : "-"}₹${t.amount.toFixed(2)}
                <button type="button" onclick="editTransaction(${t.id})">Edit</button>
                <button type="button" onclick="deleteTransaction(${t.id})">Delete</button>
            </span>
        `;

        transactionList.appendChild(li);
    });
}


// Calculate balance, income and expenses
function updateSummary() {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(function(transaction) {
        if (transaction.type === "income") {
            totalIncome += transaction.amount;
        } else {
            totalExpense += transaction.amount;
        }
    });

    const balance = totalIncome - totalExpense;

    balanceElement.textContent = "₹" + balance.toFixed(2);
    incomeElement.textContent = "₹" + totalIncome.toFixed(2);
    expenseElement.textContent = "₹" + totalExpense.toFixed(2);
    showCategorySummary();
    showMonthlySummary();
    showHighestExpense();

}

// Delete a transaction
function deleteTransaction(id) {
    transactions = transactions.filter(function(transaction) {
        return transaction.id !== id;
    });

    saveTransactions();
    displayTransactions();
    updateSummary();
}

// Load saved data when website opens
displayTransactions();
updateSummary();


const searchInput = document.getElementById("search");

// Search transactions using Linear Search
searchInput.addEventListener("input", function() {
    const searchValue = searchInput.value.toLowerCase();

    transactionList.innerHTML = "";

    for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];

        if (transaction.title.toLowerCase().includes(searchValue)) {
            const li = document.createElement("li");

            const sign = transaction.type === "income" ? "+" : "-";

            li.innerHTML = `
                <strong>${transaction.title}</strong>
                (${transaction.category})
                <span style="float:right;">
                    ${sign}₹${transaction.amount.toFixed(2)}
                    <button type="button"
                        onclick="deleteTransaction(${transaction.id})">
                        Delete
                    </button>
                </span>
            `;

            transactionList.appendChild(li);
        }
    }
});


const sortSelect = document.getElementById("sort");

sortSelect.addEventListener("change", function() {
    const choice = sortSelect.value;

    // Bubble Sort Algorithm
    for (let i = 0; i < transactions.length - 1; i++) {

        for (let j = 0; j < transactions.length - i - 1; j++) {

            let shouldSwap = false;

            if (choice === "high" &&
                transactions[j].amount < transactions[j + 1].amount) {
                shouldSwap = true;
            }

            if (choice === "low" &&
                transactions[j].amount > transactions[j + 1].amount) {
                shouldSwap = true;
            }

            if (shouldSwap) {
                let temp = transactions[j];
                transactions[j] = transactions[j + 1];
                transactions[j + 1] = temp;
            }
        }
    }

    saveTransactions();
    displayTransactions();
});


const categoryFilter = document.getElementById("category-filter");
const typeFilter = document.getElementById("type-filter");


function applyFilters() {
    const searchValue = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    const selectedType = typeFilter.value;

    transactionList.innerHTML = "";

    for (let i = 0; i < transactions.length; i++) {
        const t = transactions[i];

        const matchesSearch =
            t.title.toLowerCase().includes(searchValue);

        const matchesCategory =
            selectedCategory === "all" ||
            t.category === selectedCategory;
            const matchesType =
    selectedType === "all" ||
    t.type === selectedType;

        if (matchesSearch && matchesCategory && matchesType) {
            const li = document.createElement("li");

            li.innerHTML = `
                <strong>${t.title}</strong>
                (${t.category})
                <br>
                <small>Date: ${t.date || "Date unavailable"}</small>
                <span style="float:right;">
                    ${t.type === "income" ? "+" : "-"}₹${t.amount.toFixed(2)}
                    <button type="button" onclick="editTransaction(${t.id})">Edit</button>
                    <button type="button" onclick="deleteTransaction(${t.id})">Delete</button>
                </span>
            `;

            transactionList.appendChild(li);
        }
    }
}


searchInput.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);
typeFilter.addEventListener("change", applyFilters);

function showCategorySummary() {
    const categoryTotals = {};

    // Hash Map
    transactions.forEach(function(t) {
        if (t.type === "expense") {
            if (!categoryTotals[t.category]) {
                categoryTotals[t.category] = 0;
            }

            categoryTotals[t.category] += t.amount;
        }
    });

    const summary = document.getElementById("category-summary");
    summary.innerHTML = "";

    for (const category in categoryTotals) {
        const li = document.createElement("li");

        li.textContent =
            category + ": ₹" + categoryTotals[category].toFixed(2);

        summary.appendChild(li);
    }

    if (Object.keys(categoryTotals).length === 0) {
        summary.innerHTML = "<li>No expenses yet</li>";
    }
}

showCategorySummary();

function showHighestExpense() {
    const highestElement =
        document.getElementById("highest-expense");

    const expenses = transactions.filter(function(t) {
        return t.type === "expense";
    });

    if (expenses.length === 0) {
        highestElement.textContent = "No expenses yet";
        return;
    }

    let highest = expenses[0];

    for (let i = 1; i < expenses.length; i++) {
        if (expenses[i].amount > highest.amount) {
            highest = expenses[i];
        }
    }

    highestElement.textContent =
        highest.title + " - ₹" + highest.amount.toFixed(2);
}

showHighestExpense();

function showMonthlySummary() {
    const monthlyTotals = {};

    transactions.forEach(function(t) {
        if (!t.month) {
            t.month = new Date().toISOString().slice(0, 7);
        }

        if (t.type === "expense") {
            monthlyTotals[t.month] =
                (monthlyTotals[t.month] || 0) + t.amount;
        }
    });

    const summary = document.getElementById("monthly-summary");

    if (!summary) return;

    summary.innerHTML = "";

    for (const month in monthlyTotals) {
        const li = document.createElement("li");

        const date = new Date(month + "-01T00:00:00");

const monthName = date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
});

li.textContent =
    monthName + ": ₹" + monthlyTotals[month].toFixed(2);

        summary.appendChild(li);
    }

    if (Object.keys(monthlyTotals).length === 0) {
        summary.innerHTML = "<li>No monthly expenses yet</li>";
    }

    saveTransactions();
}

function editTransaction(id) {
    const t = transactions.find(function(item) {
        return item.id === id;
    });

    if (!t) return;

    const newTitle = prompt("Enter new transaction name:", t.title);
    if (newTitle === null || newTitle.trim() === "") return;

    const newAmount = prompt("Enter new amount:", t.amount);
    if (newAmount === null) return;

    const amount = Number(newAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid amount");
        return;
    }

    t.title = newTitle.trim();
    t.amount = amount;

    saveTransactions();
    displayTransactions();
    updateSummary();
    showHighestExpense();
}

function exportCSV() {
    if (transactions.length === 0) {
        alert("No transactions to export!");
        return;
    }

    let csv = "Title,Amount,Type,Category,Date\n";

    transactions.forEach(function(t) {
        const row = [
            t.title,
            t.amount,
            t.type,
            t.category,
            t.date || "Date unavailable"
        ];

        csv += row.map(function(value) {
            return '"' + String(value).replace(/"/g, '""') + '"';
        }).join(",") + "\n";
    });

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Expense_Report.csv";
    link.click();

    URL.revokeObjectURL(url);
}


// =====================================
// MONTHLY BUDGET PLANNER
// =====================================

// Separate storage for monthly budgets
const budgetStorageKey = "expenseflow_budgets_v1";

let monthlyBudgets = JSON.parse(
    localStorage.getItem(budgetStorageKey) || "{}"
);

// Get HTML elements
const budgetMonthInput = document.getElementById("budget-month");
const budgetAmountInput = document.getElementById("budget-amount");
const saveBudgetButton = document.getElementById("save-budget-btn");

const budgetTotal = document.getElementById("budget-total");
const budgetSpent = document.getElementById("budget-spent");
const budgetRemaining = document.getElementById("budget-remaining");

const budgetPercentage = document.getElementById("budget-percentage");
const budgetProgressBar = document.getElementById("budget-progress-bar");
const budgetStatus = document.getElementById("budget-status");
const budgetMessage = document.getElementById("budget-message");


// Get current month in YYYY-MM format
function getCurrentBudgetMonth() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
}


// Set current month by default
budgetMonthInput.value = getCurrentBudgetMonth();


// Calculate expenses for selected month
function getMonthlyExpenses(selectedMonth) {

    return transactions
        .filter(transaction =>
            transaction.type === "expense" &&
            (transaction.month || transaction.date.slice(0, 7)) === selectedMonth
        )
        .reduce((total, transaction) => {
            return total + Number(transaction.amount);
        }, 0);

}


// Display budget information
function updateBudgetDisplay() {

    const selectedMonth = budgetMonthInput.value;

    if (!selectedMonth) return;

    const budget = Number(monthlyBudgets[selectedMonth] || 0);

    const spent = getMonthlyExpenses(selectedMonth);

    const remaining = budget - spent;

    const percentage = budget > 0
        ? (spent / budget) * 100
        : 0;


    budgetTotal.textContent = `₹${budget.toFixed(2)}`;

    budgetSpent.textContent = `₹${spent.toFixed(2)}`;

    budgetRemaining.textContent = `₹${remaining.toFixed(2)}`;

    budgetPercentage.textContent = `${percentage.toFixed(1)}%`;

    budgetProgressBar.style.width = `${Math.min(percentage, 100)}%`;


    // Budget status
    if (budget === 0) {

        budgetStatus.textContent = "Set a budget to start tracking.";

        budgetProgressBar.style.background = "#22c55e";

    }
    else if (percentage > 100) {

        budgetStatus.textContent =
            `Budget exceeded by ₹${Math.abs(remaining).toFixed(2)}!`;

        budgetProgressBar.style.background = "#ef4444";

    }
    else if (percentage >= 80) {

        budgetStatus.textContent =
            "Warning! You are approaching your budget limit.";

        budgetProgressBar.style.background = "#f59e0b";

    }
    else {

        budgetStatus.textContent =
            "Great! You are within your monthly budget.";

        budgetProgressBar.style.background = "#22c55e";

    }

}


// Load saved budget when month changes
function loadSelectedBudget() {

    const selectedMonth = budgetMonthInput.value;

    budgetAmountInput.value =
        monthlyBudgets[selectedMonth] || "";

    budgetMessage.textContent = "";

    updateBudgetDisplay();

}


// Save budget button
saveBudgetButton.addEventListener("click", function () {

    const selectedMonth = budgetMonthInput.value;

    const amount = Number(budgetAmountInput.value);

    if (!selectedMonth) {

        budgetMessage.textContent = "Please select a month.";

        return;

    }

    if (!Number.isFinite(amount) || amount <= 0) {

        budgetMessage.textContent =
            "Please enter a budget greater than zero.";

        return;

    }


    monthlyBudgets[selectedMonth] = amount;

    localStorage.setItem(
        budgetStorageKey,
        JSON.stringify(monthlyBudgets)
    );

    budgetMessage.textContent = "Budget saved successfully!";

    updateBudgetDisplay();

});


// Update when selected month changes
budgetMonthInput.addEventListener("change", loadSelectedBudget);


// Connect budget display with existing transaction updates
const originalUpdateSummary = updateSummary;

updateSummary = function () {

    originalUpdateSummary();

    updateBudgetDisplay();

};


// Initial display
loadSelectedBudget();



