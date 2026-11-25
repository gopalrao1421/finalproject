import { useState } from "react";
import {
  Plus, Pencil, Trash2, Receipt,
  Search, Check, X
} from "lucide-react";

import { generateId } from "../utils/storage";
import {
  formatCurrency,
  totalExpenses
} from "../utils/calculations";

const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Education",
  "Entertainment",
  "Healthcare",
  "Bills & Utilities",
  "Travel",
  "Groceries",
  "Other"
];

const METHODS = [
  "Cash", "UPI", "Debit Card",
  "Credit Card", "Bank Transfer", "Other"
];

function today() {
  return new Date().toLocaleDateString("en-CA");
}

function emptyForm() {
  return {
    title: "",
    amount: "",
    memberId: "",
    category: "Food & Dining",
    paymentMethod: "UPI",
    date: today(),
    description: ""
  };
}

export default function Expenses({ data, setData, setActive }) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function memberName(id) {
    return data.members.find(m => m.id === id)?.name
      || "Unknown";
  }

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
  }

  function saveExpense(e) {
    e.preventDefault();

    const amount = Number(form.amount);

    if (
      !form.title.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !form.date ||
      !data.members.some(m => m.id === form.memberId)
    ) {
      setMessage("Please enter valid expense details.");
      return;
    }

    const expense = {
      ...form,
      title: form.title.trim(),
      amount: Math.round(amount * 100) / 100,
      id: editingId || generateId()
    };

    setData(prev => ({
      ...prev,
      expenses: editingId
        ? prev.expenses.map(item =>
            item.id === editingId ? expense : item
          )
        : [...prev.expenses, expense]
    }));

    setMessage(
      editingId
        ? "Expense updated successfully."
        : "Expense recorded successfully."
    );

    resetForm();
  }

  function editExpense(expense) {
    setForm({
      ...expense,
      amount: String(expense.amount)
    });

    setEditingId(expense.id);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteExpense(expense) {
    if (!window.confirm(
      `Delete expense: ${expense.title}?`
    )) return;

    setData(prev => ({
      ...prev,
      expenses: prev.expenses.filter(
        item => item.id !== expense.id
      )
    }));

    if (editingId === expense.id) resetForm();

    setMessage("Expense deleted successfully.");
  }

  const filtered = data.expenses
    .filter(item => {
      const query = search.toLowerCase().trim();

      const matchesSearch = [
        item.title,
        memberName(item.memberId),
        item.description || ""
      ].some(value =>
        value.toLowerCase().includes(query)
      );

      return matchesSearch &&
        (!memberFilter ||
          item.memberId === memberFilter) &&
        (!categoryFilter ||
          item.category === categoryFilter);
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="expenses-page">

      <section className="panel">

        <h3>
          {editingId ? "Edit expense" : "Record an expense"}
        </h3>

        <p className="panel-subtitle">
          Every transaction counts. Record yours here.
        </p>

        {data.members.length === 0 ? (
          <div className="empty-state">
            <Receipt size={38} />
            <h4>Add a member first</h4>
            <p>Every expense must have a payer.</p>

            <button
              className="primary-button"
              onClick={() => setActive("Members")}
            >
              Add Members
            </button>
          </div>
        ) : (
          <form
            className="expense-form"
            onSubmit={saveExpense}
          >

            <div className="form-grid">

              <label>
                Expense title
                <input
                  value={form.title}
                  placeholder="e.g. Lunch with friends"
                  maxLength={100}
                  onChange={e =>
                    update("title", e.target.value)}
                  required
                />
              </label>

              <label>
                Amount (INR)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={e =>
                    update("amount", e.target.value)}
                  required
                />
              </label>

              <label>
                Paid by
                <select
                  value={form.memberId}
                  onChange={e =>
                    update("memberId", e.target.value)}
                  required
                >
                  <option value="">Select member</option>

                  {data.members.map(member => (
                    <option
                      key={member.id}
                      value={member.id}
                    >
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Category
                <select
                  value={form.category}
                  onChange={e =>
                    update("category", e.target.value)}
                >
                  {CATEGORIES.map(category => (
                    <option key={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Payment method
                <select
                  value={form.paymentMethod}
                  onChange={e =>
                    update("paymentMethod", e.target.value)}
                >
                  {METHODS.map(method => (
                    <option key={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Expense date
                <input
                  type="date"
                  value={form.date}
                  max={today()}
                  onChange={e =>
                    update("date", e.target.value)}
                  required
                />
              </label>

            </div>

            <label className="full-width">
              Notes (optional)
              <textarea
                rows="3"
                maxLength={300}
                placeholder="Additional expense details..."
                value={form.description}
                onChange={e =>
                  update("description", e.target.value)}
              />
            </label>

            <div className="form-actions">
              <button
                className="primary-button"
                type="submit"
              >
                {editingId
                  ? <Check size={18} />
                  : <Plus size={18} />}
                {editingId
                  ? "Save changes"
                  : "Record expense"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                >
                  <X size={18} /> Cancel
                </button>
              )}
            </div>

          </form>
        )}

        {message && (
          <p className="status-message" role="status">
            {message}
          </p>
        )}

      </section>

      <section className="panel">

        <div className="section-heading">
          <div>
            <h3>Transaction history</h3>
            <p className="panel-subtitle">
              {filtered.length} transactions
            </p>
          </div>

          <strong className="expense-amount">
            {formatCurrency(totalExpenses(filtered))}
          </strong>
        </div>

        <div className="filter-bar">

          <div className="search-box">
            <Search size={18} />
            <input
              placeholder="Search expenses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            aria-label="Filter by member"
            value={memberFilter}
            onChange={e => setMemberFilter(e.target.value)}
          >
            <option value="">All members</option>

            {data.members.map(member => (
              <option
                key={member.id}
                value={member.id}
              >
                {member.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">All categories</option>

            {CATEGORIES.map(category => (
              <option key={category}>{category}</option>
            ))}
          </select>

        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <Receipt size={36} />
            <h4>No transactions found</h4>
            <p>Your matching expenses will appear here.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Expense</th>
                  <th>Paid by</th>
                  <th>Category</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(expense => (
                  <tr key={expense.id}>
                    <td>
                      <strong>{expense.title}</strong>

                      {expense.description && (
                        <small className="transaction-note">
                          {expense.description}
                        </small>
                      )}
                    </td>

                    <td>{memberName(expense.memberId)}</td>

                    <td>
                      <span className="category-tag">
                        {expense.category}
                      </span>
                    </td>

                    <td>{expense.paymentMethod}</td>
                    <td>{expense.date}</td>

                    <td className="expense-amount">
                      {formatCurrency(expense.amount)}
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          aria-label="Edit expense"
                          title="Edit expense"
                          onClick={() => editExpense(expense)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          className="icon-button delete-button"
                          aria-label="Delete expense"
                          title="Delete expense"
                          onClick={() => deleteExpense(expense)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </section>
    </main>
  );
}
