const API = "/api";
const tokenKey = "campus-desk-session";
const authForm = document.querySelector("#authForm");
const studentForm = document.querySelector("#studentForm");
const authNotice = document.querySelector("#authNotice");
const authView = document.querySelector("#authView");
const appView = document.querySelector("#appView");
const studentRows = document.querySelector("#studentRows");
const emptyState = document.querySelector("#emptyState");
const fields = ["physics", "chemistry", "english"];
let authMode = "login";
let token = sessionStorage.getItem(tokenKey);
let user = null;
let students = [];
let editingId = null;
let toastTimer;

function setAuthNotice(message = "") {
  authNotice.textContent = message;
}

function setAuthMode(mode) {
  authMode = mode;
  const registering = mode === "register";
  document.querySelector("#nameField").classList.toggle("hidden", !registering);
  document.querySelector("#name").required = registering;
  document.querySelector("#password").autocomplete = registering ? "new-password" : "current-password";
  document.querySelector("#authTitle").textContent = registering ? "Create your account" : "Welcome back";
  document.querySelector("#authSubtitle").textContent = registering
    ? "Create a private workspace for your class results."
    : "Sign in to manage your student results.";
  document.querySelector("#authSubmit").textContent = registering ? "Create account" : "Sign in";
  document.querySelector("#authSwitchText").textContent = registering ? "Already have an account?" : "New to Campus Desk?";
  document.querySelector("#authSwitch").textContent = registering ? "Sign in" : "Create an account";
  setAuthNotice();
}

function showApp() {
  authView.classList.add("hidden");
  appView.classList.remove("hidden");
  document.querySelector("#userName").textContent = user.name;
  document.querySelector("#userEmail").textContent = user.email;
  document.querySelector("#userAvatar").textContent = (user.name.trim()[0] || "S").toUpperCase();
  document.querySelector("#welcomeTitle").textContent = `${user.name.split(/\s+/)[0]}'s class, at a glance.`;
}

function signOut(message = "") {
  token = null;
  user = null;
  students = [];
  sessionStorage.removeItem(tokenKey);
  authView.classList.remove("hidden");
  appView.classList.add("hidden");
  studentForm.reset();
  cancelEdit();
  setAuthMode("login");
  setAuthNotice(message);
}

async function apiRequest(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token && !path.startsWith("/auth/")) {
      signOut("Your session expired. Sign in again.");
    }
    throw new Error(data.message || "The request could not be completed.");
  }
  return data;
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function appendCell(row, content, className = "") {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  if (content instanceof Node) cell.append(content);
  else cell.textContent = content;
  row.append(cell);
  return cell;
}

function renderStats() {
  const totalMarks = students.reduce((sum, student) => sum + student.total, 0);
  const average = students.length ? totalMarks / students.length / 3 : 0;
  const topper = students[0];
  document.querySelector("#studentCount").textContent = students.length;
  document.querySelector("#classAverage").textContent = `${average.toFixed(1)}%`;
  document.querySelector("#topperName").textContent = topper?.name || "—";
  document.querySelector("#topperScore").textContent = topper ? `${topper.total} / 300 marks` : "No results yet";
  document.querySelector("#recordCount").textContent = `${students.length} ${students.length === 1 ? "record" : "records"}`;
}

function renderStudents() {
  const query = document.querySelector("#searchInput").value.trim().toLocaleLowerCase();
  const filtered = students.filter(student => student.name.toLocaleLowerCase().includes(query));
  studentRows.replaceChildren();

  filtered.forEach(student => {
    const rankIndex = students.indexOf(student);
    const row = document.createElement("tr");
    const rank = document.createElement("span");
    rank.className = `rank${rankIndex === 0 ? " first" : ""}`;
    rank.textContent = `#${rankIndex + 1}`;
    appendCell(row, rank);

    const nameCell = appendCell(row, "");
    const name = document.createElement("strong");
    name.textContent = student.name;
    nameCell.append(name);
    appendCell(row, `${student.physics} / 100`);
    appendCell(row, `${student.chemistry} / 100`);
    appendCell(row, `${student.english} / 100`);
    appendCell(row, `${student.total} / 300`, "score");

    const averageCell = appendCell(row, "");
    const track = document.createElement("span");
    track.className = "average-track";
    const fill = document.createElement("span");
    fill.style.width = `${student.average}%`;
    track.append(fill);
    averageCell.append(track, document.createTextNode(`${Number(student.average).toFixed(1)}%`));

    const actionsCell = appendCell(row, "");
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.dataset.action = "edit";
    edit.dataset.id = student._id;
    edit.textContent = "Edit";
    edit.setAttribute("aria-label", `Edit ${student.name}`);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete";
    remove.dataset.action = "delete";
    remove.dataset.id = student._id;
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", `Delete ${student.name}`);
    actions.append(edit, remove);
    actionsCell.append(actions);
    studentRows.append(row);
  });

  emptyState.classList.toggle("hidden", filtered.length > 0);
  emptyState.querySelector("strong").textContent = students.length && !filtered.length
    ? "No matching student"
    : "No student results yet";
  emptyState.querySelector("p").textContent = students.length && !filtered.length
    ? "Try a different name."
    : "Add your first result using the form above.";
  renderStats();
}

async function loadStudents() {
  students = await apiRequest("/students");
  renderStudents();
}

function cancelEdit() {
  editingId = null;
  document.querySelector("#formTitle").textContent = "Add a student";
  document.querySelector("#saveStudent").textContent = "Add result";
  document.querySelector("#cancelEdit").classList.add("hidden");
  if (studentForm) studentForm.reset();
  updateTotalPreview();
}

function updateTotalPreview() {
  const total = fields.reduce((sum, field) => sum + (Number(document.querySelector(`#${field}`).value) || 0), 0);
  document.querySelector("#totalPreview").innerHTML = `${total} <small>/ 300</small>`;
}

document.querySelector("#authSwitch").addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "register" : "login");
});

authForm.addEventListener("submit", async event => {
  event.preventDefault();
  setAuthNotice("");
  const button = document.querySelector("#authSubmit");
  button.disabled = true;
  try {
    const payload = {
      email: document.querySelector("#email").value.trim(),
      password: document.querySelector("#password").value
    };
    if (authMode === "register") payload.name = document.querySelector("#name").value.trim();
    const result = await apiRequest(`/auth/${authMode}`, { method: "POST", body: JSON.stringify(payload) });
    token = result.token;
    user = result.user;
    sessionStorage.setItem(tokenKey, token);
    showApp();
    await loadStudents();
  } catch (error) {
    setAuthNotice(error.message);
  } finally {
    button.disabled = false;
  }
});

studentForm.addEventListener("submit", async event => {
  event.preventDefault();
  const data = {
    name: document.querySelector("#studentName").value.trim(),
    physics: Number(document.querySelector("#physics").value),
    chemistry: Number(document.querySelector("#chemistry").value),
    english: Number(document.querySelector("#english").value)
  };
  if (!data.name || !fields.every(field => Number.isInteger(data[field]) && data[field] >= 0 && data[field] <= 100)) {
    showToast("Enter a student name and whole-number marks from 0 to 100.");
    return;
  }

  const button = document.querySelector("#saveStudent");
  button.disabled = true;
  try {
    await apiRequest(editingId ? `/students/${editingId}` : "/students", {
      method: editingId ? "PUT" : "POST",
      body: JSON.stringify(data)
    });
    showToast(editingId ? "Student result updated." : "Student result added.");
    cancelEdit();
    await loadStudents();
  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
  }
});

studentForm.addEventListener("input", updateTotalPreview);
document.querySelector("#searchInput").addEventListener("input", renderStudents);
document.querySelector("#cancelEdit").addEventListener("click", cancelEdit);
document.querySelector("#logoutButton").addEventListener("click", () => signOut());

studentRows.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const student = students.find(item => item._id === button.dataset.id);
  if (!student) return;

  if (button.dataset.action === "edit") {
    editingId = student._id;
    document.querySelector("#studentName").value = student.name;
    for (const field of fields) document.querySelector(`#${field}`).value = student[field];
    document.querySelector("#formTitle").textContent = "Edit student result";
    document.querySelector("#saveStudent").textContent = "Save changes";
    document.querySelector("#cancelEdit").classList.remove("hidden");
    updateTotalPreview();
    document.querySelector("#studentName").focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (!window.confirm(`Delete the result for ${student.name}?`)) return;
  try {
    await apiRequest(`/students/${student._id}`, { method: "DELETE" });
    if (editingId === student._id) cancelEdit();
    await loadStudents();
    showToast("Student result deleted.");
  } catch (error) {
    showToast(error.message);
  }
});

document.querySelector("#todayLabel").textContent = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium"
}).format(new Date());

async function restoreSession() {
  if (!token) return;
  try {
    user = await apiRequest("/auth/me");
    showApp();
    await loadStudents();
  } catch {
    signOut("Your session expired. Sign in again.");
  }
}

restoreSession();
