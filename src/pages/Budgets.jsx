import { useState } from "react";
import {
  Wallet,
  Target,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Save
} from "lucide-react";

import {
  totalExpenses,
  remainingBudget,
  formatCurrency
} from "../utils/calculations";

export default function Budgets({ data, setData }) {
  const [amount, setAmount] = useState(
    data.budget || ""
  );
  const [message, setMessage] = useState("");

  const spent = totalExpenses(data.expenses);
  const balance = remainingBudget(
    data.budget,
    data.expenses
  );

  const percentage = data.budget > 0
    ? (spent / data.budget) * 100
    : 0;

  function saveBudget(e) {
    e.preventDefault();

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
      setMessage("Please enter a valid budget.");
      return;
    }

    setData(prev => ({
      ...prev,
      budget: Math.round(value * 100) / 100
    }));

    setMessage("Budget updated successfully.");
  }

  let status = "On track";
  let color = "#284C3C";

  if (data.budget <= 0) {
    status = "No budget set";
    color = "#777B6C";
  } else if (percentage >= 100) {
    status = percentage > 100
      ? "Budget exceeded"
      : "Budget fully used";
    color = "#B66A50";
  } else if (percentage >= 80) {
    status = "Approaching budget limit";
    color = "#A18B45";
  }

  return (
    <main className="budgets-page">

      <section className="panel">
        <h3>Plan your spending</h3>

        <p className="panel-subtitle">
          Set a budget and stay in control of your money.
        </p>

        <form
          className="inline-form"
          onSubmit={saveBudget}
        >
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Enter budget amount"
            aria-label="Budget amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />

          <button
            className="primary-button"
            type="submit"
          >
            <Save size={18} /> Save budget
          </button>
        </form>

        {message && (
          <p className="status-message" role="status">
            {message}
          </p>
        )}
      </section>

      <section className="balance-banner">

        <div className="balance-heading">
          <span>Budget utilization</span>
          <Target size={24} />
        </div>

        <h2>{percentage.toFixed(1)}%</h2>

        <div className="budget-details">
          <span>{formatCurrency(spent)} spent</span>
          <span>{formatCurrency(data.budget)} budget</span>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              background: color
            }}
          />
        </div>

        <p style={{ color, fontWeight: 600 }}>
          {status}
        </p>

      </section>

      <section className="budget-summary">

        <div className="panel">
          <Wallet size={25} color="#284C3C" />
          <p className="panel-subtitle">Total budget</p>
          <h2>{formatCurrency(data.budget)}</h2>
        </div>

        <div className="panel">
          <TrendingDown size={25} color="#B66A50" />
          <p className="panel-subtitle">Total spent</p>
          <h2 className="expense-amount">
            {formatCurrency(spent)}
          </h2>
        </div>

        <div className="panel">
          <Target size={25} color="#284C3C" />
          <p className="panel-subtitle">
            Remaining budget
          </p>
          <h2 style={{
            color: balance < 0
              ? "#B66A50" : "#284C3C"
          }}>
            {formatCurrency(balance)}
          </h2>
        </div>

      </section>

      <section className="panel">

        <h3>Budget insights</h3>

        <div className="budget-insight">

          {data.budget <= 0 ? (
            <>
              <Target size={28} color="#777B6C" />
              <div>
                <h4>Set your first budget</h4>
                <p>
                  Define a spending limit to monitor
                  your expenses effectively.
                </p>
              </div>
            </>
          ) : percentage > 100 ? (
            <>
              <AlertTriangle
                size={28}
                color="#B66A50"
              />
              <div>
                <h4>You have exceeded your budget</h4>
                <p>
                  Overspent by
                  {" "}{formatCurrency(Math.abs(balance))}.
                  Review unnecessary expenses.
                </p>
              </div>
            </>
          ) : percentage >= 80 ? (
            <>
              <AlertTriangle
                size={28}
                color="#A18B45"
              />
              <div>
                <h4>Watch your spending</h4>
                <p>
                  You have used {percentage.toFixed(1)}%
                  of your budget.
                  Remaining: {formatCurrency(balance)}.
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle
                size={28}
                color="#284C3C"
              />
              <div>
                <h4>Your spending is on track</h4>
                <p>
                  You still have
                  {" "}{formatCurrency(balance)}
                  {" "}available in your budget.
                </p>
              </div>
            </>
          )}

        </div>
      </section>

    </main>
  );
}
