import { useState } from "react";
import {
  Users, UserPlus, Pencil, Trash2, Check, X
} from "lucide-react";

import { generateId } from "../utils/storage";
import {
  totalExpenses,
  formatCurrency
} from "../utils/calculations";

const COLORS = [
  "#284C3C",
  "#B66A50",
  "#758C92",
  "#A18B60",
  "#657D59"
];

export default function Members({ data, setData }) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  function saveMember(e) {
    e.preventDefault();

    const cleanName = name.trim();

    if (!cleanName) {
      setMessage("Please enter a member name.");
      return;
    }

    const duplicate = data.members.some(
      m => m.name.toLowerCase() === cleanName.toLowerCase()
      && m.id !== editingId
    );

    if (duplicate) {
      setMessage("This member already exists.");
      return;
    }

    if (editingId) {
      setData(prev => ({
        ...prev,
        members: prev.members.map(m =>
          m.id === editingId
            ? { ...m, name: cleanName } : m
        )
      }));

      setMessage("Member updated successfully.");
    } else {
      setData(prev => ({
        ...prev,
        members: [
          ...prev.members,
          {
            id: generateId(),
            name: cleanName,
            joinedAt: new Date().toISOString()
          }
        ]
      }));

      setMessage("Member added successfully.");
    }

    setName("");
    setEditingId(null);
  }

  function editMember(member) {
    setName(member.name);
    setEditingId(member.id);
    setMessage("");
  }

  function deleteMember(member) {
    const hasExpenses = data.expenses.some(
      e => e.memberId === member.id
    );

    if (hasExpenses) {
      setMessage(
        "Cannot remove a member with existing expenses."
      );
      return;
    }

    if (!window.confirm(`Remove ${member.name}?`)) {
      return;
    }

    setData(prev => ({
      ...prev,
      members: prev.members.filter(
        m => m.id !== member.id
      )
    }));

    if (editingId === member.id) {
      setEditingId(null);
      setName("");
    }

    setMessage("Member removed successfully.");
  }

  return (
    <main className="members-page">

      <section className="panel">
        <h3>
          {editingId ? "Edit member" : "Add a member"}
        </h3>

        <p className="panel-subtitle">
          Manage the people contributing to your expenses.
        </p>

        <form
          className="inline-form"
          onSubmit={saveMember}
        >
          <input
            type="text"
            value={name}
            maxLength={50}
            placeholder="Enter member name"
            onChange={e => setName(e.target.value)}
            required
          />

          <button
            className="primary-button"
            type="submit"
          >
            {editingId
              ? <Check size={18} />
              : <UserPlus size={18} />}
            {editingId ? "Save changes" : "Add member"}
          </button>

          {editingId && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setEditingId(null);
                setName("");
                setMessage("");
              }}
            >
              <X size={18} /> Cancel
            </button>
          )}
        </form>

        {message && (
          <p className="status-message" role="status">
            {message}
          </p>
        )}
      </section>

      <section className="panel">
        <h3>All members ({data.members.length})</h3>

        <p className="panel-subtitle">
          Individual spending and contributions
        </p>

        {data.members.length === 0 ? (
          <div className="empty-state">
            <Users size={38} />
            <h4>No members yet</h4>
            <p>Add your first member to get started.</p>
          </div>
        ) : (
          <div className="members-grid">
            {data.members.map((member, index) => {
              const records = data.expenses.filter(
                e => e.memberId === member.id
              );

              return (
                <article
                  className="member-card"
                  key={member.id}
                >
                  <div className="member-top">

                    <div
                      className="member-avatar"
                      style={{
                        background:
                          COLORS[index % COLORS.length]
                      }}
                    >
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="member-actions">
                      <button
                        className="icon-button"
                        title="Edit member"
                        aria-label={`Edit ${member.name}`}
                        onClick={() => editMember(member)}
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        className="icon-button delete-button"
                        title="Remove member"
                        aria-label={`Remove ${member.name}`}
                        onClick={() => deleteMember(member)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  <h3>{member.name}</h3>
                  <p>{records.length} transactions</p>

                  <div className="member-spending">
                    <span>Total spent</span>
                    <h2>
                      {formatCurrency(totalExpenses(records))}
                    </h2>
                  </div>

                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
