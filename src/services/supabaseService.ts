import { supabase } from '../lib/supabase'
import type { BudgetAuditLog, Expense, Income, Saving } from '../types'

type ExpenseRow = {
  id: string
  tracker_id?: string
  date: string
  category: string
  payment_source?: 'income' | 'savings' | null
  payment_source_bank?: string | null
  amount: number
  remarks: string
}

type IncomeRow = {
  id: string
  tracker_id?: string
  date: string
  amount: number
  remarks: string
  source?: string | null
}

type SavingRow = {
  id: string
  tracker_id?: string
  bank: string
  amount: number
  remarks?: string | null
  date: string
}

type AuditLogRow = {
  id: string
  tracker_id: string
  entity_type: BudgetAuditLog['entityType']
  record_id: string
  action: BudgetAuditLog['action']
  actor_user_id?: string | null
  actor_email?: string | null
  old_data?: Record<string, unknown> | null
  new_data?: Record<string, unknown> | null
  occurred_at: string
}

const mapExpense = (row: ExpenseRow): Expense => ({
  id: row.id,
  trackerId: row.tracker_id ?? '',
  date: row.date,
  category: row.category,
  fundingSource: row.payment_source === 'savings' ? 'savings' : 'income',
  fundingSourceBank: row.payment_source_bank ?? undefined,
  amount: row.amount,
  remarks: row.remarks
})

const mapIncome = (row: IncomeRow): Income => ({
  id: row.id,
  trackerId: row.tracker_id ?? '',
  date: row.date,
  amount: row.amount,
  remarks: row.remarks,
  source: row.source ?? undefined
})

const mapSaving = (row: SavingRow): Saving => ({
  id: row.id,
  trackerId: row.tracker_id ?? '',
  bank: row.bank,
  amount: row.amount,
  remarks: row.remarks ?? undefined,
  date: row.date
})

const mapAuditLog = (row: AuditLogRow): BudgetAuditLog => ({
  id: row.id,
  trackerId: row.tracker_id,
  entityType: row.entity_type,
  recordId: row.record_id,
  action: row.action,
  actorUserId: row.actor_user_id ?? null,
  actorEmail: row.actor_email ?? null,
  oldData: row.old_data ?? null,
  newData: row.new_data ?? null,
  occurredAt: row.occurred_at
})

export async function fetchExpenses(trackerId: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('tracker_id', trackerId)
    .order('date', { ascending: false })

  return { data: (data as ExpenseRow[] | null)?.map(mapExpense) ?? null, error }
}

export async function fetchIncomes(trackerId: string) {
  const { data, error } = await supabase
    .from('incomes')
    .select('*')
    .eq('tracker_id', trackerId)
    .order('date', { ascending: false })

  return { data: (data as IncomeRow[] | null)?.map(mapIncome) ?? null, error }
}

export async function fetchSavings(trackerId: string) {
  const { data, error } = await supabase
    .from('savings')
    .select('*')
    .eq('tracker_id', trackerId)
    .order('date', { ascending: false })

  return { data: (data as SavingRow[] | null)?.map(mapSaving) ?? null, error }
}

export async function fetchAuditLogs(trackerId: string, limit = 20) {
  const { data, error } = await supabase
    .from('budget_audit_logs')
    .select('*')
    .eq('tracker_id', trackerId)
    .order('occurred_at', { ascending: false })
    .limit(limit)

  return { data: (data as AuditLogRow[] | null)?.map(mapAuditLog) ?? null, error }
}

export async function insertExpense(expense: Omit<Expense, 'id'>) {
  const { data, error } = await supabase
    .from('expenses')
    .insert([
      {
        tracker_id: expense.trackerId,
        date: expense.date,
        category: expense.category,
        payment_source: expense.fundingSource,
        payment_source_bank: expense.fundingSource === 'savings' ? expense.fundingSourceBank : null,
        amount: expense.amount,
        remarks: expense.remarks
      }
    ])
    .select('*')
    .single()

  return { data: data ? mapExpense(data as ExpenseRow) : null, error }
}

export async function insertIncome(income: Omit<Income, 'id'>) {
  const { data, error } = await supabase
    .from('incomes')
    .insert([
      {
        tracker_id: income.trackerId,
        date: income.date,
        amount: income.amount,
        source: income.source,
        remarks: income.remarks
      }
    ])
    .select('*')
    .single()

  return { data: data ? mapIncome(data as IncomeRow) : null, error }
}

export async function insertSaving(saving: Omit<Saving, 'id'>) {
  const { data, error } = await supabase
    .from('savings')
    .insert([
      {
        tracker_id: saving.trackerId,
        date: saving.date,
        bank: saving.bank,
        amount: saving.amount,
        remarks: saving.remarks
      }
    ])
    .select('*')
    .single()

  return { data: data ? mapSaving(data as SavingRow) : null, error }
}

export async function deleteExpense(id: string) {
  const { data, error } = await supabase.from('expenses').delete().eq('id', id)
  return { data, error }
}

export async function deleteIncome(id: string) {
  const { data, error } = await supabase.from('incomes').delete().eq('id', id)
  return { data, error }
}

export async function deleteSaving(id: string) {
  const { data, error } = await supabase.from('savings').delete().eq('id', id)
  return { data, error }
}
