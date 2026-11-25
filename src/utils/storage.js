const STORAGE_KEY = "expense-tracker-v1";

const defaultData = {
  members: [],
  expenses: [],
  budget: 0
};

export function loadData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultData;
  } catch {
    return defaultData;
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function generateId() {
  return crypto.randomUUID();
}
