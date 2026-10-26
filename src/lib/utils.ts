import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "KES"): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return `${currency} 0`;
  if (currency === "KES") {
    return `KSh ${numericAmount.toLocaleString("en-KE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(numericAmount);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
