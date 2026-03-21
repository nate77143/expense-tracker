import { supabase } from '../lib/supabase'

export interface ManagedUser {
  id: string
  email: string
  createdAt: string | null
  lastSignInAt: string | null
  emailConfirmedAt: string | null
  isAdmin: boolean
  isApproved: boolean
}

const getAccessToken = async () => {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  return session?.access_token ?? null
}

const requestAdminApi = async (path: string, init?: RequestInit) => {
  const accessToken = await getAccessToken()

  if (!accessToken) {
    throw new Error('You must be signed in before using admin settings.')
  }

  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {})
    }
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Admin API not configured yet. Deploy the Cloudflare Pages Functions to enable user management.')
    }

    throw new Error(payload?.error ?? 'The admin request failed.')
  }

  return payload
}

export const fetchManagedUsers = async () => {
  const payload = await requestAdminApi('/api/admin/users')
  if (!payload || typeof payload !== 'object') {
    throw new Error('Admin API returned an unexpected response while loading users.')
  }

  return ((payload as { users?: ManagedUser[] }).users ?? []) as ManagedUser[]
}

export const createManagedUser = async (input: { email: string; password: string; isAdmin: boolean }) => {
  const payload = await requestAdminApi('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(input)
  })

  if (!payload || typeof payload !== 'object' || !('user' in payload)) {
    throw new Error('Admin API returned an unexpected response while creating the user.')
  }

  return (payload as { user: ManagedUser }).user
}

export const deleteManagedUser = async (id: string) => {
  await requestAdminApi(`/api/admin/users/${id}`, {
    method: 'DELETE'
  })
}

export const updateManagedUserApproval = async (id: string, approved: boolean) => {
  const payload = await requestAdminApi(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ approved })
  })

  if (!payload || typeof payload !== 'object' || !('user' in payload)) {
    throw new Error('Admin API returned an unexpected response while updating approval.')
  }

  return (payload as { user: ManagedUser }).user
}
