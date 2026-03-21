import { deleteUserById, jsonResponse, requireAdmin } from '../../../_lib/admin'

export async function onRequestPost(context) {
  const auth = await requireAdmin(context)
  if (auth.error) {
    return auth.error
  }

  const { currentUser } = auth

  let body
  try {
    body = await context.request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400)
  }

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
