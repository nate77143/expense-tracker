import { supabase } from '../lib/supabase'
import type {
  Account,
  AccountAdjustment,
  BudgetAuditLog,
  CreditCard,
  Expense,
  Income,
  RecurringRule,
  Transfer
} from '../types'

type AccountRow = {
  id: string
  tracker_id: string
  name: string
  account_type: Account['accountType']
  account_group: Account['accountGroup']
  institution?: string | null
  currency_code?: string | null
  is_active?: boolean | null
  sort_order?: number | null
  created_at?: string | null
  created_by_name?: string | null
  created_by_user_id?: string | null
  created_by_email?: string | null
}

type IncomeRow = {
  id: string
  tracker_id?: string
  source_recurring_rule_id?: string | null
  source_recurring_run_date?: string | null
  created_by_name?: string | null
  created_by_user_id?: string | null
  created_by_email?: string | null
  date: string
  amount: number
  remarks: string
  source?: string | null
  to_account_id?: string | null
}

type ExpenseRow = {
  id: string
  tracker_id?: string
  source_recurring_rule_id?: string | null
  source_recurring_run_date?: string | null
  created_by_name?: string | null
  created_by_user_id?: string | null
  created_by_email?: string | null
  date: string
  category: string
  merchant?: string | null
  amount: number
  remarks: string
  from_account_id?: string | null
}

type TransferRow = {
  id: string
  tracker_id: string
  source_recurring_rule_id?: string | null
  source_recurring_run_date?: string | null
  date: string
  from_account_id: string
  to_account_id: string
  amount: number
  transfer_type?: Transfer['transferType'] | null
  remarks?: string | null
  created_by_name?: string | null
  created_by_user_id?: string | null
  created_by_email?: string | null
  created_at?: string | null
}

type AccountAdjustmentRow = {
  id: string
  tracker_id: string
  source_recurring_rule_id?: string | null
  source_recurring_run_date?: string | null
  account_id: string
  date: string
  amount: number
  reason: AccountAdjustment['reason']
  remarks?: string | null
  created_by_name?: string | null
  created_by_user_id?: string | null
  created_by_email?: string | null
  created_at?: string | null
}

type CreditCardRow = {
  id: string
  tracker_id: string
  account_id: string
  name: string
  issuer?: string | null
  limit_amount: number
  statement_day: number
  due_day: number
  created_at?: string | null
}

type RecurringRuleRow = {
  id: string
  tracker_id: string
  rule_type: RecurringRule['ruleType']
  frequency: RecurringRule['frequency']
  interval_count: number
  start_date: string
  next_run_date: string
  end_date?: string | null
  is_active?: boolean | null
  amount: number
  description?: string | null
  remarks?: string | null
  income_source?: string | null
  income_to_account_id?: string | null
  expense_category?: string | null
  expense_merchant?: string | null
  expense_from_account_id?: string | null
  transfer_from_account_id?: string | null
  transfer_to_account_id?: string | null
  created_at?: string | null
}

type AuditLogRow = {
  id: string
  tracker_id: string
  entity_type: BudgetAuditLog['entityType']
  record_id: string
  action: BudgetAuditLog['action']
  actor_name?: string | null
  actor_user_id?: string | null
  actor_email?: string | null
  old_data?: Record<string, unknown> | null
  new_data?: Record<string, unknown> | null
  occurred_at: string
}

const mapAccount = (row: AccountRow): Account => ({
  id: row.id,
  trackerId: row.tracker_id,
  name: row.name,
  accountType: row.account_type,
  accountGroup: row.account_group,
  institution: row.institution ?? '',
  currencyCode: row.currency_code ?? 'PHP',
  isActive: row.is_active ?? true,
  sortOrder: row.sort_order ?? 0,
  createdAt: row.created_at ?? new Date().toISOString(),
  createdByName: row.created_by_name ?? null,
  createdByUserId: row.created_by_user_id ?? null,
  createdByEmail: row.created_by_email ?? null
})

const mapIncome = (row: IncomeRow): Income => ({
  id: row.id,
  trackerId: row.tracker_id ?? '',
  sourceRecurringRuleId: row.source_recurring_rule_id ?? null,
  sourceRecurringRunDate: row.source_recurring_run_date ?? null,
  createdByName: row.created_by_name ?? null,
  createdByUserId: row.created_by_user_id ?? null,
  createdByEmail: row.created_by_email ?? null,
  date: row.date,
  amount: row.amount,
  remarks: row.remarks,
  source: row.source ?? undefined,
  toAccountId: row.to_account_id ?? ''
})

const mapExpense = (row: ExpenseRow): Expense => ({
  id: row.id,
  trackerId: row.tracker_id ?? '',
  sourceRecurringRuleId: row.source_recurring_rule_id ?? null,
  sourceRecurringRunDate: row.source_recurring_run_date ?? null,
  createdByName: row.created_by_name ?? null,
  createdByUserId: row.created_by_user_id ?? null,
  createdByEmail: row.created_by_email ?? null,
  date: row.date,
  category: row.category,
  merchant: row.merchant ?? undefined,
  fromAccountId: row.from_account_id ?? '',
  amount: row.amount,
  remarks: row.remarks
})

const mapTransfer = (row: TransferRow): Transfer => ({
  id: row.id,
  trackerId: row.tracker_id,
  sourceRecurringRuleId: row.source_recurring_rule_id ?? null,
  sourceRecurringRunDate: row.source_recurring_run_date ?? null,
  createdByName: row.created_by_name ?? null,
  createdByUserId: row.created_by_user_id ?? null,
  createdByEmail: row.created_by_email ?? null,
  date: row.date,
  fromAccountId: row.from_account_id,
  toAccountId: row.to_account_id,
  amount: row.amount,
  transferType: row.transfer_type ?? 'general',
  remarks: row.remarks ?? ''
})

const mapAccountAdjustment = (row: AccountAdjustmentRow): AccountAdjustment => ({
  id: row.id,
  trackerId: row.tracker_id,
  sourceRecurringRuleId: row.source_recurring_rule_id ?? null,
  sourceRecurringRunDate: row.source_recurring_run_date ?? null,
  createdByName: row.created_by_name ?? null,
  createdByUserId: row.created_by_user_id ?? null,
  createdByEmail: row.created_by_email ?? null,
  accountId: row.account_id,
  date: row.date,
  amount: row.amount,
  reason: row.reason,
  remarks: row.remarks ?? ''
})

const mapCreditCard = (row: CreditCardRow): CreditCard => ({
  id: row.id,
  trackerId: row.tracker_id,
  accountId: row.account_id,
  name: row.name,
  issuer: row.issuer ?? '',
  limitAmount: row.limit_amount,
  statementDay: row.statement_day,
  dueDay: row.due_day,
  createdAt: row.created_at ?? new Date().toISOString()
})

const mapRecurringRule = (row: RecurringRuleRow): RecurringRule => ({
  id: row.id,
  trackerId: row.tracker_id,
  ruleType: row.rule_type,
  frequency: row.frequency,
  intervalCount: row.interval_count,
  startDate: row.start_date,
  nextRunDate: row.next_run_date,
  endDate: row.end_date ?? undefined,
  isActive: row.is_active ?? true,
  amount: row.amount,
  description: row.description ?? '',
  remarks: row.remarks ?? undefined,
  incomeSource: row.income_source ?? undefined,
  incomeToAccountId: row.income_to_account_id ?? undefined,
  expenseCategory: row.expense_category ?? undefined,
  expenseMerchant: row.expense_merchant ?? undefined,
  expenseFromAccountId: row.expense_from_account_id ?? undefined,
  transferFromAccountId: row.transfer_from_account_id ?? undefined,
  transferToAccountId: row.transfer_to_account_id ?? undefined,
  createdAt: row.created_at ?? new Date().toISOString()
})

const mapAuditLog = (row: AuditLogRow): BudgetAuditLog => ({
  id: row.id,
  trackerId: row.tracker_id,
  entityType: row.entity_type,
  recordId: row.record_id,
  action: row.action,
  actorName: row.actor_name ?? null,
  actorUserId: row.actor_user_id ?? null,
  actorEmail: row.actor_email ?? null,
  oldData: row.old_data ?? null,
  newData: row.new_data ?? null,
  occurredAt: row.occurred_at
})

export async function fetchAccounts(trackerId: string) {
  const { data, error } = await supabase.from('accounts').select('*').eq('tracker_id', trackerId).order('sort_order', { ascending: true })
  return { data: ((data as AccountRow[] | null) ?? []).map(mapAccount), error }
}

export async function fetchIncomes(trackerId: string) {
  const { data, error } = await supabase.from('incomes').select('*').eq('tracker_id', trackerId).not('to_account_id', 'is', null).order('date', { ascending: false })
  return { data: ((data as IncomeRow[] | null) ?? []).map(mapIncome), error }
}

export async function fetchExpenses(trackerId: string) {
  const { data, error } = await supabase.from('expenses').select('*').eq('tracker_id', trackerId).not('from_account_id', 'is', null).order('date', { ascending: false })
  return { data: ((data as ExpenseRow[] | null) ?? []).map(mapExpense), error }
}

export async function fetchTransfers(trackerId: string) {
  const { data, error } = await supabase.from('transfers').select('*').eq('tracker_id', trackerId).order('date', { ascending: false })
  return { data: ((data as TransferRow[] | null) ?? []).map(mapTransfer), error }
}

export async function fetchAccountAdjustments(trackerId: string) {
  const { data, error } = await supabase.from('account_adjustments').select('*').eq('tracker_id', trackerId).order('date', { ascending: false })
  return { data: ((data as AccountAdjustmentRow[] | null) ?? []).map(mapAccountAdjustment), error }
}

export async function fetchCreditCards(trackerId: string) {
  const { data, error } = await supabase.from('credit_cards').select('*').eq('tracker_id', trackerId).not('account_id', 'is', null).order('created_at', { ascending: true })
  return { data: ((data as CreditCardRow[] | null) ?? []).map(mapCreditCard), error }
}

export async function fetchRecurringRules(trackerId: string) {
  const { data, error } = await supabase.from('recurring_rules').select('*').eq('tracker_id', trackerId).order('next_run_date', { ascending: true })
  return { data: ((data as RecurringRuleRow[] | null) ?? []).map(mapRecurringRule), error }
}

export async function fetchAuditLogs(trackerId: string, limit = 20) {
  const { data, error } = await supabase
    .from('budget_audit_logs')
    .select('*')
    .eq('tracker_id', trackerId)
    .order('occurred_at', { ascending: false })
    .limit(limit)

  return { data: ((data as AuditLogRow[] | null) ?? []).map(mapAuditLog), error }
}

export async function insertAccount(account: Omit<Account, 'id' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('accounts')
    .insert([
      {
        tracker_id: account.trackerId,
        name: account.name,
        account_type: account.accountType,
        account_group: account.accountGroup,
        institution: account.institution,
        currency_code: account.currencyCode,
        is_active: account.isActive,
        sort_order: account.sortOrder,
        created_by_name: account.createdByName,
        created_by_user_id: account.createdByUserId,
        created_by_email: account.createdByEmail
      }
    ])
    .select('*')
    .single()

  return { data: data ? mapAccount(data as AccountRow) : null, error }
}

export async function createAccountWithOpeningBalance(payload: Omit<Account, 'id' | 'createdAt'> & { openingBalance: number; openingBalanceDate?: string; openingBalanceRemarks?: string }) {
  const { data, error } = await supabase.rpc('create_account_with_opening_balance', {
    p_tracker_id: payload.trackerId,
    p_name: payload.name,
    p_account_type: payload.accountType,
    p_account_group: payload.accountGroup,
    p_institution: payload.institution,
    p_currency_code: payload.currencyCode,
    p_is_active: payload.isActive,
    p_sort_order: payload.sortOrder,
    p_opening_balance: payload.openingBalance,
    p_opening_balance_date: payload.openingBalanceDate ?? new Date().toISOString().split('T')[0],
    p_opening_balance_remarks: payload.openingBalanceRemarks ?? 'Opening balance'
  })

  return { data: data ? mapAccount(data as AccountRow) : null, error }
}

export async function insertIncome(income: Omit<Income, 'id'>) {
  const { data, error } = await supabase.rpc('record_income', {
    p_tracker_id: income.trackerId,
    p_date: income.date,
    p_amount: income.amount,
    p_source: income.source ?? null,
    p_remarks: income.remarks,
    p_to_account_id: income.toAccountId,
    p_source_recurring_rule_id: income.sourceRecurringRuleId ?? null,
    p_source_recurring_run_date: income.sourceRecurringRunDate ?? null
  })

  return { data: data ? mapIncome(data as IncomeRow) : null, error }
}

export async function insertExpense(expense: Omit<Expense, 'id'>) {
  const { data, error } = await supabase.rpc('record_expense', {
    p_tracker_id: expense.trackerId,
    p_date: expense.date,
    p_amount: expense.amount,
    p_category: expense.category,
    p_merchant: expense.merchant ?? null,
    p_remarks: expense.remarks,
    p_from_account_id: expense.fromAccountId,
    p_source_recurring_rule_id: expense.sourceRecurringRuleId ?? null,
    p_source_recurring_run_date: expense.sourceRecurringRunDate ?? null
  })

  return { data: data ? mapExpense(data as ExpenseRow) : null, error }
}

export async function insertTransfer(transfer: Omit<Transfer, 'id'>) {
  const { data, error } = await supabase.rpc('record_transfer', {
    p_tracker_id: transfer.trackerId,
    p_date: transfer.date,
    p_amount: transfer.amount,
    p_from_account_id: transfer.fromAccountId,
    p_to_account_id: transfer.toAccountId,
    p_transfer_type: transfer.transferType,
    p_remarks: transfer.remarks,
    p_source_recurring_rule_id: transfer.sourceRecurringRuleId ?? null,
    p_source_recurring_run_date: transfer.sourceRecurringRunDate ?? null
  })

  return { data: data ? mapTransfer(data as TransferRow) : null, error }
}

export async function insertAccountAdjustment(adjustment: Omit<AccountAdjustment, 'id'>) {
  const { data, error } = await supabase.rpc('record_account_adjustment', {
    p_tracker_id: adjustment.trackerId,
    p_account_id: adjustment.accountId,
    p_date: adjustment.date,
    p_amount: adjustment.amount,
    p_reason: adjustment.reason,
    p_remarks: adjustment.remarks,
    p_source_recurring_rule_id: adjustment.sourceRecurringRuleId ?? null,
    p_source_recurring_run_date: adjustment.sourceRecurringRunDate ?? null
  })

  return { data: data ? mapAccountAdjustment(data as AccountAdjustmentRow) : null, error }
}

export async function createCreditCardWithAccount(payload: {
  trackerId: string
  name: string
  issuer: string
  limitAmount: number
  statementDay: number
  dueDay: number
  openingBalance: number
}) {
  const { data, error } = await supabase.rpc('create_credit_card_with_account', {
    p_tracker_id: payload.trackerId,
    p_name: payload.name,
    p_issuer: payload.issuer,
    p_limit_amount: payload.limitAmount,
    p_statement_day: payload.statementDay,
    p_due_day: payload.dueDay,
    p_opening_balance: payload.openingBalance
  })

  return { data: data ? mapCreditCard(data as CreditCardRow) : null, error }
}

export async function insertRecurringRule(rule: Omit<RecurringRule, 'id' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('recurring_rules')
    .insert([
      {
        tracker_id: rule.trackerId,
        rule_type: rule.ruleType,
        frequency: rule.frequency,
        interval_count: rule.intervalCount,
        start_date: rule.startDate,
        next_run_date: rule.nextRunDate,
        end_date: rule.endDate,
        is_active: rule.isActive,
        amount: rule.amount,
        description: rule.description,
        remarks: rule.remarks,
        income_source: rule.incomeSource,
        income_to_account_id: rule.incomeToAccountId,
        expense_category: rule.expenseCategory,
        expense_merchant: rule.expenseMerchant,
        expense_from_account_id: rule.expenseFromAccountId,
        transfer_from_account_id: rule.transferFromAccountId,
        transfer_to_account_id: rule.transferToAccountId
      }
    ])
    .select('*')
    .single()

  return { data: data ? mapRecurringRule(data as RecurringRuleRow) : null, error }
}

export async function updateRecurringRule(id: string, updates: Partial<RecurringRule>) {
  const payload: Record<string, unknown> = {}

  if (updates.ruleType !== undefined) payload.rule_type = updates.ruleType
  if (updates.frequency !== undefined) payload.frequency = updates.frequency
  if (updates.intervalCount !== undefined) payload.interval_count = updates.intervalCount
  if (updates.startDate !== undefined) payload.start_date = updates.startDate
  if (updates.nextRunDate !== undefined) payload.next_run_date = updates.nextRunDate
  if (updates.endDate !== undefined) payload.end_date = updates.endDate
  if (updates.isActive !== undefined) payload.is_active = updates.isActive
  if (updates.amount !== undefined) payload.amount = updates.amount
  if (updates.description !== undefined) payload.description = updates.description
  if (updates.remarks !== undefined) payload.remarks = updates.remarks
  if (updates.incomeSource !== undefined) payload.income_source = updates.incomeSource
  if (updates.incomeToAccountId !== undefined) payload.income_to_account_id = updates.incomeToAccountId
  if (updates.expenseCategory !== undefined) payload.expense_category = updates.expenseCategory
  if (updates.expenseMerchant !== undefined) payload.expense_merchant = updates.expenseMerchant
  if (updates.expenseFromAccountId !== undefined) payload.expense_from_account_id = updates.expenseFromAccountId
  if (updates.transferFromAccountId !== undefined) payload.transfer_from_account_id = updates.transferFromAccountId
  if (updates.transferToAccountId !== undefined) payload.transfer_to_account_id = updates.transferToAccountId

  const { data, error } = await supabase.from('recurring_rules').update(payload).eq('id', id).select('*').single()
  return { data: data ? mapRecurringRule(data as RecurringRuleRow) : null, error }
}

export async function deleteAccount(id: string) {
  const { data, error } = await supabase.from('accounts').delete().eq('id', id)
  return { data, error }
}

export async function deleteIncome(id: string) {
  const { data, error } = await supabase.from('incomes').delete().eq('id', id)
  return { data, error }
}

export async function deleteExpense(id: string) {
  const { data, error } = await supabase.from('expenses').delete().eq('id', id)
  return { data, error }
}

export async function deleteTransfer(id: string) {
  const { data, error } = await supabase.from('transfers').delete().eq('id', id)
  return { data, error }
}

export async function deleteAccountAdjustment(id: string) {
  const { data, error } = await supabase.from('account_adjustments').delete().eq('id', id)
  return { data, error }
}

export async function deleteCreditCardWithAccount(id: string) {
  const { data, error } = await supabase.rpc('delete_credit_card_with_account', {
    target_credit_card_id: id
  })

  return { data, error }
}

export async function deleteRecurringRule(id: string) {
  const { data, error } = await supabase.from('recurring_rules').delete().eq('id', id)
  return { data, error }
}
