/** Display price rounded to whole rupees — never shows paise (no ₹389.22). */
export function formatPrice(amount: number): string {
  if (!Number.isFinite(amount)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}
