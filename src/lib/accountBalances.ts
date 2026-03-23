import type { Account, AccountAdjustment, CreditCard, Expense, Income, Transfer } from '../types'

export const buildAccountBalanceMap = (
  accounts: Account[],
  incomes: Income[],
  expenses: Expense[],
  transfers: Transfer[],
  adjustments: AccountAdjustment[]
) => {
  const balances = accounts.reduce<Record<string, number>>((acc, account) => {
    acc[account.id] = 0
    return acc
  }, {})

  for (const income of incomes) {
    balances[income.toAccountId] = (balances[income.toAccountId] ?? 0) + income.amount
  }

  for (const expense of expenses) {
    balances[expense.fromAccountId] = (balances[expense.fromAccountId] ?? 0) - expense.amount
  }

  for (const transfer of transfers) {
    balances[transfer.fromAccountId] = (balances[transfer.fromAccountId] ?? 0) - transfer.amount
    balances[transfer.toAccountId] = (balances[transfer.toAccountId] ?? 0) + transfer.amount
  }

  for (const adjustment of adjustments) {
    balances[adjustment.accountId] = (balances[adjustment.accountId] ?? 0) + adjustment.amount
  }

  return balances
}

export const getAccountBalance = (balanceMap: Record<string, number>, accountId: string) => balanceMap[accountId] ?? 0

export const getAssetTotal = (accounts: Account[], balanceMap: Record<string, number>) => {
  return accounts
    .filter(account => account.accountGroup === 'asset' && account.isActive)
    .reduce((sum, account) => sum + getAccountBalance(balanceMap, account.id), 0)
}

export const getLiabilityTotal = (accounts: Account[], balanceMap: Record<string, number>) => {
  return accounts
    .filter(account => account.accountGroup === 'liability' && account.isActive)
    .reduce((sum, account) => sum + Math.abs(Math.min(getAccountBalance(balanceMap, account.id), 0)), 0)
}

export const getNetPosition = (accounts: Account[], balanceMap: Record<string, number>) => {
  return accounts.filter(account => account.isActive).reduce((sum, account) => sum + getAccountBalance(balanceMap, account.id), 0)
}

export const getCreditCardOutstandingBalance = (
  creditCard: CreditCard | undefined,
  balanceMap: Record<string, number>
) => {
  if (!creditCard) {
    return 0
  }

  return Math.abs(Math.min(getAccountBalance(balanceMap, creditCard.accountId), 0))
}

export const getCreditCardAvailableCredit = (
  creditCard: CreditCard | undefined,
  balanceMap: Record<string, number>
) => {
  if (!creditCard) {
    return 0
  }

  return creditCard.limitAmount - getCreditCardOutstandingBalance(creditCard, balanceMap)
}

export const getDisplayBalance = (account: Account, balance: number) => {
  return account.accountGroup === 'liability' ? Math.abs(Math.min(balance, 0)) : balance
}

export const sortAccountsForDisplay = (accounts: Account[], balanceMap: Record<string, number>) => {
  return accounts
    .slice()
    .sort((left, right) => {
      const bySort = left.sortOrder - right.sortOrder
      if (bySort !== 0) {
        return bySort
      }

      const byGroup = left.accountGroup.localeCompare(right.accountGroup)
      if (byGroup !== 0) {
        return byGroup
      }

      const byBalance = Math.abs(getAccountBalance(balanceMap, right.id)) - Math.abs(getAccountBalance(balanceMap, left.id))
      if (byBalance !== 0) {
        return byBalance
      }

      return left.name.localeCompare(right.name)
    })
}
