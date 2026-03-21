import { supabase } from '../lib/supabase'
import type { Expense, Income, Saving } from '../types'

type ExpenseRow = {
  id: string
  tracker_id?: string
  date: string
  category: string
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

const mapExpense = (row: ExpenseRow): Expense => ({
  id: row.id,
  trackerId: row.tracker_id ?? '',
  date: row.date,
  category: row.category,
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

export async function insertExpense(expense: Omit<Expense, 'id'>) {
  const { data, error } = await supabase
    .from('expenses')
    .insert([
      {
        tracker_id: expense.trackerId,
        date: expense.date,
        category: expense.category,
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
