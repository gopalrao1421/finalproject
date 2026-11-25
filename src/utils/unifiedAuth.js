import { login as localLogin, register } from "./auth";

export { register };

export async function login(email, password) {
  if (email.trim().toLowerCase() === "admin@expense.local") {
    const response = await fetch("/api/login", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const user = await response.json();

    if (!response.ok) {
      throw new Error(user.error || "Invalid credentials");
    }

    if (user.role !== "admin") {
      throw new Error("Admin access denied");
    }

    window.location.replace("/admin");

    return new Promise(() => {});
  }

  return localLogin(email, password);
}
