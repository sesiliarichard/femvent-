export function validateBusinessEmail(email: string): string {
  const trimmed = email.trim();

  if (!trimmed) {
    return 'Business email is required.';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmed)) {
    return 'Please enter a valid business email address.';
  }

  const domain = trimmed.split('@')[1]?.toLowerCase();
  if (!domain) {
    return 'Please enter a valid business email address.';
  }

  const freeEmailProviders = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'protonmail.com',
    'aol.com',
  ];

  if (freeEmailProviders.includes(domain)) {
    return 'Please use your company email address instead of a personal inbox.';
  }

  return '';
}

export function isBusinessEmail(email: string): boolean {
  return validateBusinessEmail(email) === '';
}
