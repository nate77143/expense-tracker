import { supabase } from '../lib/supabase'
import type { Tracker, TrackerMember, TrackerRole } from '../types'

type TrackerRow = {
  id: string
  name: string
  description?: string | null
  created_at?: string | null
  is_personal?: boolean | null
}

type TrackerMemberRow = {
  id: string
  tracker_id: string
  user_id?: string | null
  email: string
  role: TrackerRole
  status?: 'active' | 'invited' | null
  joined_at?: string | null
}

const mapTracker = (row: TrackerRow): Tracker => ({
  id: row.id,
  name: row.name,
  description: row.description ?? '',
  createdAt: row.created_at ?? new Date().toISOString(),
  isPersonal: row.is_personal ?? false
})

const mapTrackerMember = (row: TrackerMemberRow): TrackerMember => ({
  id: row.id,
  trackerId: row.tracker_id,
  userId: row.user_id ?? null,
  email: row.email,
  role: row.role,
  status: row.status ?? 'active',
  joinedAt: row.joined_at ?? new Date().toISOString()
})

export async function fetchTrackersForUser(userId: string, email: string) {
  const { data: membershipRows, error: membershipError } = await supabase
    .from('tracker_members')
    .select('*')
    .or(`user_id.eq.${userId},email.eq.${email.toLowerCase()}`)

  if (membershipError) {
    return { trackers: null, trackerMembers: null, error: membershipError }
  }

  const memberships = ((membershipRows as TrackerMemberRow[] | null) ?? []).map(mapTrackerMember)
  const trackerIds = memberships.map(member => member.trackerId)

  if (trackerIds.length === 0) {
    return { trackers: [] as Tracker[], trackerMembers: memberships, error: null }
  }

  const { data: trackerRows, error: trackerError } = await supabase
    .from('trackers')
    .select('*')
    .in('id', trackerIds)
    .order('created_at', { ascending: true })

  if (trackerError) {
    return { trackers: null, trackerMembers: null, error: trackerError }
  }

  return {
    trackers: ((trackerRows as TrackerRow[] | null) ?? []).map(mapTracker),
    trackerMembers: memberships,
    error: null
  }
}

export async function fetchTrackerMembers(trackerId: string) {
  const { data, error } = await supabase
    .from('tracker_members')
    .select('*')
    .eq('tracker_id', trackerId)
    .order('joined_at', { ascending: true })

  return { data: ((data as TrackerMemberRow[] | null) ?? []).map(mapTrackerMember), error }
}

export async function createTracker(input: {
  name: string
  description: string
  isPersonal?: boolean
  ownerUserId: string
  ownerEmail: string
}) {
  const { data: trackerRow, error: trackerError } = await supabase
    .from('trackers')
    .insert([
      {
        name: input.name,
        description: input.description,
        is_personal: input.isPersonal ?? false
      }
    ])
    .select('*')
    .single()

  if (trackerError || !trackerRow) {
    return { tracker: null, ownerMembership: null, error: trackerError ?? new Error('Failed to create tracker.') }
  }

  const tracker = mapTracker(trackerRow as TrackerRow)

  const { data: membershipRow, error: membershipError } = await supabase
    .from('tracker_members')
    .insert([
      {
        tracker_id: tracker.id,
        user_id: input.ownerUserId,
        email: input.ownerEmail.toLowerCase(),
        role: 'owner',
        status: 'active'
      }
    ])
    .select('*')
    .single()

  if (membershipError || !membershipRow) {
    return { tracker, ownerMembership: null, error: membershipError ?? new Error('Failed to create tracker owner membership.') }
  }

  return {
    tracker,
    ownerMembership: mapTrackerMember(membershipRow as TrackerMemberRow),
    error: null
  }
}

export async function addTrackerMember(input: {
  trackerId: string
  email: string
  role: TrackerRole
}) {
  const { data, error } = await supabase
    .from('tracker_members')
    .insert([
      {
        tracker_id: input.trackerId,
        email: input.email.toLowerCase(),
        role: input.role,
        status: 'active'
      }
    ])
    .select('*')
    .single()

  return { data: data ? mapTrackerMember(data as TrackerMemberRow) : null, error }
}

export async function deleteTrackerMember(id: string) {
  const { data, error } = await supabase.from('tracker_members').delete().eq('id', id)
  return { data, error }
}

export async function deleteTracker(id: string) {
  const { data, error } = await supabase.from('trackers').delete().eq('id', id)
  return { data, error }
}
