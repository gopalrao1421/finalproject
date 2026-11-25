import { useState, useEffect } from "react";
import { ShieldCheck, Users, LogOut, Activity } from "lucide-react";

async function api(url, method = "GET", body) {
  const response = await fetch("/api" + url, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const result = await response.json();

  if (!response.ok)
    throw new Error(result.error || "Request failed");

  return result;
}

export default function Admin() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  async function refresh() {
    setUsers(await api("/admin/users"));
    setLogs(await api("/admin/logs"));
  }

  useEffect(() => {
    api("/me").then(u => {
      if (u.role === "admin") setUser(u);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) refresh().catch(e => setError(e.message));
  }, [user]);

  async function signIn(e) {
    e.preventDefault();
    setError("");

    try {
      const account = await api("/login", "POST", {
        email, password
      });

      if (account.role !== "admin") {
        await api("/logout", "POST", {});
        throw new Error("Admin access only");
      }

      setUser(account);
      setPassword("");
    } catch (e) {
      setError(e.message);
    }
  }

  async function signOut() {
    try {
      await api("/logout", "POST", {});
      setUser(null);
      setUsers([]);
      setLogs([]);
    } catch (e) {
      setError(e.message);
    }
  }

  async function changeStatus(u) {
    try {
      await api("/admin/users/" + u.id, "PATCH", {
        blocked: !u.blocked
      });
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  if (!user) return (
    <main className="admin-login">
      <section className="panel admin-login-card">
        <ShieldCheck size={48} color="#284C3C"/>
        <h1>Admin Portal</h1>
        <p>Authorized administrators only</p>

        <form onSubmit={signIn} className="profile-form">
          <label>Email
            <input type="email" required value={email}
              onChange={e => setEmail(e.target.value)}/>
          </label>

          <label>Password
            <input type="password" required value={password}
              onChange={e => setPassword(e.target.value)}/>
          </label>

          <button className="primary-button">
            Admin Sign In
          </button>
        </form>

        {error && <p className="auth-error">{error}</p>}
        <a href="/">Return to user login</a>
      </section>
    </main>
  );

  return (
    <main className="admin-page">
      <header className="account-bar">
        <h1>Admin Portal</h1>
        <button className="secondary-button" onClick={signOut}>
          <LogOut size={18}/> Logout
        </button>
      </header>

      <p>Welcome, {user.name}</p>

      {error && <p className="auth-error">{error}</p>}

      <div className="summary-grid">
        <div className="panel">
          <Users size={24}/>
          <h2>{users.length}</h2>
          <p>Total server accounts</p>
        </div>

        <div className="panel">
          <ShieldCheck size={24}/>
          <h2>{users.filter(u => !u.blocked).length}</h2>
          <p>Active accounts</p>
        </div>

        <div className="panel">
          <Users size={24}/>
          <h2>{users.filter(u => u.blocked).length}</h2>
          <p>Blocked accounts</p>
        </div>

        <div className="panel">
          <Activity size={24}/>
          <h2>{logs.length}</h2>
          <p>Security events</p>
        </div>
      </div>

      <section className="panel">
        <h2>User Management</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th>
                <th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.blocked ? "Blocked" : "Active"}</td>
                  <td>
                    {u.role === "admin" ? "Protected" :
                      <button className="secondary-button"
                        onClick={() => changeStatus(u)}>
                        {u.blocked ? "Unblock" : "Block"}
                      </button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Security Audit Logs</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Action</th><th>Account</th><th>Time</th></tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{log.action}</td>
                  <td>{log.actor}</td>
                  <td>{new Date(log.time).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
