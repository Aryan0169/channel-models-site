document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("/user");
  const data = await res.json();

  // Store current username globally
  window.currentUsername = data.username;

  // Show welcome message
  document.getElementById("welcome-message").textContent = `Welcome, ${data.username}`;

  // Show admin section if superuser
  if (data.isSuperuser) {
    document.getElementById("admin-section").style.display = "block";
  }
});

// Toggle Admin Panel
function toggleAdminPanel() {
  const panel = document.getElementById("adminPanel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
}

// Add User functionality (unchanged)
document.getElementById("addUserForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const username = document.getElementById("newUsername").value;
  const isSuperuser = document.getElementById("isSuperuser").checked;

  try {
    const res = await fetch("/admin/users/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, isSuperuser })
    });

    const text = await res.text();
    alert(text);
    if (res.ok) this.reset();
  } catch (err) {
    console.error("Error adding user:", err);
    alert("Something went wrong.");
  }
});


// ✅ Updated logic to fetch and display users (with self checkbox disabled)
async function loadUserTable() {
  const userTableBody = document.querySelector("#userTable tbody");
  const messageEl = document.getElementById("manageUserMessage");

  try {
    const res = await fetch("/admin/users");
    if (!res.ok) throw new Error("Failed to fetch users");
    const users = await res.json();

    userTableBody.innerHTML = "";

    users.forEach(user => {
      const isSelf = user.username === window.currentUsername;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <input type="checkbox" class="user-checkbox" value="${user.username}" ${isSelf ? "disabled" : ""}>
        </td>
        <td>${user.username}</td>
        <td>${user.role}</td>
      `;
      userTableBody.appendChild(row);
    });

    messageEl.textContent = "";
  } catch (err) {
    console.error("Error loading users:", err);
    messageEl.style.color = "red";
    messageEl.textContent = "Failed to load users.";
  }
}


// Toggle Manage Users Panel
document.getElementById("manageUsersBtn").addEventListener("click", async () => {
  const panel = document.getElementById("manageUsersPanel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";

  if (panel.style.display === "block") {
    await loadUserTable(); // ✅ Load users only if opening
  }
});


// ✅ Delete selected users, then refresh table without closing panel
document.getElementById("deleteUsersBtn").addEventListener("click", async () => {
  const checkboxes = document.querySelectorAll(".user-checkbox:checked");
  const usernames = Array.from(checkboxes).map(cb => cb.value);
  const messageEl = document.getElementById("manageUserMessage");

  if (usernames.length === 0) {
    alert("Please select at least one user to delete.");
    return;
  }

  const confirmed = confirm(`Are you sure you want to delete ${usernames.length} user(s)?`);
  if (!confirmed) return;

  let successCount = 0;
  let failureCount = 0;

  for (const username of usernames) {
    try {
      const res = await fetch("/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });

      if (res.ok) {
        successCount++;
      } else {
        failureCount++;
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      failureCount++;
    }
  }

  messageEl.style.color = "black";
  messageEl.textContent = `${successCount} user(s) deleted. ${failureCount > 0 ? failureCount + " failed." : ""}`;

  await loadUserTable(); // ✅ Just refresh the list, don't toggle panel
});
