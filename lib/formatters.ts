export function formatCurrency(
  value: number | string | null | undefined,
  currency: string = "ETB",
  locale: string = "en-ET",
) {
  const n =
    typeof value === "number"
      ? value
      : parseFloat(String(value ?? "0").replace(/[^0-9.-]/g, ""));
  const num = Number.isFinite(n) ? n : 0;
  const isWhole = Math.abs(num - Math.round(num)) < 1e-9;
  const minFrac = isWhole ? 0 : 2;
  const maxFrac = isWhole ? 0 : 2;
  try {
    if (currency === "ETB") {
      const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: minFrac,
        maximumFractionDigits: maxFrac,
      }).format(num);
      return `${formatted} BR`;
    }

    // Use Intl with a compact/narrow currency symbol for other currencies
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: minFrac,
      maximumFractionDigits: maxFrac,
    }).format(num);
  } catch (e) {
    // Fallback: short symbol (BR) and no decimals for whole numbers
    const fixed = isWhole ? num.toFixed(0) : num.toFixed(2);
    const parts = fixed.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${parts.join(".")} ${currency === "ETB" ? "BR" : currency}`;
  }
}

export default formatCurrency;
