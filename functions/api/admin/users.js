import { jsonResponse, mapManagedUser, requireAdmin } from '../../_lib/admin'

export async function onRequestGet(context) {
  const auth = await requireAdmin(context)
  if (auth.error) {
    return auth.error
  }

  const { adminClient, adminEmails } = auth
  const { data, error } = await adminClient.auth.admin.listUsers()

  if (error) {
    return jsonResponse({ error: error.message }, 500)
  }

  const users = (data?.users ?? [])
    .map(user => mapManagedUser(user, adminEmails))
    .sort((a, b) => a.email.localeCompare(b.email))

  return jsonResponse({ users })
}

export async function onRequestPost(context) {
  const auth = await requireAdmin(context)
  if (auth.error) {
    return auth.error
  }

  const { adminClient, adminEmails } = auth

  let body
  try {
    body = await context.request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400)
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  const isAdmin = Boolean(body.isAdmin)

  if (!email || !password) {
    return jsonResponse({ error: 'Email and password are required.' }, 400)
  }

  if (password.length < 6) {
    return jsonResponse({ error: 'Password must be at least 6 characters long.' }, 400)
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      approved: true,
      ...(isAdmin ? { role: 'admin' } : {})
    }
  })

  if (error || !data?.user) {
    return jsonResponse({ error: error?.message ?? 'Failed to create user.' }, 500)
  }

  return jsonResponse({ user: mapManagedUser(data.user, adminEmails) }, 201)
}
