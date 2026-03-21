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

const normalizeBaseUrl = url => String(url ?? '').replace(/\/+$/, '')

const readJson = async response => {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return { error: text }
  }
}

const extractErrorMessage = payload =>
  payload?.msg ?? payload?.message ?? payload?.error_description ?? payload?.error ?? null

const supabaseAuthRequest = async (context, path, { method = 'GET', body, accessToken, admin = false } = {}) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = context.env
  const baseUrl = normalizeBaseUrl(SUPABASE_URL)
  const url = `${baseUrl}${path}`
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${admin ? SUPABASE_SERVICE_ROLE_KEY : accessToken}`
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  })

  const payload = await readJson(response)

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload) ?? `Supabase Auth request failed (${response.status}).`)
  }

  return payload
}

const supabaseRestRequest = async (context, path, { method = 'POST', body } = {}) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = context.env
  const baseUrl = normalizeBaseUrl(SUPABASE_URL)
  const url = `${baseUrl}${path}`
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  })

  const payload = await readJson(response)

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload) ?? `Supabase REST request failed (${response.status}).`)
  }

  return payload
}

export const getCurrentUser = async (context, accessToken) =>
  supabaseAuthRequest(context, '/auth/v1/user', {
    accessToken
  })

export const listUsers = async context =>
  supabaseAuthRequest(context, '/auth/v1/admin/users', {
    admin: true
  })

export const createUser = async (context, payload) =>
  supabaseAuthRequest(context, '/auth/v1/admin/users', {
    method: 'POST',
    body: payload,
    admin: true
  })

export const getUserById = async (context, userId) =>
  supabaseAuthRequest(context, `/auth/v1/admin/users/${userId}`, {
    admin: true
  })

export const updateUserById = async (context, userId, payload) =>
  supabaseAuthRequest(context, `/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    body: payload,
    admin: true
  })

export const deleteUserById = async (context, userId) =>
  supabaseAuthRequest(context, `/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    admin: true
  })

export const cleanupBudgetAuditLogs = async (context, retentionDays) =>
  supabaseRestRequest(context, '/rest/v1/rpc/cleanup_budget_audit_logs', {
    method: 'POST',
    body: {
      retention_days: retentionDays
    }
  })

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

  let user
  try {
    user = await getCurrentUser(context, accessToken)
  } catch {
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
