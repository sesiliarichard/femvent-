// Blocks common free/personal email providers so organizer signups
// use a work or organization address instead.
// Extend this list as you find more providers slipping through.
const BLOCKED_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "ymail.com",
  "outlook.com",
  "hotmail.com",
  "hotmail.co.uk",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "gmx.com",
  "gmx.us",
  "zoho.com",
  "yandex.com",
  "mail.com",
  "inbox.com",
  "rocketmail.com",
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmailValidationResult =
  | { valid: true }
  | { valid: false; reason: "invalid_format" | "personal_domain" };

/**
 * Checks that a string is a well-formed email AND not from a known
 * personal/free-mail domain. Does not verify the domain actually
 * exists or accepts mail — pair with a verification email step for that.
 */
export function validateBusinessEmail(email: string): EmailValidationResult {
  const trimmed = email.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(trimmed)) {
    return { valid: false, reason: "invalid_format" };
  }

  const domain = trimmed.split("@")[1];
  if (BLOCKED_DOMAINS.has(domain)) {
    return { valid: false, reason: "personal_domain" };
  }

  return { valid: true };
}

export function isBusinessEmail(email: string): boolean {
  return validateBusinessEmail(email).valid;
}

/** Human-readable message for the reason returned above, ready to show under the field. */
export function getBusinessEmailErrorMessage(
  reason: "invalid_format" | "personal_domain"
): string {
  switch (reason) {
    case "invalid_format":
      return "Enter a valid email address.";
    case "personal_domain":
      return "Use your work or organization email instead of a personal address.";
  }
}