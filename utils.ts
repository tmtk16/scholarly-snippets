import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Helper function to format prices from cents to dollars
 * @param cents Price in cents
 * @returns Formatted price string with dollar sign
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Helper function to count words in a text
 * @param text The text to count words in
 * @returns Number of words
 */
export function countWords(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Helper function to calculate price based on word count and price per 500 words
 * @param wordCount Number of words
 * @param pricePerUnit Price per 500 words in cents
 * @returns Total price in cents
 */
export function calculatePrice(wordCount: number, pricePerUnit: number): number {
  const units = Math.ceil(wordCount / 500);
  return units * pricePerUnit;
}

/**
 * Helper function to truncate text to a specified length
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
