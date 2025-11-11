import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate the number of days until an expiration date
 * @param expirationDate - The expiration date string
 * @returns The number of days until expiration (negative if expired, null if no date)
 */
export function getDaysUntilExpiration(
  expirationDate: string | undefined | null,
): number | null {
  if (!expirationDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format expiration days into a human-readable string
 * @param days - The number of days until expiration (can be negative)
 * @returns A formatted string describing the expiration status
 */
export function formatExpirationText(days: number): string {
  if (days < 0) {
    const absDays = Math.abs(days);
    return `Expired ${absDays} day${absDays !== 1 ? "s" : ""} ago`;
  }
  if (days === 0) {
    return "Expires today";
  }
  if (days === 1) {
    return "Expires tomorrow";
  }
  return `Expires in ${days} days`;
}
