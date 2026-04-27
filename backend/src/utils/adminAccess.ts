const defaultAdminEmail = 'maxspectorr@gmail.com';

export function getAdminEmails(): string[] {
  const configured = (process.env.ADMIN_EMAILS || defaultAdminEmail)
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return configured.length ? configured : [defaultAdminEmail];
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email.trim().toLowerCase());
}
