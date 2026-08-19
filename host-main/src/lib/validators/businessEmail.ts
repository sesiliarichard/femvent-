export function validateBusinessEmail(email: string): string {
  const trimmed = email.trim();

  if (!trimmed) {
    return 'Business email is required.';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmed)) {
    return 'Please enter a valid business email address.';
  }

  return '';
}

export function isBusinessEmail(email: string): boolean {
  return validateBusinessEmail(email) === '';
}

