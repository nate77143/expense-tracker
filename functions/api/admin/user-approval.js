import { getUserById, jsonResponse, mapManagedUser, requireAdmin, updateUserById } from '../../_lib/admin'

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
