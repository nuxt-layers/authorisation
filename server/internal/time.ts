import { add, ClockError, compare, difference, formatInterchange, parseInterchange } from '@nuxt-layers/clock/core'

/**
 * PRIVATE. The one place Authorisation works with time values. Parsing,
 * comparison, arithmetic and the canonical form of an instant all come from
 * Clock (`@nuxt-layers/clock/core`); nothing here or elsewhere in the layer
 * does date arithmetic of its own.
 *
 * A `Date` appears only at two boundaries: the host's clock port
 * (`AuthorisationClock.now()`, the shared `now()` shape) and the database
 * driver. Both are turned into an instant here.
 */

/** A canonical Clock instant: ISO 8601 in UTC with `Z`, to the millisecond, with a zero fraction left out. */
export type Instant = string

/** A time as the layer meets it: the clock's or the driver's `Date`, or an instant string. */
export type When = Date | string

const valueOf = (instant: Instant) => ({ kind: 'instant' as const, value: instant })
const fromMilliseconds = (milliseconds: number): Instant => parseInterchange('epochMilliseconds', milliseconds).value

/**
 * The canonical instant of a time, to the millisecond (what the database's
 * driver gives back). A string may carry `Z` or a numeric offset. Throws
 * `ClockError` for anything that is not an instant.
 */
export function instant(when: When): Instant {
  if (when instanceof Date) return fromMilliseconds(when.getTime())
  return fromMilliseconds(formatInterchange(parseInterchange('rfc3339', when), 'epochMilliseconds') as number)
}

/** As `instant`, or null for a missing or unreadable time. */
export function instantOrNull(when: When | null | undefined): Instant | null {
  if (when == null) return null
  try {
    return instant(when)
  }
  catch (error) {
    if (error instanceof ClockError) return null
    throw error
  }
}

/**
 * Whether `a` is strictly later than `b`. A missing or unreadable time is
 * never later than anything, so "still valid" checks fail closed.
 */
export function after(a: When | null | undefined, b: When | null | undefined): boolean {
  const left = instantOrNull(a)
  const right = instantOrNull(b)
  return left !== null && right !== null && compare(valueOf(left), valueOf(right)) > 0
}

/** The later of two instants; null only when both are. */
export function later(a: Instant | null, b: Instant | null): Instant | null {
  if (a === null) return b
  if (b === null) return a
  return after(b, a) ? b : a
}

/**
 * The instant an elapsed amount after `when` (before it, for negative
 * amounts). A day here is 24 elapsed hours, as the layer's periods have
 * always been counted: they are durations, not calendar deadlines.
 */
export function plus(when: When, amount: { days?: number, hours?: number, minutes?: number }): Instant {
  const start = instant(when)
  const hours = (amount.days ?? 0) * 24 + (amount.hours ?? 0)
  const minutes = amount.minutes ?? 0
  if (hours === 0 && minutes === 0) return start
  return add(valueOf(start), { ...(hours !== 0 ? { hours } : {}), ...(minutes !== 0 ? { minutes } : {}) }).value
}

/** Seconds elapsed from `from` to `to`, negative when `to` is earlier; null when either is unreadable. */
export function secondsBetween(from: When | null | undefined, to: When | null | undefined): number | null {
  const start = instantOrNull(from)
  const end = instantOrNull(to)
  if (start === null || end === null) return null
  return difference(valueOf(start), valueOf(end), 'milliseconds') / 1000
}
