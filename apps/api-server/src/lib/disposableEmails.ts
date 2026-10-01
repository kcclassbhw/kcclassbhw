/**
 * Disposable / temporary email domain detection.
 *
 * Uses the `disposable-email-domains` package — a community-maintained list
 * of 120,000+ known throwaway email providers, updated regularly.
 *
 * Falls back to a small hardcoded set if the package somehow fails to load
 * (e.g. during a cold start before node_modules is fully available).
 */

// @ts-ignore — no type definitions for this package
import disposableDomains from "disposable-email-domains";

const DOMAIN_SET: Set<string> = new Set(
  Array.isArray(disposableDomains) ? disposableDomains : []
);

const FALLBACK_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "tempmail.com", "temp-mail.org",
  "throwaway.email", "yopmail.com", "trashmail.com", "fakeinbox.com",
  "maildrop.cc", "10minutemail.com", "burnermail.io", "mailsac.com",
  "discard.email", "getnada.com", "tempr.email",
]);

/**
 * Returns true if the email address belongs to a known disposable / temporary
 * email provider. Matching is case-insensitive on the domain part only.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@").pop()!.toLowerCase().trim();
  // Always check both sources — npm package may not have all domains
  return DOMAIN_SET.has(domain) || FALLBACK_DOMAINS.has(domain);
}
