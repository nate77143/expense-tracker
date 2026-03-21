import { createClient } from '@supabase/supabase-js'

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  })

const parseAdminEmails = rawValue =>
  (rawValue ?? '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)

const getBearerToken = request => {
  const authHeader = request.headers.get('Authorization') ?? ''

  if (!authHeader.startsWith('Bearer ')) {
    return null
  }

  return authHeader.slice(7).trim()
}

export const requireAdmin = async context => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAILS } = context.env

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return {
      error: json(
        {
          error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the Pages Functions environment.'
        },
        500
      )
    }
  }

  const accessToken = getBearerToken(context.request)
  if (!accessToken) {
    return {
      error: json({ error: 'Missing bearer token.' }, 401)
    }
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })

  const {
    data: { user },
    error: userError
  } = await adminClient.auth.getUser(accessToken)

  if (userError || !user) {
    return {
      error: json({ error: 'Invalid or expired session.' }, 401)
    }
  }

  const adminEmails = parseAdminEmails(ADMIN_EMAILS)
  const isAdmin = user.app_metadata?.role === 'admin' || adminEmails.includes((user.email ?? '').toLowerCase())

  if (!isAdmin) {
    return {
      error: json({ error: 'Admin access required.' }, 403)
    }
  }

  return {
    adminClient,
    adminEmails,
    currentUser: user
  }
}

export const mapManagedUser = (user, adminEmails) => ({
  id: user.id,
  email: user.email ?? 'No email',
  createdAt: user.created_at ?? null,
  lastSignInAt: user.last_sign_in_at ?? null,
  emailConfirmedAt: user.email_confirmed_at ?? null,
  isAdmin: user.app_metadata?.role === 'admin' || adminEmails.includes((user.email ?? '').toLowerCase()),
  isApproved:
    user.app_metadata?.approved === true ||
    user.app_metadata?.role === 'admin' ||
    adminEmails.includes((user.email ?? '').toLowerCase())
})

export const jsonResponse = json
