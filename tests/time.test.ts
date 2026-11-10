import { globSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { after, instant, instantOrNull, later, plus, secondsBetween } from '../server/internal/time'
import { toPosix } from './support/paths'

describe('time, through Clock', () => {
  it('gives every time one canonical form: UTC, to the millisecond, a zero fraction left out', () => {
    expect(instant(new Date('2030-01-01T00:00:00.000Z'))).toBe('2030-01-01T00:00:00Z')
    expect(instant('2030-01-01T00:00:00.000Z')).toBe('2030-01-01T00:00:00Z')
    expect(instant('2030-01-01T01:00:00+01:00')).toBe('2030-01-01T00:00:00Z')
    expect(instant('2030-01-01T00:00:00.123456Z')).toBe('2030-01-01T00:00:00.123Z')
    expect(() => instant('2030-01-01')).toThrow()
    expect(instantOrNull('yesterday')).toBeNull()
    expect(instantOrNull(null)).toBeNull()
  })

  it('never treats a missing or unreadable time as later, so validity checks fail closed', () => {
    const now = new Date('2030-01-01T00:00:00Z')
    expect(after('2030-01-01T00:00:00.001Z', now)).toBe(true)
    expect(after('2030-01-01T00:00:00Z', now)).toBe(false)
    expect(after('2029-12-31T23:59:59Z', now)).toBe(false)
    expect(after('not a time', now)).toBe(false)
    expect(after(null, now)).toBe(false)
    expect(after(now, 'not a time')).toBe(false)
  })

  it('adds elapsed time, a day being 24 hours, and measures elapsed seconds', () => {
    const at = new Date('2030-03-30T12:00:00Z')
    expect(plus(at, { minutes: 5 })).toBe('2030-03-30T12:05:00Z')
    expect(plus(at, { hours: 72 })).toBe('2030-04-02T12:00:00Z')
    expect(plus(at, { days: 7 })).toBe('2030-04-06T12:00:00Z')
    expect(plus(at, { days: -30 })).toBe('2030-02-28T12:00:00Z')
    expect(plus(at, { hours: 0 })).toBe('2030-03-30T12:00:00Z')
    expect(secondsBetween('2030-03-30T11:45:00Z', at)).toBe(900)
    expect(secondsBetween('2030-03-30T12:00:00.500Z', at)).toBe(-0.5)
    expect(secondsBetween('not a time', at)).toBeNull()
    expect(later('2030-01-01T00:00:00Z', '2030-01-02T00:00:00Z')).toBe('2030-01-02T00:00:00Z')
    expect(later(null, '2030-01-02T00:00:00Z')).toBe('2030-01-02T00:00:00Z')
    expect(later(null, null)).toBeNull()
  })

  it('leaves date arithmetic, parsing and formatting to Clock everywhere else', () => {
    // A `Date` appears only where the host's clock port and the database driver hand one over.
    const boundaries = ['server/internal/clock.ts', 'server/internal/time.ts']
    const own = /Date\.parse|Date\.now|\.getTime\(|\.toISOString\(|new Date\(|Intl\.DateTimeFormat|toLocale(?:Date|Time)?String/
    const offending = globSync('{server,shared,contracts,app,presentation,modules}/**/*.{ts,vue}')
      .map(toPosix)
      .filter(file => !boundaries.includes(file) && own.test(readFileSync(file, 'utf8')))
    expect(offending).toEqual([])
  })
})
