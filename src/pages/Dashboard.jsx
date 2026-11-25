import {
  Wallet,
  TrendingDown,
  Users,
  IndianRupee,
  Receipt
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

import SummaryCard from "../components/SummaryCard";

import {
  totalExpenses,
  remainingBudget,
  memberExpenses,
  categoryExpenses,
  formatCurrency
} from "../utils/calculations";

const COLORS = [
  "#284C3C",
  "#B66A50",
  "#A8BBA2",
  "#D8BFA4",
  "#C4A35A",
  "#758C92"
];

export default function Dashboard({ data }) {
  const { members, expenses, budget } = data;

  const spent = totalExpenses(expenses);
  const balance = remainingBudget(budget, expenses);
  const people = memberExpenses(members, expenses);
  const categories = categoryExpenses(expenses);

  const percentage = budget > 0
    ? (spent / budget) * 100
    : 0;

  const recent = [...expenses]
    .sort((a, b) =>
      String(b.date).localeCompare(String(a.date))
    )
    .slice(0, 5);

  return (
    <main className="dashboard">

      <section className="balance-banner">
        <div className="balance-heading">
          <span>Available balance</span>
          <Wallet size={26} />
        </div>

        <h2>{formatCurrency(balance)}</h2>

        <div className="budget-details">
          <span>
            {formatCurrency(spent)} spent of
            {" "}{formatCurrency(budget)}
          </span>
          <span>{percentage.toFixed(1)}%</span>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              background: percentage > 100
                ? "#B66A50" : "#284C3C"
            }}
          />
        </div>

        {percentage > 100 && (
          <p>Warning: Your budget has been exceeded.</p>
        )}
      </section>

      <section className="summary-grid">
        <SummaryCard
          title="Total Budget"
          value={formatCurrency(budget)}
          icon={Wallet}
          description="Allocated funds"
        />

        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(spent)}
          icon={TrendingDown}
          description="Total recorded spending"
          variant="expense-card"
        />

        <SummaryCard
          title="Transactions"
          value={expenses.length}
          icon={IndianRupee}
          description="Recorded expenses"
        />

        <SummaryCard
          title="Active Members"
          value={members.length}
          icon={Users}
          description="Registered members"
        />
      </section>

      <section className="charts-grid">

        <div className="panel">
          <h3>Spending by member</h3>
          <p className="panel-subtitle">
            See who spent how much
          </p>

          {people.some(p => p.total > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={people}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E8E5DD"
                />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={value => formatCurrency(value)}
                />
                <Bar
                  dataKey="total"
                  name="Amount spent"
                  fill="#284C3C"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <Users size={34} />
              <p>No member expenses recorded yet.</p>
            </div>
          )}
        </div>

        <div className="panel">
          <h3>Spending by category</h3>
          <p className="panel-subtitle">
            Understand where your money goes
          </p>

          {categories.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {categories.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={value => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="chart-legend">
                {categories.map((item, index) => (
                  <span key={item.name}>
                    <i style={{
                      background: COLORS[index % COLORS.length]
                    }} />
                    {item.name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Receipt size={34} />
              <p>No spending categories yet.</p>
            </div>
          )}
        </div>

      </section>

      <section className="panel">
        <h3>Recent expenses</h3>
        <p className="panel-subtitle">
          Your latest financial activity
        </p>

        {recent.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Expense</th>
                  <th>Paid by</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(expense => (
                  <tr key={expense.id}>
                    <td>{expense.title}</td>
                    <td>
                      {members.find(
                        m => m.id === expense.memberId
                      )?.name || "Unknown"}
                    </td>
                    <td>{expense.category}</td>
                    <td>{expense.date}</td>
                    <td className="expense-amount">
                      {formatCurrency(expense.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Receipt size={34} />
            <h4>No expenses yet</h4>
            <p>Add your first expense to get started.</p>
          </div>
        )}
      </section>

    </main>
  );
}
