import { parseInterchange } from '@nuxt-layers/clock/core'

/** A `Date` as the canonical instant the layer answers with: Clock's form, which leaves a zero fraction out. */
export const instantOf = (date: Date): string => parseInterchange('epochMilliseconds', date.getTime()).value
