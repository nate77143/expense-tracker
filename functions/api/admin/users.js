import { createUser, jsonResponse, listUsers, mapManagedUser, requireAdmin } from '../../_lib/admin'
import { deleteUserById, getUserById, updateUserById } from '../../_lib/admin'

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

  const { adminEmails, currentUser } = auth

  let body
  try {
    body = await context.request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400)
  }

  const action = String(body.action ?? 'create')

  if (action === 'approval') {
    const userId = String(body.id ?? '')
    const approved = body.approved

    if (!userId) {
      return jsonResponse({ error: 'User id is required.' }, 400)
    }

    if (typeof approved !== 'boolean') {
      return jsonResponse({ error: 'approved must be provided as a boolean.' }, 400)
    }

    let existingData
    try {
      existingData = await getUserById(context, userId)
    } catch (error) {
      return jsonResponse({ error: error instanceof Error ? error.message : 'User not found.' }, 404)
    }

    if (!existingData?.user) {
      return jsonResponse({ error: 'User not found.' }, 404)
    }

    if (userId === currentUser.id && approved === false) {
      return jsonResponse({ error: 'You cannot revoke approval from your own currently signed-in admin account.' }, 400)
    }

    const currentAppMetadata = existingData.user.app_metadata ?? {}
    let data
    try {
      data = await updateUserById(context, userId, {
        app_metadata: {
          ...currentAppMetadata,
          approved
        }
      })
    } catch (error) {
      return jsonResponse(
        { error: error instanceof Error ? error.message : 'Failed to update user approval.' },
        500
      )
    }

    if (!data?.user) {
      return jsonResponse({ error: 'Failed to update user approval.' }, 500)
    }

    return jsonResponse({ user: mapManagedUser(data.user, adminEmails) })
  }

  if (action === 'remove') {
    const userId = String(body.id ?? '')

    if (!userId) {
      return jsonResponse({ error: 'User id is required.' }, 400)
    }

    if (userId === currentUser.id) {
      return jsonResponse({ error: 'You cannot delete your own currently signed-in admin account.' }, 400)
    }

    try {
      await deleteUserById(context, userId)
    } catch (error) {
      return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to delete user.' }, 500)
    }

    return jsonResponse({ success: true })
  }

  if (action !== 'create') {
    return jsonResponse({ error: 'Unsupported admin action.' }, 400)
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
