import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a human-readable format.
 */
export function formatDate(dateStr: string, fmt: string = "MMM d, yyyy"): string {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

/**
 * Format a datetime string to include time.
 */
export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return dateStr;
  }
}

/**
 * Get initials from a name.
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate a string to a given length.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert a status string to a display label.
 */
export function statusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Get a status color for badges.
 */
export function statusColor(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "confirmed":
    case "paid":
    case "completed":
    case "checked_out":
      return "default";
    case "pending":
    case "pending_verification":
      return "secondary";
    case "cancelled":
    case "expired":
    case "no_show":
      return "destructive";
    default:
      return "outline";
  }
}
