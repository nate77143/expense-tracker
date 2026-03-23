import type { Saving } from '../types'

export const normalizeSavingsBankName = (value: string) => {
  return value.trim().toLowerCase()
}

const toDisplayName = (value: string) => {
  const trimmed = value.trim()
  return trimmed || 'Unassigned'
}

export type SavingsBankSummary = {
  key: string
  name: string
  balance: number
  entries: number
}

export const buildSavingsBankSummaries = (savings: Saving[]): SavingsBankSummary[] => {
  const grouped = savings.reduce<Record<string, SavingsBankSummary>>((acc, saving) => {
    const displayName = toDisplayName(saving.bank)
    const key = normalizeSavingsBankName(displayName) || 'unassigned'

    acc[key] = acc[key] ?? {
      key,
      name: displayName,
      balance: 0,
      entries: 0
    }

    acc[key].balance += saving.amount
    acc[key].entries += 1
    return acc
  }, {})

  return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name))
}

export const buildSavingsBankBalanceMap = (savings: Saving[]) => {
  return buildSavingsBankSummaries(savings).reduce<Record<string, number>>((balances, bank) => {
    balances[bank.name] = bank.balance
    return balances
  }, {})
}

export const findSavingsBankDisplayName = (savings: Saving[], input: string) => {
  const normalizedInput = normalizeSavingsBankName(input)
  return (
    buildSavingsBankSummaries(savings).find(bank => bank.key === normalizedInput)?.name ??
    toDisplayName(input)
  )
}
