import {
  LayoutDashboard,
  Receipt,
  Users,
  Wallet,
  ChartNoAxesCombined,
  ArrowLeftRight,
  ShieldCheck
} from "lucide-react";

const menu = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Expenses", icon: Receipt },
  { name: "Members", icon: Users },
  { name: "Budgets", icon: Wallet },
  { name: "Reports", icon: ChartNoAxesCombined, disabled: true },
  { name: "Settlements", icon: ArrowLeftRight, disabled: true }
];

export default function Sidebar({ active, setActive }) {
  return (
    <aside className="sidebar">

      <div className="brand">
        <div className="brand-icon">
          <Wallet size={24} />
        </div>
        <div>
          <h2>Expense Tracker</h2>
          <p>Manage your money</p>
        </div>
      </div>

      <p className="menu-label">WORKSPACE</p>

      <nav>
        {menu.map(({ name, icon: Icon, disabled }) => (
          <button
            key={name}
            className={`nav-item ${active === name ? "active" : ""}`}
            onClick={() => setActive(name)}
            disabled={disabled}
            title={name}
            aria-label={name}
            aria-current={active === name ? "page" : undefined}
          >
            <Icon size={20} />
            <span>{name}</span>
            {disabled && <small>SOON</small>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <ShieldCheck size={20} color="#A8BBA2" />
        <span>Local &amp; Private</span>
      </div>

    </aside>
  );
}
