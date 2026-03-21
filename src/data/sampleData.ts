import type { Expense, Income, Saving, Tracker, TrackerMember } from '../types'

const today = new Date()
const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

type SampleWorkspace = {
  trackers: Tracker[]
  trackerMembers: TrackerMember[]
  expenses: Expense[]
  incomes: Income[]
  savings: Saving[]
}

export const buildSampleWorkspace = (userId: string, email: string): SampleWorkspace => {
  const personalTrackerId = 'tracker-personal'
  const familyTrackerId = 'tracker-family'

  const trackers: Tracker[] = [
    {
      id: personalTrackerId,
      name: 'Personal Budget',
      description: 'Your own day-to-day expense tracker.',
      createdAt: weekAgo.toISOString(),
      isPersonal: true
    },
    {
      id: familyTrackerId,
      name: 'Family Budget',
      description: 'A shared tracker for household spending and savings.',
      createdAt: yesterday.toISOString()
    }
  ]

  const trackerMembers: TrackerMember[] = [
    {
      id: 'member-1',
      trackerId: personalTrackerId,
      userId,
      email,
      role: 'owner',
      status: 'active',
      joinedAt: weekAgo.toISOString()
    },
    {
      id: 'member-2',
      trackerId: familyTrackerId,
      userId,
      email,
      role: 'owner',
      status: 'active',
      joinedAt: yesterday.toISOString()
    },
    {
      id: 'member-3',
      trackerId: familyTrackerId,
      userId: null,
      email: 'family@example.com',
      role: 'member',
      status: 'active',
      joinedAt: yesterday.toISOString()
    }
  ]

  const expenses: Expense[] = [
    {
      id: 'expense-1',
      trackerId: personalTrackerId,
      date: today.toISOString().split('T')[0],
      category: 'Food',
      amount: 45.5,
      remarks: 'Grocery shopping'
    },
    {
      id: 'expense-2',
      trackerId: personalTrackerId,
      date: yesterday.toISOString().split('T')[0],
      category: 'Car',
      amount: 60,
      remarks: 'Gas'
    },
    {
      id: 'expense-3',
      trackerId: personalTrackerId,
      date: twoDaysAgo.toISOString().split('T')[0],
      category: 'House',
      amount: 150,
      remarks: 'Electricity bill'
    },
    {
      id: 'expense-4',
      trackerId: familyTrackerId,
      date: today.toISOString().split('T')[0],
      category: 'Food',
      amount: 120,
      remarks: 'Weekly supermarket restock'
    },
    {
      id: 'expense-5',
      trackerId: familyTrackerId,
      date: yesterday.toISOString().split('T')[0],
      category: 'House',
      amount: 980,
      remarks: 'Water and internet bill'
    },
    {
      id: 'expense-6',
      trackerId: familyTrackerId,
      date: weekAgo.toISOString().split('T')[0],
      category: 'Savings',
      amount: 300,
      remarks: 'House emergency fund transfer'
    }
  ]

  const incomes: Income[] = [
    {
      id: 'income-1',
      trackerId: personalTrackerId,
      date: today.toISOString().split('T')[0],
      amount: 2500,
      remarks: 'Monthly salary',
      source: 'Salary'
    },
    {
      id: 'income-2',
      trackerId: personalTrackerId,
      date: weekAgo.toISOString().split('T')[0],
      amount: 150,
      remarks: 'Freelance project',
      source: 'Freelance'
    },
    {
      id: 'income-3',
      trackerId: familyTrackerId,
      date: today.toISOString().split('T')[0],
      amount: 3200,
      remarks: 'Combined monthly household funding',
      source: 'Household'
    }
  ]

  const savings: Saving[] = [
    {
      id: 'saving-1',
      trackerId: personalTrackerId,
      bank: 'BPI',
      amount: 8500,
      remarks: 'Travel savings',
      date: yesterday.toISOString().split('T')[0]
    },
    {
      id: 'saving-2',
      trackerId: familyTrackerId,
      bank: 'BDO',
      amount: 15000,
      remarks: 'Emergency fund',
      date: weekAgo.toISOString().split('T')[0]
    }
  ]

  return {
    trackers,
    trackerMembers,
    expenses,
    incomes,
    savings
  }
}
