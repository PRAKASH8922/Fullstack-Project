
const API = "http://localhost:8001/user";
let selectedId = null;

document.addEventListener("DOMContentLoaded", () => {
  const userTable = document.getElementById("userTable");
  if (userTable) {
    const isLoggedIn = sessionStorage.getItem("userLoggedIn");
    if (isLoggedIn !== "true") {
      alert("Please login first");
      window.location.href = "login.html";
    } else {
      loadUsers();
    }
  }
});

function logout() {
  sessionStorage.removeItem("userLoggedIn");
  alert("Logged out successfully");
  window.location.href = "login.html";
}

function isValidPassword(password) {
  const pattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return pattern.test(password);
}

function setupTogglePassword(toggleId, inputId) {
  const toggle = document.getElementById(toggleId);
  const input = document.getElementById(inputId);
  if (toggle && input) {
    toggle.addEventListener("click", () => {
      input.type = input.type === "password" ? "text" : "password";
      toggle.classList.toggle("bx-eye-closed");
      toggle.classList.toggle("bx-eye");
    });
  }
}
setupTogglePassword("togglePassword", "loginPassword");
setupTogglePassword("toggleSignupPassword", "signupPassword");

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!isValidPassword(password)) {
      document.getElementById("message").innerText =
        "Password must have 8+ chars, 1 capital, 1 number, 1 special.";
      return;
    }

    fetch(API + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(user => {
        if (user.length > 0) {
          sessionStorage.setItem("userLoggedIn", "true");
          alert("Login successful!");
          window.location.href = "index.html";
        } else {
          document.getElementById("message").innerText = "Account not found. Please sign up before logging in.";
        }
      })
      .catch(err => console.error("Login Error:", err));
  });
}

const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", e => {
    e.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const phone = document.getElementById("signupPhone").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    const messageBox = document.getElementById("signupMessage");

    if (!name || !email || !phone || !password || !confirmPassword) {
      messageBox.innerText = "All fields are required.";
      return;
    }

    if (password !== confirmPassword) {
      messageBox.innerText = "Passwords do not match.";
      return;
    }

    if (!isValidPassword(password)) {
      messageBox.innerText = "Password must have 8+ chars, 1 capital, 1 number, 1 special.";
      return;
    }

    if (phone.length !== 10 || isNaN(phone)) {
      messageBox.innerText = "Phone number must be exactly 10 digits.";
      return;
    }

    const newUser = { name, email, phone, password };

    fetch(API)
      .then(res => res.json())
      .then(users => {
        if (users.some(u => u.email === email)) {
          messageBox.innerText = "Email already registered.";
        } else {
          return fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser)
          });
        }
      })
      .then(response => {
        if (response && response.status === 201) {
          alert("Signup successful! Please login.");
          window.location.href = "login.html";
        }
      })
      .catch(err => {
        console.error("Signup Error:", err);
        messageBox.innerText = "Signup failed.";
      });
  });
}

function loadUsers() {
  fetch(API)
    .then(res => res.json())
    .then(users => {
      const table = document.getElementById("userTable");
      const rows = table.querySelectorAll("tr:not(:first-child)");
      rows.forEach(row => row.remove());

      users.forEach((user, index) => {
        const row = table.insertRow();
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${user.name}</td>
          <td>${user.phone}</td>
          <td>${user.email}</td>
          <td><button onclick="editUser(${user.id})" class="btn_edit"><i class='bx bx-edit'></i></button></td>
          <td><button onclick="deleteUser(${user.id})" class="btn_delete"><i class='bx bx-trash'></i></button></td>
        `;
      });
    });
}

const form = document.querySelector(".frm");
if (form) {
  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!name || !phone || !email || !password) {
      alert("Please fill all fields.");
      return;
    }

    if (phone.length !== 10 || isNaN(phone)) {
      alert("Phone must be 10 digits.");
      return;
    }

    const user = { name, phone, email, password };
    const method = selectedId ? "PUT" : "POST";
    const url = selectedId ? `${API}/${selectedId}` : API;

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    }).then(() => {
      form.reset();
      selectedId = null;
      document.getElementById("formTitle").textContent = "Welcome to dashboard";
      document.getElementById("btn").textContent = "Save";
      document.getElementById("userTable").style.display = "table";
      loadUsers();
    });
  });
}

function editUser(id) {
  fetch(API)
    .then(res => res.json())
    .then(users => {
      const user = users.find(u => u.id === id);
      if (user) {
        document.getElementById("name").value = user.name;
        document.getElementById("phone").value = user.phone;
        document.getElementById("email").value = user.email;
        document.getElementById("password").value = user.password;
        selectedId = user.id;
        document.getElementById("formTitle").textContent = "Edit User";
        document.getElementById("btn").textContent = "Update";
        document.getElementById("userTable").style.display = "none";
      }
    });
}

function deleteUser(id) {
  if (confirm("Are you sure you want to delete this user?")) {
    fetch(`${API}/${id}`, { method: "DELETE" }).then(() => loadUsers());
  }
}

const socket = io("http://localhost:8000");

socket.on("message", (data) => {
  console.log("Message received:", data);
});

socket.emit("message", { text: "Hello from frontend!" });
