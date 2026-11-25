export function totalExpenses(expenses) {
  return expenses.reduce((sum, item) => sum + Number(item.amount), 0);
}

export function remainingBudget(budget, expenses) {
  return Number(budget) - totalExpenses(expenses);
}

export function memberExpenses(members, expenses) {
  return members.map(member => ({
    id: member.id,
    name: member.name,
    total: totalExpenses(
      expenses.filter(item => item.memberId === member.id)
    )
  }));
}

export function categoryExpenses(expenses) {
  const result = {};

  expenses.forEach(item => {
    result[item.category] =
      (result[item.category] || 0) + Number(item.amount);
  });

  return Object.entries(result).map(([name, value]) => ({
    name,
    value
  }));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(amount);
}
