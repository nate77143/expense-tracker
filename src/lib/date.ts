const parseDateParts = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return { year, month, day }
}

const pad = (value: number) => String(value).padStart(2, '0')

export const toDateString = (date: Date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const addDaysToDateString = (value: string, days: number) => {
  const { year, month, day } = parseDateParts(value)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return toDateString(date)
}

export const addMonthsToDateString = (value: string, months: number) => {
  const { year, month, day } = parseDateParts(value)
  const date = new Date(year, month - 1, day)
  date.setMonth(date.getMonth() + months)
  return toDateString(date)
}

export const isDateOnOrBefore = (left: string, right: string) => {
  return left <= right
}
