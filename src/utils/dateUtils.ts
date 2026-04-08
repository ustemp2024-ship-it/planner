export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function getDateString(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getWeekAgoString(): string {
  const date = new Date()
  date.setDate(date.getDate() - 7)
  return date.toISOString().split('T')[0]
}

export function getMonthRange(today: string): { start: string; end: string } {
  const prefix = today.substring(0, 7)
  return {
    start: `${prefix}-01`,
    end: `${prefix}-31`
  }
}

export function getYearRange(year: number): { start: string; end: string } {
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`
  }
}

export function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  return date >= startDate && date <= endDate
}

export function formatDateRange(startDate: string, endDate: string): string {
  return startDate === endDate ? startDate : `${startDate} ~ ${endDate}`
}
