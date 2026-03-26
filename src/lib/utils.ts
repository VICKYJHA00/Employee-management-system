




import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// ─── Tailwind / className ─────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ════════════════════════════════════════════════════════════════════════════════
// DATE HELPERS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Format a Date to YYYY-MM-DD for PostgreSQL — locale-safe.
 * @example formatDateForDB(new Date()) // "2025-03-22"
 */
export function formatDateForDB(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * First day of the month containing `date` as YYYY-MM-DD.
 * @example getMonthStartForDB() // "2025-03-01"
 */
export function getMonthStartForDB(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

/**
 * Last day of the month containing `date` as YYYY-MM-DD.
 * @example getMonthEndForDB() // "2025-03-31"
 */
export function getMonthEndForDB(date: Date = new Date()): string {
  const y       = date.getFullYear()
  const month   = date.getMonth()
  const lastDay = new Date(y, month + 1, 0).getDate()
  return `${y}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

/**
 * Quarter number (1–4) for a given date.
 * @example getQuarter(new Date('2025-08-01')) // 3
 */
export function getQuarter(date: Date = new Date()): 1 | 2 | 3 | 4 {
  return (Math.floor(date.getMonth() / 3) + 1) as 1 | 2 | 3 | 4
}

/**
 * First day of the quarter containing `date` as YYYY-MM-DD.
 * @example getQuarterStartForDB() // "2025-01-01"
 */
export function getQuarterStartForDB(date: Date = new Date()): string {
  const q          = getQuarter(date)
  const startMonth = String((q - 1) * 3 + 1).padStart(2, '0')
  return `${date.getFullYear()}-${startMonth}-01`
}

/**
 * Last day of the quarter containing `date` as YYYY-MM-DD.
 * @example getQuarterEndForDB() // "2025-03-31"
 */
export function getQuarterEndForDB(date: Date = new Date()): string {
  const q        = getQuarter(date)
  const endMonth = q * 3
  const lastDay  = new Date(date.getFullYear(), endMonth, 0).getDate()
  return `${date.getFullYear()}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

/**
 * ISO week number (1–53) for a given date.
 * Uses the ISO 8601 definition: week starts on Monday.
 * @example getISOWeek(new Date('2025-01-01')) // 1
 */
export function getISOWeek(date: Date = new Date()): number {
  const d     = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day   = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

/**
 * Start (Monday) of the ISO week containing `date` as YYYY-MM-DD.
 */
export function getWeekStartForDB(date: Date = new Date()): string {
  const d   = new Date(date)
  const day = d.getDay() || 7          // treat Sunday as 7
  d.setDate(d.getDate() - (day - 1))   // back to Monday
  return formatDateForDB(d)
}

/**
 * End (Sunday) of the ISO week containing `date` as YYYY-MM-DD.
 */
export function getWeekEndForDB(date: Date = new Date()): string {
  const d   = new Date(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() + (7 - day))   // forward to Sunday
  return formatDateForDB(d)
}

/**
 * Build a `{ from, to }` date-range object for DB queries.
 * @example dateRange('month') // { from: "2025-03-01", to: "2025-03-31" }
 */
export function dateRange(
  preset: 'today' | 'week' | 'month' | 'quarter' | 'year',
  ref: Date = new Date(),
): { from: string; to: string } {
  const today = formatDateForDB(ref)
  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case 'week':
      return { from: getWeekStartForDB(ref), to: getWeekEndForDB(ref) }
    case 'month':
      return { from: getMonthStartForDB(ref), to: getMonthEndForDB(ref) }
    case 'quarter':
      return { from: getQuarterStartForDB(ref), to: getQuarterEndForDB(ref) }
    case 'year': {
      const y = ref.getFullYear()
      return { from: `${y}-01-01`, to: `${y}-12-31` }
    }
  }
}

/**
 * Human-readable relative label for a date/ISO string.
 * @example relativeLabel('2025-03-21') // "Yesterday"
 * @example relativeLabel('2025-03-15') // "7 days ago"
 */
export function relativeLabel(dateInput: Date | string): string {
  const date      = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  const now       = new Date()
  const diffMs    = now.getTime() - date.getTime()
  const diffSecs  = Math.floor(diffMs / 1_000)
  const diffMins  = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays  = Math.floor(diffHours / 24)

  if (diffSecs < 60)    return 'Just now'
  if (diffMins < 60)    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24)   return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays === 1)   return 'Yesterday'
  if (diffDays < 7)     return `${diffDays} days ago`
  if (diffDays < 14)    return 'Last week'
  if (diffDays < 30)    return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 60)    return 'Last month'
  if (diffDays < 365)   return `${Math.floor(diffDays / 30)} months ago`
  if (diffDays < 730)   return 'Last year'
  return `${Math.floor(diffDays / 365)} years ago`
}

/**
 * Format a date as a readable label: "22 Mar 2025"
 */
export function formatDisplayDate(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Format a date + time: "22 Mar 2025, 14:35"
 */
export function formatDisplayDateTime(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return date.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

/**
 * True if two dates fall on the same calendar day.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  )
}

/**
 * Number of calendar days between two dates (absolute value).
 */
export function daysBetween(a: Date | string, b: Date | string): number {
  const da = typeof a === 'string' ? new Date(a) : a
  const db = typeof b === 'string' ? new Date(b) : b
  return Math.abs(Math.floor((db.getTime() - da.getTime()) / 86_400_000))
}

/**
 * Add N days to a date and return a new Date (non-mutating).
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * True if the given date is a weekend (Saturday or Sunday).
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

// ════════════════════════════════════════════════════════════════════════════════
// CURRENCY & NUMBER FORMATTERS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Format a number as Indian Rupees.
 * @example formatINR(1500)       // "₹1,500.00"
 * @example formatINR(1500, 0)    // "₹1,500"
 */
export function formatINR(amount: number, decimals = 2): string {
  return new Intl.NumberFormat('en-IN', {
    style:                 'currency',
    currency:              'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

/**
 * Compact number notation for large values.
 * @example compactNumber(1_200_000) // "1.2M"
 * @example compactNumber(4_500)     // "4.5K"
 */
export function compactNumber(value: number, locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale, {
    notation:             'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

/**
 * Format a ratio (0–1) or percentage (0–100) as a percentage string.
 * Pass `isRatio = true` when value is 0–1, false when already 0–100.
 * @example formatPercent(0.753)       // "75.3%"
 * @example formatPercent(75.3, false) // "75.3%"
 */
export function formatPercent(value: number, isRatio = true, decimals = 1): string {
  const pct = isRatio ? value * 100 : value
  return `${pct.toFixed(decimals)}%`
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Linear interpolation between two numbers.
 * @example lerp(0, 100, 0.5) // 50
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1)
}

/**
 * Round to N decimal places.
 * @example roundTo(3.14159, 2) // 3.14
 */
export function roundTo(value: number, places: number): number {
  const factor = Math.pow(10, places)
  return Math.round(value * factor) / factor
}

/**
 * Format bytes into human-readable size string.
 * @example formatBytes(1_048_576) // "1.0 MB"
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i     = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${sizes[i]}`
}

// ════════════════════════════════════════════════════════════════════════════════
// STRING HELPERS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Convert a string to a URL-safe slug.
 * @example slugify("THRYLOS India 2025!") // "thrylos-india-2025"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Truncate a string to `maxLength` characters, appending `ellipsis` if cut.
 * @example truncate("Hello World", 7) // "Hell..."
 */
export function truncate(str: string, maxLength: number, ellipsis = '...'): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - ellipsis.length) + ellipsis
}

/**
 * Capitalise the first letter of a string.
 * @example capitalize("hello world") // "Hello world"
 */
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Title-case every word in a string.
 * @example titleCase("hello world") // "Hello World"
 */
export function titleCase(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Convert camelCase or snake_case to a readable label.
 * @example toLabel("player_name")   // "Player Name"
 * @example toLabel("tournamentName") // "Tournament Name"
 */
export function toLabel(str: string): string {
  return titleCase(
    str
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
  )
}

/**
 * Initials from a full name (up to 2 characters).
 * @example initials("Rahul Bagoria") // "RB"
 */
export function initials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Mask an email address for privacy display.
 * @example maskEmail("rahul@thrylos.in") // "r***@thrylos.in"
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain || local.length <= 1) return email
  return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 4))}@${domain}`
}

/**
 * Pluralise a word based on count.
 * @example pluralise(1, 'player')   // "1 player"
 * @example pluralise(5, 'player')   // "5 players"
 * @example pluralise(0, 'match', 'matches') // "0 matches"
 */
export function pluralise(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? singular + 's')}`
}

/**
 * Check if a string is a valid email address.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/**
 * Check if a string is a valid 10-digit Indian mobile number.
 */
export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))
}

// ════════════════════════════════════════════════════════════════════════════════
// ARRAY / OBJECT UTILITIES
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Group an array of objects by the value of a key.
 * @example groupBy(players, 'tournament_name')
 * // { "THRYLOS Open": [...], "Season 2": [...] }
 */
export function groupBy<T>(
  array: T[],
  key: keyof T,
): Record<string, T[]> {
  return array.reduce<Record<string, T[]>>((acc, item) => {
    const group = String(item[key] ?? '__unknown__')
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {})
}

/**
 * Group an array by the return value of a selector function.
 * @example groupByFn(logs, l => l.created_at.slice(0, 7)) // group by "YYYY-MM"
 */
export function groupByFn<T>(
  array: T[],
  selector: (item: T) => string,
): Record<string, T[]> {
  return array.reduce<Record<string, T[]>>((acc, item) => {
    const group = selector(item)
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {})
}

/**
 * Sort an array of objects by a key, ascending or descending.
 * Returns a new array — does not mutate the original.
 * @example sortBy(players, 'entry_fees', 'desc')
 */
export function sortBy<T>(
  array: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc',
): T[] {
  return [...array].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av === bv) return 0
    const cmp = av < bv ? -1 : 1
    return direction === 'asc' ? cmp : -cmp
  })
}

/**
 * Sort an array by the return value of a selector function.
 * @example sortByFn(players, p => p.name.toLowerCase())
 */
export function sortByFn<T>(
  array: T[],
  selector: (item: T) => string | number,
  direction: 'asc' | 'desc' = 'asc',
): T[] {
  return [...array].sort((a, b) => {
    const av = selector(a)
    const bv = selector(b)
    if (av === bv) return 0
    const cmp = av < bv ? -1 : 1
    return direction === 'asc' ? cmp : -cmp
  })
}

/**
 * Remove duplicate primitives from an array.
 * @example dedupe([1, 2, 2, 3]) // [1, 2, 3]
 */
export function dedupe<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

/**
 * Remove objects with a duplicate value at `key`.
 * Keeps the first occurrence.
 * @example dedupeBy(players, 'email')
 */
export function dedupeBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set<unknown>()
  return array.filter(item => {
    const val = item[key]
    if (seen.has(val)) return false
    seen.add(val)
    return true
  })
}

/**
 * Chunk an array into sub-arrays of size `n`.
 * @example chunk([1,2,3,4,5], 2) // [[1,2],[3,4],[5]]
 */
export function chunk<T>(array: T[], n: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < array.length; i += n) {
    result.push(array.slice(i, i + n))
  }
  return result
}

/**
 * Flatten one level of nesting.
 * @example flatOne([[1,2],[3,4]]) // [1,2,3,4]
 */
export function flatOne<T>(array: T[][]): T[] {
  return ([] as T[]).concat(...array)
}

/**
 * Pick specific keys from an object, returning a new object.
 * @example pick(player, ['name', 'email'])
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  return keys.reduce((acc, k) => {
    if (k in obj) acc[k] = obj[k]
    return acc
  }, {} as Pick<T, K>)
}

/**
 * Omit specific keys from an object, returning a new object.
 * @example omit(player, ['password', 'token'])
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const keySet = new Set<string>(keys as string[])
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !keySet.has(k))
  ) as Omit<T, K>
}

/**
 * Sum all values in a numeric array, or sum by a selector on objects.
 * @example sumBy(players, p => p.entry_fees) // total fees collected
 */
export function sumBy<T>(array: T[], selector: (item: T) => number): number {
  return array.reduce((total, item) => total + selector(item), 0)
}

/**
 * Count items matching a predicate.
 * @example countWhere(players, p => p.payment_received) // paid count
 */
export function countWhere<T>(array: T[], predicate: (item: T) => boolean): number {
  return array.reduce((n, item) => n + (predicate(item) ? 1 : 0), 0)
}

// ════════════════════════════════════════════════════════════════════════════════
// DEBOUNCE & THROTTLE
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Returns a debounced version of `fn` that delays invocation until
 * `wait` ms have elapsed since the last call.
 *
 * @example
 * const debouncedSearch = debounce(handleSearch, 300)
 * input.addEventListener('input', debouncedSearch)
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, wait)
  }
}

/**
 * Returns a debounced function that also exposes a `.cancel()` method
 * to discard a pending invocation.
 */
export function debounceWithCancel<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null
  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { timer = null; fn(...args) }, wait)
  }
  debounced.cancel = () => { if (timer) clearTimeout(timer); timer = null }
  return debounced
}

/**
 * Returns a throttled version of `fn` that invokes at most once per `limit` ms.
 * The first call fires immediately; subsequent calls within the window are dropped.
 *
 * @example
 * const throttledScroll = throttle(handleScroll, 100)
 * window.addEventListener('scroll', throttledScroll)
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0
  return function (...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastCall >= limit) {
      lastCall = now
      fn(...args)
    }
  }
}

/**
 * Returns a throttled function that also exposes a `.flush()` method
 * to force an immediate invocation with the most recent arguments.
 */
export function throttleWithFlush<T extends (...args: any[]) => any>(
  fn: T,
  limit: number,
): ((...args: Parameters<T>) => void) & { flush: () => void } {
  let lastCall  = 0
  let lastArgs: Parameters<T> | null = null

  const throttled = (...args: Parameters<T>) => {
    lastArgs = args
    const now = Date.now()
    if (now - lastCall >= limit) {
      lastCall = now
      fn(...args)
    }
  }
  throttled.flush = () => {
    if (lastArgs) { lastCall = Date.now(); fn(...lastArgs) }
  }
  return throttled
}

/**
 * Returns a function that only executes `fn` on the first call.
 * Subsequent calls are no-ops.
 *
 * @example
 * const initOnce = once(initializeSDK)
 */
export function once<T extends (...args: any[]) => any>(fn: T): T {
  let called  = false
  let result: ReturnType<T>
  return ((...args: Parameters<T>) => {
    if (!called) { called = true; result = fn(...args) }
    return result
  }) as T
}

/**
 * Returns a promise that resolves after `ms` milliseconds.
 * Useful for artificial delays in async flows.
 *
 * @example await sleep(500)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
