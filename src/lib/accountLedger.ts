import type { Account, AccountAdjustment, Expense, Income, Transfer } from '../types'

export type AccountLedgerRow = {
  id: string
  date: string
  type: 'income' | 'expense' | 'transfer_in' | 'transfer_out' | 'adjustment'
  label: string
  counterparty?: string
  inflow: number
  outflow: number
  delta: number
  runningBalance: number
  remarks: string
  createdByName?: string | null
  createdByUserId?: string | null
  createdByEmail?: string | null
}

export const buildAccountLedger = (
  accountId: string,
  accounts: Account[],
  incomes: Income[],
  expenses: Expense[],
  transfers: Transfer[],
  adjustments: AccountAdjustment[]
): AccountLedgerRow[] => {
  const accountNameMap = accounts.reduce<Record<string, string>>((acc, account) => {
    acc[account.id] = account.name
    return acc
  }, {})

  const rows: AccountLedgerRow[] = [
    ...incomes
      .filter(income => income.toAccountId === accountId)
      .map(income => ({
        id: `income-${income.id}`,
        date: income.date,
        type: 'income' as const,
        label: income.source?.trim() || 'Income',
        inflow: income.amount,
        outflow: 0,
        delta: income.amount,
        runningBalance: 0,
        remarks: income.remarks,
        createdByName: income.createdByName,
        createdByUserId: income.createdByUserId,
        createdByEmail: income.createdByEmail
      })),
    ...expenses
      .filter(expense => expense.fromAccountId === accountId)
      .map(expense => ({
        id: `expense-${expense.id}`,
        date: expense.date,
        type: 'expense' as const,
        label: expense.category,
        counterparty: expense.merchant,
        inflow: 0,
        outflow: expense.amount,
        delta: -expense.amount,
        runningBalance: 0,
        remarks: expense.remarks,
        createdByName: expense.createdByName,
        createdByUserId: expense.createdByUserId,
        createdByEmail: expense.createdByEmail
      })),
    ...transfers
      .filter(transfer => transfer.fromAccountId === accountId || transfer.toAccountId === accountId)
      .map(transfer => {
        const isIncoming = transfer.toAccountId === accountId
        const counterpartyId = isIncoming ? transfer.fromAccountId : transfer.toAccountId
        return {
          id: `transfer-${transfer.id}-${isIncoming ? 'in' : 'out'}`,
          date: transfer.date,
          type: isIncoming ? ('transfer_in' as const) : ('transfer_out' as const),
          label: transfer.transferType.replace(/_/g, ' '),
          counterparty: accountNameMap[counterpartyId] ?? 'Other account',
          inflow: isIncoming ? transfer.amount : 0,
          outflow: isIncoming ? 0 : transfer.amount,
          delta: isIncoming ? transfer.amount : -transfer.amount,
          runningBalance: 0,
          remarks: transfer.remarks,
          createdByName: transfer.createdByName,
          createdByUserId: transfer.createdByUserId,
          createdByEmail: transfer.createdByEmail
        }
      }),
    ...adjustments
      .filter(adjustment => adjustment.accountId === accountId)
      .map(adjustment => ({
        id: `adjustment-${adjustment.id}`,
        date: adjustment.date,
        type: 'adjustment' as const,
        label: adjustment.reason.replace(/_/g, ' '),
        inflow: adjustment.amount > 0 ? adjustment.amount : 0,
        outflow: adjustment.amount < 0 ? Math.abs(adjustment.amount) : 0,
        delta: adjustment.amount,
        runningBalance: 0,
        remarks: adjustment.remarks,
        createdByName: adjustment.createdByName,
        createdByUserId: adjustment.createdByUserId,
        createdByEmail: adjustment.createdByEmail
      }))
  ]

  rows.sort((left, right) => {
    const byDate = left.date.localeCompare(right.date)
    if (byDate !== 0) {
      return byDate
    }

    return left.id.localeCompare(right.id)
  })

  let runningBalance = 0
  return rows.map(row => {
    runningBalance += row.delta
    return {
      ...row,
      runningBalance
    }
  })
}
