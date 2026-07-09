export function normalizeOrderStatus(status: unknown): string {
  return String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
}

/** Order can still be confirmed or cancelled by the retailer. */
export function isAwaitingRetailerConfirmation(status: unknown): boolean {
  const s = normalizeOrderStatus(status);
  return (
    s === "pending" ||
    s === "waiting_retailer" ||
    s === "waiting_retailer_confirmation"
  );
}

/** Reject via retailer_confirm; otherwise use /cancel. */
export function shouldUseRetailerConfirmEndpoint(status: unknown): boolean {
  const s = normalizeOrderStatus(status);
  return s === "waiting_retailer" || s === "waiting_retailer_confirmation";
}
