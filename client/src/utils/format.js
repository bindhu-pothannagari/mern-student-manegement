const feeFormat = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatFee = (amount) => feeFormat.format(amount ?? 0);

export function formatDuration(months) {
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} year${years === 1 ? "" : "s"}`;
  }
  return `${months} month${months === 1 ? "" : "s"}`;
}

export const capitalize = (text = "") => text.charAt(0).toUpperCase() + text.slice(1);