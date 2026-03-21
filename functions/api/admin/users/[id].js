import { jsonResponse, mapManagedUser, requireAdmin } from '../../../_lib/admin'

export async function onRequestDelete(context) {
  const auth = await requireAdmin(context)
  if (auth.error) {
    return auth.error
  }

  const { adminClient, currentUser } = auth
  const userId = String(context.params.id ?? '')

  if (!userId) {
    return jsonResponse({ error: 'User id is required.' }, 400)
  }

  if (userId === currentUser.id) {
    return jsonResponse({ error: 'You cannot delete your own currently signed-in admin account.' }, 400)
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId)

  if (error) {
    return jsonResponse({ error: error.message }, 500)
  }

  return jsonResponse({ success: true })
}

export async function onRequestPatch(context) {
  const auth = await requireAdmin(context)
  if (auth.error) {
    return auth.error
  }

  const { adminClient, adminEmails, currentUser } = auth
  const userId = String(context.params.id ?? '')

  if (!userId) {
    return jsonResponse({ error: 'User id is required.' }, 400)
  }

  let body
  try {
    body = await context.request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400)
  }

  const approved = body.approved

  if (typeof approved !== 'boolean') {
    return jsonResponse({ error: 'approved must be provided as a boolean.' }, 400)
  }

  const { data: existingData, error: existingError } = await adminClient.auth.admin.getUserById(userId)

  if (existingError || !existingData.user) {
    return jsonResponse({ error: existingError?.message ?? 'User not found.' }, 404)
  }

  if (userId === currentUser.id && approved === false) {
    return jsonResponse({ error: 'You cannot revoke approval from your own currently signed-in admin account.' }, 400)
  }

  const currentAppMetadata = existingData.user.app_metadata ?? {}
  const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...currentAppMetadata,
      approved
    }
  })

  if (error || !data.user) {
    return jsonResponse({ error: error?.message ?? 'Failed to update user approval.' }, 500)
  }

  return jsonResponse({ user: mapManagedUser(data.user, adminEmails) })
}
