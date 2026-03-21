import { createUser, jsonResponse, listUsers, mapManagedUser, requireAdmin } from '../../_lib/admin'

export async function onRequestGet(context) {
  const auth = await requireAdmin(context)
  if (auth.error) {
    return auth.error
  }

  const { adminEmails } = auth
  let data
  try {
    data = await listUsers(context)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to list users.' }, 500)
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

  const { adminEmails } = auth

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

  let data
  try {
    data = await createUser(context, {
      email,
      password,
      email_confirm: true,
      app_metadata: {
        approved: true,
        ...(isAdmin ? { role: 'admin' } : {})
      }
    })
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to create user.' }, 500)
  }

  if (!data?.user) {
    return jsonResponse({ error: 'Failed to create user.' }, 500)
  }

  return jsonResponse({ user: mapManagedUser(data.user, adminEmails) }, 201)
}
