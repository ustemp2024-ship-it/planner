const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function getDayOfWeek(year: number, month: number, day: number): string {
  const date = new Date(year, month, day)
  return WEEKDAYS[date.getDay()]
}

export function isSunday(year: number, month: number, day: number): boolean {
  const date = new Date(year, month, day)
  return date.getDay() === 0
}

function getLunarNewYear(year: number): string[] {
  const lunarNewYearDates: Record<number, string[]> = {
    2019: ['2019-02-04', '2019-02-05', '2019-02-06'],
    2020: ['2020-01-24', '2020-01-25', '2020-01-26', '2020-01-27'],
    2021: ['2021-02-11', '2021-02-12', '2021-02-13'],
    2022: ['2022-01-31', '2022-02-01', '2022-02-02'],
    2023: ['2023-01-21', '2023-01-22', '2023-01-23', '2023-01-24'],
    2024: ['2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12'],
    2025: ['2025-01-28', '2025-01-29', '2025-01-30'],
    2026: ['2026-02-16', '2026-02-17', '2026-02-18'],
    2027: ['2027-02-06', '2027-02-07', '2027-02-08', '2027-02-09'],
    2028: ['2028-01-25', '2028-01-26', '2028-01-27', '2028-01-28'],
    2029: ['2029-02-12', '2029-02-13', '2029-02-14'],
    2030: ['2030-02-02', '2030-02-03', '2030-02-04', '2030-02-05'],
  }
  return lunarNewYearDates[year] || []
}

function getChuseok(year: number): string[] {
  const chuseokDates: Record<number, string[]> = {
    2019: ['2019-09-12', '2019-09-13', '2019-09-14'],
    2020: ['2020-09-30', '2020-10-01', '2020-10-02'],
    2021: ['2021-09-20', '2021-09-21', '2021-09-22'],
    2022: ['2022-09-09', '2022-09-10', '2022-09-11', '2022-09-12'],
    2023: ['2023-09-28', '2023-09-29', '2023-09-30'],
    2024: ['2024-09-16', '2024-09-17', '2024-09-18'],
    2025: ['2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08'],
    2026: ['2026-09-24', '2026-09-25', '2026-09-26'],
    2027: ['2027-09-14', '2027-09-15', '2027-09-16'],
    2028: ['2028-10-02', '2028-10-03', '2028-10-04'],
    2029: ['2029-09-21', '2029-09-22', '2029-09-23', '2029-09-24'],
    2030: ['2030-09-11', '2030-09-12', '2030-09-13'],
  }
  return chuseokDates[year] || []
}

function getBuddhasBirthday(year: number): string {
  const buddhasBirthday: Record<number, string> = {
    2019: '2019-05-12',
    2020: '2020-04-30',
    2021: '2021-05-19',
    2022: '2022-05-08',
    2023: '2023-05-27',
    2024: '2024-05-15',
    2025: '2025-05-05',
    2026: '2026-05-24',
    2027: '2027-05-13',
    2028: '2028-05-02',
    2029: '2029-05-20',
    2030: '2030-05-09',
  }
  return buddhasBirthday[year] || ''
}

export function getKoreanHolidays(year: number): Set<string> {
  const holidays = new Set<string>()
  
  holidays.add(`${year}-01-01`)
  holidays.add(`${year}-03-01`)
  holidays.add(`${year}-05-05`)
  holidays.add(`${year}-06-06`)
  holidays.add(`${year}-08-15`)
  holidays.add(`${year}-10-03`)
  holidays.add(`${year}-10-09`)
  holidays.add(`${year}-12-25`)
  
  getLunarNewYear(year).forEach(d => holidays.add(d))
  getChuseok(year).forEach(d => holidays.add(d))
  
  const buddha = getBuddhasBirthday(year)
  if (buddha) holidays.add(buddha)
  
  const substituteHolidays: Record<number, string[]> = {
    2019: [],
    2020: ['2020-08-17'],
    2021: ['2021-08-16', '2021-10-04', '2021-10-11'],
    2022: ['2022-03-09', '2022-06-01', '2022-10-10'],
    2023: ['2023-01-24', '2023-05-29', '2023-10-02'],
    2024: ['2024-02-12', '2024-05-06', '2024-10-01'],
    2025: ['2025-03-03', '2025-05-06', '2025-10-08'],
    2026: ['2026-03-02', '2026-05-25', '2026-06-08', '2026-08-17'],
    2027: ['2027-02-09', '2027-08-16', '2027-10-04', '2027-10-11'],
    2028: ['2028-01-28', '2028-05-08', '2028-10-05'],
    2029: ['2029-05-07', '2029-09-24', '2029-10-04'],
    2030: ['2030-02-05', '2030-05-06'],
  }
  
  ;(substituteHolidays[year] || []).forEach(d => holidays.add(d))
  
  return holidays
}

export function isHoliday(year: number, month: number, day: number): boolean {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return getKoreanHolidays(year).has(dateStr)
}

export function isRedDay(year: number, month: number, day: number): boolean {
  return isSunday(year, month, day) || isHoliday(year, month, day)
}
