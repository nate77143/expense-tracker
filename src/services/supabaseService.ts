import { supabase } from '../lib/supabase'
import type {
  BudgetAuditLog,
  CreditCard,
  CreditCardTransaction,
  Expense,
  Income,
  RecurringTransaction,
  Saving
} from '../types'

type ExpenseRow = {
  id: string
  tracker_id?: string
  date: string
  category: string
  payment_source?: 'income' | 'savings' | 'credit_card' | null
  payment_source_bank?: string | null
  payment_source_card_id?: string | null
  target_savings_bank?: string | null
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
  source_expense_id?: string | null
  source_credit_card_transaction_id?: string | null
}

type CreditCardRow = {
  id: string
  tracker_id: string
  name: string
  issuer?: string | null
  limit_amount: number
  statement_day: number
  due_day: number
  created_at?: string | null
}

type CreditCardTransactionRow = {
  id: string
  tracker_id: string
  credit_card_id: string
  expense_id?: string | null
  date: string
  type: CreditCardTransaction['type']
  amount: number
  merchant?: string | null
  category?: string | null
  payment_source?: CreditCardTransaction['paymentSource'] | null
  payment_source_bank?: string | null
  remarks?: string | null
  created_at?: string | null
}

type RecurringTransactionRow = {
  id: string
  tracker_id: string
  type: RecurringTransaction['type']
  frequency: RecurringTransaction['frequency']
  interval_count: number
  start_date: string
  next_run_date: string
  end_date?: string | null
  is_active?: boolean | null
  amount: number
  description?: string | null
  remarks?: string | null
  expense_category?: string | null
  expense_funding_source?: RecurringTransaction['expenseFundingSource'] | null
  expense_funding_source_bank?: string | null
  expense_target_savings_bank?: string | null
  income_source?: string | null
  savings_bank?: string | null
  credit_card_id?: string | null
  merchant?: string | null
  created_at?: string | null
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
  fundingSource:
    row.payment_source === 'savings' ? 'savings' : row.payment_source === 'credit_card' ? 'credit_card' : 'income',
  fundingSourceBank: row.payment_source_bank ?? undefined,
  fundingSourceCardId: row.payment_source_card_id ?? undefined,
  targetSavingsBank: row.target_savings_bank ?? undefined,
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
  date: row.date,
  sourceExpenseId: row.source_expense_id ?? null,
  sourceCreditCardTransactionId: row.source_credit_card_transaction_id ?? null
})

const mapCreditCard = (row: CreditCardRow): CreditCard => ({
  id: row.id,
  trackerId: row.tracker_id,
  name: row.name,
  issuer: row.issuer ?? '',
  limitAmount: row.limit_amount,
  statementDay: row.statement_day,
  dueDay: row.due_day,
  createdAt: row.created_at ?? new Date().toISOString()
})

const mapCreditCardTransaction = (row: CreditCardTransactionRow): CreditCardTransaction => ({
  id: row.id,
  trackerId: row.tracker_id,
  creditCardId: row.credit_card_id,
  expenseId: row.expense_id ?? null,
  date: row.date,
  type: row.type,
  amount: row.amount,
  merchant: row.merchant ?? undefined,
  category: row.category ?? undefined,
  paymentSource: row.payment_source ?? undefined,
  paymentSourceBank: row.payment_source_bank ?? undefined,
  remarks: row.remarks ?? undefined,
  createdAt: row.created_at ?? new Date().toISOString()
})

const mapRecurringTransaction = (row: RecurringTransactionRow): RecurringTransaction => ({
  id: row.id,
  trackerId: row.tracker_id,
  type: row.type,
  frequency: row.frequency,
  intervalCount: row.interval_count,
  startDate: row.start_date,
  nextRunDate: row.next_run_date,
  endDate: row.end_date ?? undefined,
  isActive: row.is_active ?? true,
  amount: row.amount,
  description: row.description ?? '',
  remarks: row.remarks ?? undefined,
  expenseCategory: row.expense_category ?? undefined,
  expenseFundingSource: row.expense_funding_source ?? undefined,
  expenseFundingSourceBank: row.expense_funding_source_bank ?? undefined,
  expenseTargetSavingsBank: row.expense_target_savings_bank ?? undefined,
  incomeSource: row.income_source ?? undefined,
  savingsBank: row.savings_bank ?? undefined,
  creditCardId: row.credit_card_id ?? undefined,
  merchant: row.merchant ?? undefined,
  createdAt: row.created_at ?? new Date().toISOString()
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

export async function fetchCreditCards(trackerId: string) {
  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('tracker_id', trackerId)
    .order('created_at', { ascending: true })

  return { data: (data as CreditCardRow[] | null)?.map(mapCreditCard) ?? null, error }
}

export async function fetchCreditCardTransactions(trackerId: string) {
  const { data, error } = await supabase
    .from('credit_card_transactions')
    .select('*')
    .eq('tracker_id', trackerId)
    .order('date', { ascending: false })

  return { data: (data as CreditCardTransactionRow[] | null)?.map(mapCreditCardTransaction) ?? null, error }
}

export async function fetchRecurringTransactions(trackerId: string) {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('tracker_id', trackerId)
    .order('next_run_date', { ascending: true })

  return { data: (data as RecurringTransactionRow[] | null)?.map(mapRecurringTransaction) ?? null, error }
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
  const payload: Record<string, unknown> = {
    tracker_id: expense.trackerId,
    date: expense.date,
    category: expense.category,
    payment_source: expense.fundingSource,
    amount: expense.amount,
    remarks: expense.remarks
  }

  if (expense.fundingSource === 'savings' && expense.fundingSourceBank) {
    payload.payment_source_bank = expense.fundingSourceBank
  }

  if (expense.fundingSource === 'credit_card' && expense.fundingSourceCardId) {
    payload.payment_source_card_id = expense.fundingSourceCardId
  }

  if (expense.targetSavingsBank) {
    payload.target_savings_bank = expense.targetSavingsBank
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert([payload])
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
        remarks: saving.remarks,
        source_expense_id: saving.sourceExpenseId,
        source_credit_card_transaction_id: saving.sourceCreditCardTransactionId
      }
    ])
    .select('*')
    .single()

  return { data: data ? mapSaving(data as SavingRow) : null, error }
}

export async function insertCreditCard(card: Omit<CreditCard, 'id' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('credit_cards')
    .insert([
      {
        tracker_id: card.trackerId,
        name: card.name,
        issuer: card.issuer,
        limit_amount: card.limitAmount,
        statement_day: card.statementDay,
        due_day: card.dueDay
      }
    ])
    .select('*')
    .single()

  return { data: data ? mapCreditCard(data as CreditCardRow) : null, error }
}

export async function insertCreditCardTransaction(transaction: Omit<CreditCardTransaction, 'id' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('credit_card_transactions')
    .insert([
      {
        tracker_id: transaction.trackerId,
        credit_card_id: transaction.creditCardId,
        expense_id: transaction.expenseId,
        date: transaction.date,
        type: transaction.type,
        amount: transaction.amount,
        merchant: transaction.merchant,
        category: transaction.category,
        payment_source: transaction.paymentSource,
        payment_source_bank: transaction.paymentSourceBank,
        remarks: transaction.remarks
      }
    ])
    .select('*')
    .single()

  return { data: data ? mapCreditCardTransaction(data as CreditCardTransactionRow) : null, error }
}

export async function insertRecurringTransaction(transaction: Omit<RecurringTransaction, 'id' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .insert([
      {
        tracker_id: transaction.trackerId,
        type: transaction.type,
        frequency: transaction.frequency,
        interval_count: transaction.intervalCount,
        start_date: transaction.startDate,
        next_run_date: transaction.nextRunDate,
        end_date: transaction.endDate,
        is_active: transaction.isActive,
        amount: transaction.amount,
        description: transaction.description,
        remarks: transaction.remarks,
        expense_category: transaction.expenseCategory,
        expense_funding_source: transaction.expenseFundingSource,
        expense_funding_source_bank: transaction.expenseFundingSourceBank,
        expense_target_savings_bank: transaction.expenseTargetSavingsBank,
        income_source: transaction.incomeSource,
        savings_bank: transaction.savingsBank,
        credit_card_id: transaction.creditCardId,
        merchant: transaction.merchant
      }
    ])
    .select('*')
    .single()

  return { data: data ? mapRecurringTransaction(data as RecurringTransactionRow) : null, error }
}

export async function updateRecurringTransaction(id: string, updates: Partial<RecurringTransaction>) {
  const payload: Record<string, unknown> = {}

  if (updates.type !== undefined) payload.type = updates.type
  if (updates.frequency !== undefined) payload.frequency = updates.frequency
  if (updates.intervalCount !== undefined) payload.interval_count = updates.intervalCount
  if (updates.startDate !== undefined) payload.start_date = updates.startDate
  if (updates.nextRunDate !== undefined) payload.next_run_date = updates.nextRunDate
  if (updates.endDate !== undefined) payload.end_date = updates.endDate
  if (updates.isActive !== undefined) payload.is_active = updates.isActive
  if (updates.amount !== undefined) payload.amount = updates.amount
  if (updates.description !== undefined) payload.description = updates.description
  if (updates.remarks !== undefined) payload.remarks = updates.remarks
  if (updates.expenseCategory !== undefined) payload.expense_category = updates.expenseCategory
  if (updates.expenseFundingSource !== undefined) payload.expense_funding_source = updates.expenseFundingSource
  if (updates.expenseFundingSourceBank !== undefined) payload.expense_funding_source_bank = updates.expenseFundingSourceBank
  if (updates.expenseTargetSavingsBank !== undefined) payload.expense_target_savings_bank = updates.expenseTargetSavingsBank
  if (updates.incomeSource !== undefined) payload.income_source = updates.incomeSource
  if (updates.savingsBank !== undefined) payload.savings_bank = updates.savingsBank
  if (updates.creditCardId !== undefined) payload.credit_card_id = updates.creditCardId
  if (updates.merchant !== undefined) payload.merchant = updates.merchant

  const { data, error } = await supabase
    .from('recurring_transactions')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  return { data: data ? mapRecurringTransaction(data as RecurringTransactionRow) : null, error }
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

export async function deleteCreditCard(id: string) {
  const { data, error } = await supabase.from('credit_cards').delete().eq('id', id)
  return { data, error }
}

export async function deleteCreditCardTransaction(id: string) {
  const { data, error } = await supabase.from('credit_card_transactions').delete().eq('id', id)
  return { data, error }
}

export async function deleteCreditCardTransactionsByExpenseId(expenseId: string) {
  const { data, error } = await supabase.from('credit_card_transactions').delete().eq('expense_id', expenseId)
  return { data, error }
}

export async function deleteRecurringTransaction(id: string) {
  const { data, error } = await supabase.from('recurring_transactions').delete().eq('id', id)
  return { data, error }
}
