export const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const to12Hour = (t) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const ORDER = ["Winter", "Spring", "Summer", "Autumn", "Fall"];

// Sorts terms like "Autumn 2026" by year, then by season.
export const compareTerms = (a, b) => {
  const [sa, ya] = a.split(" ");
  const [sb, yb] = b.split(" ");
  return ya - yb || ORDER.indexOf(sa) - ORDER.indexOf(sb) || a.localeCompare(b);
};
