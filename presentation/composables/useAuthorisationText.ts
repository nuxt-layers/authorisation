import { createClock } from '@nuxt-layers/clock/core'
import { useAppConfig, useRuntimeConfig } from '#imports'
import type { AuthorisationMessages } from '../messages'
import { resolveMessage } from '../messages'

/**
 * PUBLIC. Localised text for the layer's pages and components. Hosts change
 * wording or add locales in app.config.ts under `authorisation.messages`,
 * and set the locale with `NUXT_PUBLIC_AUTHORISATION_LOCALE`. Dates and times
 * are shown in the time zone the host gives Clock (`runtimeConfig.public.clock.timeZone`).
 */
export function useAuthorisationText() {
  const config = useRuntimeConfig().public
  const locale = config.authorisation.locale
  // The zone and hour cycle are Clock's own settings (`runtimeConfig.public.clock`), set once by the host for every layer.
  const { timeZone = 'UTC', hourCycle } = (config as { clock?: { timeZone?: string, hourCycle?: 'h11' | 'h12' | 'h23' | 'h24' } }).clock ?? {}
  const overrides = (useAppConfig() as { authorisation?: { messages?: Record<string, AuthorisationMessages> } }).authorisation?.messages
  // Dates and times are Clock's: one stated locale and zone on the server and
  // in the browser, so both render the same text.
  const clock = createClock({ locale, timeZone, ...(hourCycle ? { hourCycle } : {}) })
  return {
    locale,
    timeZone,
    t: (key: string, params?: Record<string, string | number>) => resolveMessage(key, locale, overrides, params),
    /** A role's name: a built-in role's in words, a custom role's as its tenant named it. */
    roleName: (role: { id: string, name: string, builtIn: boolean } | undefined, fallback = '') =>
      (role ? (role.builtIn ? resolveMessage(`authorisation.builtInRole.${role.id}`, locale, overrides) : role.name) : fallback),
    /** An instant as a date and time in the locale and the configured zone, which it names. */
    when: (instant: string | null | undefined) => (instant ? clock.format({ kind: 'instant', value: instant }, { dateStyle: 'medium', timeStyle: 'long' }) : ''),
    /** The instant a calendar date (`YYYY-MM-DD`) begins in the configured zone. */
    startOfDate: (date: string) => clock.toInstant(clock.resolveLocal(`${clock.parse('date', date).value}T00:00:00`, timeZone, 'compatible')),
  }
}
