"use server"

export function getAdminEmails(): string[] {
  return process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()).filter(Boolean) || []
}

export async function isAdminEmail(email: string): Promise<boolean> {
  const adminEmails = getAdminEmails()
  return adminEmails.includes(email.toLowerCase())
}
