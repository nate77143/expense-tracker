import { supabase } from '../lib/supabase'
import type { Expense, Income } from '../types'

export async function fetchExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })
  return { data: data as Expense[] | null, error }
}

export async function fetchIncomes() {
  const { data, error } = await supabase
    .from('incomes')
    .select('*')
    .order('date', { ascending: false })
  return { data: data as Income[] | null, error }
}

export async function insertExpense(expense: Omit<Expense, 'id'>) {
  const { data, error } = await supabase
    .from('expenses')
    .insert([expense])
    .select('*')
    .single()
  return { data: data as Expense | null, error }
}

export async function insertIncome(income: Omit<Income, 'id'>) {
  const { data, error } = await supabase
    .from('incomes')
    .insert([income])
    .select('*')
    .single()
  return { data: data as Income | null, error }
}

export async function deleteExpense(id: string) {
  const { data, error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
  return { data, error }
}

export async function deleteIncome(id: string) {
  const { data, error } = await supabase
    .from('incomes')
    .delete()
    .eq('id', id)
  return { data, error }
}
