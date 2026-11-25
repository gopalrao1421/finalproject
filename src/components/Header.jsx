import { Plus, CalendarDays } from "lucide-react";

export default function Header({ active, setActive }) {
  const date = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <header className="page-header">
      <div>
        <p className="header-date">
          <CalendarDays size={15} /> {date}
        </p>
        <h1>
          {active === "Dashboard"
            ? "Your money, in focus."
            : active}
        </h1>
        <p className="header-description">
          Keep track of every rupee.
        </p>
      </div>

      <button
        className="primary-button"
        onClick={() => setActive("Expenses")}
      >
        <Plus size={19} /> Add Expense
      </button>
    </header>
  );
}
