
const USERS_KEY = "expenseflow_users";
const CURRENT_USER_KEY = "expenseflow_current_user";

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

// SIGNUP
const signupForm = document.getElementById("signup-form");

if (signupForm) {
    signupForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const name = document.getElementById("signup-name").value.trim();
        const email = document.getElementById("signup-email").value.trim().toLowerCase();
        const password = document.getElementById("signup-password").value;
        const confirm = document.getElementById("signup-confirm").value;
        const message = document.getElementById("signup-message");

        message.className = "message";

        if (password !== confirm) {
            message.textContent = "Passwords do not match!";
            return;
        }

        const users = getUsers();

        if (users.some(user => user.email === email)) {
            message.textContent = "This email is already registered!";
            return;
        }

        users.push({ name, email, password });

        localStorage.setItem(USERS_KEY, JSON.stringify(users));

        message.textContent = "Account created successfully!";
        message.className = "message success";

        signupForm.reset();

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1000);
    });
}

// LOGIN
const loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const email = document.getElementById("login-email").value.trim().toLowerCase();
        const password = document.getElementById("login-password").value;
        const message = document.getElementById("login-message");

        message.className = "message";

        const users = getUsers();

        const user = users.find(
            item => item.email === email && item.password === password
        );

        if (!user) {
            message.textContent = "Invalid email or password!";
            return;
        }

        localStorage.setItem(
            CURRENT_USER_KEY,
            JSON.stringify({
                name: user.name,
                email: user.email
            })
        );

        window.location.href = "home.html";
    });
}
