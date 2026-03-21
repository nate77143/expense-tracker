const parseList = (rawValue: string | undefined) => {
  return (rawValue ?? '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)
}

const configuredAdminEmails = parseList(import.meta.env.VITE_ADMIN_EMAILS)

export const isAdminUser = (email?: string | null, appRole?: string | null) => {
  if (appRole === 'admin') {
    return true
  }

  if (!email) {
    return false
  }

  return configuredAdminEmails.includes(email.trim().toLowerCase())
}

export const hasConfiguredAdminEmails = configuredAdminEmails.length > 0
