const KEY = "expense-accounts-v1";

export function accounts() {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

function saveAccounts(users) {
  localStorage.setItem(KEY, JSON.stringify(users));
}

async function hash(password, salt) {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    salt: encoder.encode(salt),
    iterations: 600000,
    hash: "SHA-256"
  }, key, 256);

  return Array.from(new Uint8Array(bits))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function register(name, email, password) {
  email = email.trim().toLowerCase();
  name = name.trim();

  if (!name || !email || password.length < 8)
    throw new Error("Enter valid details. Password needs 8 characters.");

  const users = accounts();

  if (users.some(u => u.email === email))
    throw new Error("Email already registered.");

  const salt = crypto.randomUUID();

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    salt,
    passwordHash: await hash(password, salt)
  };

  // Preserve existing records for the first account.
  if (users.length === 0) {
    const oldData = localStorage.getItem("expense-tracker-v1");
    if (oldData)
      localStorage.setItem("expenses-" + user.id, oldData);
  }

  saveAccounts([...users, user]);

  return startSession(user);
}

export async function login(email, password) {
  const user = accounts().find(
    u => u.email === email.trim().toLowerCase()
  );

  if (!user || await hash(password, user.salt) !== user.passwordHash)
    throw new Error("Incorrect email or password.");

  return startSession(user);
}

function startSession(user) {
  sessionStorage.setItem("expense-session", user.id);
  return getSession();
}

export function getSession() {
  const id = sessionStorage.getItem("expense-session");
  const user = accounts().find(u => u.id === id);

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

export function updateName(id, name) {
  name = name.trim();

  if (!name)
    throw new Error("Username cannot be empty.");

  saveAccounts(accounts().map(u =>
    u.id === id ? { ...u, name } : u
  ));

  return getSession();
}

export function logout() {
  sessionStorage.removeItem("expense-session");
}
