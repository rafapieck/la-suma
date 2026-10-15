const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
const wholeMoney = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

/** "$1,850" for whole pesos, "$450.50" when there are cents. */
export function formatMoney(amount: number): string {
  return Number.isInteger(amount) ? wholeMoney.format(amount) : money.format(amount);
}

const FREQUENCY_LABELS = { semanal: "cada semana", quincenal: "cada quincena", mensual: "cada mes" };

export function formatFrequency(frequency: keyof typeof FREQUENCY_LABELS): string {
  return FREQUENCY_LABELS[frequency];
}
