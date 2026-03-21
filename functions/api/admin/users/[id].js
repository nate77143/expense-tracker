import {
  deleteUserById,
  getUserById,
  jsonResponse,
  mapManagedUser,
  requireAdmin,
  updateUserById
} from '../../../_lib/admin'

export async function onRequestDelete(context) {
  const auth = await requireAdmin(context)
  if (auth.error) {
    return auth.error
  }

  const { currentUser } = auth
  const userId = String(context.params.id ?? '')

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

export async function onRequestPatch(context) {
  const auth = await requireAdmin(context)
  if (auth.error) {
    return auth.error
  }

  const { adminEmails, currentUser } = auth
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
