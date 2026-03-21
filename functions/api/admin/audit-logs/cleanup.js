import { cleanupBudgetAuditLogs, jsonResponse, requireAdmin } from '../../../_lib/admin'

export async function onRequestPost(context) {
  const auth = await requireAdmin(context)
  if (auth.error) {
    return auth.error
  }

  let body
  try {
    body = await context.request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400)
  }

  const retentionDays = Number(body.retentionDays)

  if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) {
    return jsonResponse({ error: 'retentionDays must be an integer between 1 and 3650.' }, 400)
  }

  let deletedCount
  try {
    deletedCount = await cleanupBudgetAuditLogs(context, retentionDays)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to clean audit logs.' }, 500)
  }

  return jsonResponse({
    deletedCount: typeof deletedCount === 'number' ? deletedCount : 0,
    retentionDays
  })
}
