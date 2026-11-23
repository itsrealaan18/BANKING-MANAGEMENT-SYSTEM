
const $ = id => document.getElementById(id);

let accounts = JSON.parse(localStorage.getItem("novaAccounts") || "[]");
let transactions = JSON.parse(localStorage.getItem("novaTransactions") || "[]");

let currentOperation = "deposit";

function saveData() {
    localStorage.setItem("novaAccounts", JSON.stringify(accounts));
    localStorage.setItem("novaTransactions", JSON.stringify(transactions));
}

function money(value) {
    return "₹" + Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => toast.classList.remove("show"), 2500);
}

function addTransaction(acc, type, amount, related = "") {
    transactions.unshift({
        id: "TXN" + Date.now(),
        account: acc,
        type: type,
        amount: Number(amount),
        date: new Date().toLocaleString("en-IN"),
        related: related,
        status: "Successful"
    });
}

function renderDashboard() {
    $("totalAccounts").textContent = accounts.length;

    const total = accounts.reduce((sum, a) => sum + a.balance, 0);

    const deposits = transactions
        .filter(t => t.type === "Deposit")
        .reduce((sum, t) => sum + t.amount, 0);

    const withdrawals = transactions
        .filter(t => t.type === "Withdraw")
        .reduce((sum, t) => sum + t.amount, 0);

    $("totalBalance").textContent = money(total);
    $("totalDeposits").textContent = money(deposits);
    $("totalWithdrawals").textContent = money(withdrawals);

    renderAccounts();
    renderTransactions();
}

function renderAccounts() {
    const tbody = $("accountTable");
    const query = $("accountSearch").value.toLowerCase();

    tbody.innerHTML = "";

    const filtered = accounts.filter(a =>
        a.name.toLowerCase().includes(query) ||
        String(a.accNo).includes(query)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6">No accounts found.</td></tr>`;
        return;
    }

    filtered.forEach(a => {
        tbody.innerHTML += `
            <tr>
                <td>#${a.accNo}</td>
                <td><strong>${escapeHTML(a.name)}</strong></td>
                <td>${escapeHTML(a.phone)}</td>
                <td>${escapeHTML(a.type)}</td>
                <td><strong>${money(a.balance)}</strong></td>
                <td>
                    <button class="delete-btn"
                    onclick="deleteAccount(${a.accNo})">
                    Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

function renderTransactions() {
    const tbody = $("transactionTable");
    const filter = $("transactionFilter").value;

    tbody.innerHTML = "";

    const filtered = transactions.filter(t =>
        filter === "all" || t.type === filter
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6">No transactions found.</td></tr>`;
        return;
    }

    filtered.forEach(t => {
        tbody.innerHTML += `
            <tr>
                <td>${escapeHTML(t.id)}</td>
                <td>${escapeHTML(String(t.account))}</td>
                <td>${escapeHTML(t.type)}</td>
                <td class="${t.type === "Deposit" ||
                             t.type === "Transfer In"
                             ? "amount-positive" : "amount-negative"}">
                    ${money(t.amount)}
                </td>
                <td>${escapeHTML(t.date)}</td>
                <td><span class="status">${escapeHTML(t.status)}</span></td>
            </tr>
        `;
    });
}

// Prevent customer data from being interpreted as HTML
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// CREATE ACCOUNT

function showModal() {
    $("accountModal").classList.add("show");
}

function closeModal() {
    $("accountModal").classList.remove("show");
}

$("accountForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const accNo = Number($("accNo").value);
    const name = $("name").value.trim();
    const phone = $("phone").value.trim();
    const type = $("type").value;
    const balance = Number($("balance").value);

    if (!Number.isSafeInteger(accNo) || accNo <= 0) {
        showToast("Enter a valid account number.");
        return;
    }

    if (accounts.some(a => a.accNo === accNo)) {
        showToast("Account number already exists!");
        return;
    }

    if (!name || !phone || !/^\d{10}$/.test(phone) ||
        !Number.isFinite(balance) || balance < 0) {
        showToast("Please enter valid customer details.");
        return;
    }

    accounts.push({
        accNo, name, phone, type, balance
    });

    addTransaction(accNo, "Account Opened", balance);

    saveData();
    renderDashboard();
    closeModal();

    this.reset();
    showToast("Account created successfully!");
});

// MONEY OPERATIONS

function showMoneyModal(operation) {
    currentOperation = operation;

    const titles = {
        deposit: "Deposit Money",
        withdraw: "Withdraw Money",
        transfer: "Transfer Money"
    };

    $("moneyTitle").textContent = titles[operation];
    $("receiverField").hidden = operation !== "transfer";
    $("receiverAcc").required = operation === "transfer";

    $("moneyForm").reset();
    $("moneyModal").classList.add("show");
}

function closeMoneyModal() {
    $("moneyModal").classList.remove("show");
}

$("moneyForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const accNo = Number($("moneyAcc").value);
    const amount = Number($("moneyAmount").value);

    const account = accounts.find(a => a.accNo === accNo);

    if (!account) {
        showToast("Account not found!");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        showToast("Enter a valid amount!");
        return;
    }

    if (currentOperation === "deposit") {
        account.balance += amount;
        addTransaction(accNo, "Deposit", amount);
    }

    else if (currentOperation === "withdraw") {
        if (account.balance < amount) {
            showToast("Insufficient balance!");
            return;
        }

        account.balance -= amount;
        addTransaction(accNo, "Withdraw", amount);
    }

    else if (currentOperation === "transfer") {
        const receiverNo = Number($("receiverAcc").value);
        const receiver = accounts.find(a => a.accNo === receiverNo);

        if (!receiver || receiverNo === accNo) {
            showToast("Invalid receiver account!");
            return;
        }

        if (account.balance < amount) {
            showToast("Insufficient balance!");
            return;
        }

        // Validate both accounts before changing either balance.
        account.balance -= amount;
        receiver.balance += amount;

        addTransaction(accNo, "Transfer", amount, receiverNo);
        addTransaction(receiverNo, "Transfer In", amount, accNo);
    }

    saveData();
    renderDashboard();
    closeMoneyModal();

    showToast("Transaction completed successfully!");
});

// DELETE ACCOUNT

function deleteAccount(accNo) {
    const account = accounts.find(a => a.accNo === accNo);

    if (!account) return;

    if (account.balance !== 0) {
        showToast("Account must have zero balance before closure.");
        return;
    }

    if (!confirm("Are you sure you want to close this account?")) {
        return;
    }

    accounts = accounts.filter(a => a.accNo !== accNo);

    saveData();
    renderDashboard();

    showToast("Account closed successfully!");
}

// LOGOUT DEMO

function logout() {
    if (confirm("Do you want to leave the dashboard?")) {
        showToast("Demo session ended.");
    }
}

// INITIAL SAMPLE DATA

if (accounts.length === 0) {
    accounts = [
        {
            accNo: 1001,
            name: "Rahul Patel",
            phone: "9876543210",
            type: "Savings",
            balance: 25000
        },
        {
            accNo: 1002,
            name: "Priya Shah",
            phone: "9876543211",
            type: "Current",
            balance: 45000
        },
        {
            accNo: 1003,
            name: "Amit Kumar",
            phone: "9876543212",
            type: "Savings",
            balance: 15000
        }
    ];

    transactions = [
        {
            id: "TXN10001",
            account: 1001,
            type: "Deposit",
            amount: 5000,
            date: new Date().toLocaleString("en-IN"),
            status: "Successful"
        }
    ];

    saveData();
}

renderDashboard();
