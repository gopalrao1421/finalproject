import { useState } from "react";
import { UserRound, Save, LogOut } from "lucide-react";
import { updateName } from "../utils/auth";

export default function Profile({ user, setUser, onLogout }) {
  const [name, setName] = useState(user.name);
  const [message, setMessage] = useState("");

  function save(e) {
    e.preventDefault();

    try {
      setUser(updateName(user.id, name));
      setMessage("Username updated successfully.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <section className="panel profile-panel">

      <div className="profile-avatar">
        <UserRound size={38} />
      </div>

      <h3>My profile</h3>
      <p className="panel-subtitle">Manage your account details.</p>

      <form onSubmit={save} className="profile-form">

        <label>
          Username
          <input value={name} maxLength={50} required
            onChange={e => setName(e.target.value)} />
        </label>

        <label>
          Email address
          <input value={user.email} readOnly />
        </label>

        <button className="primary-button">
          <Save size={18} /> Save changes
        </button>

      </form>

      {message && <p className="status-message">{message}</p>}

      <button className="secondary-button logout-button" onClick={onLogout}>
        <LogOut size={18} /> Logout
      </button>

    </section>
  );
}
