// Phone numbers: the server stores digits only, with the country code ("998901234567").
// The UI splits them into a country (dial code) and a national number, formatted with the country's mask.

/**
 * `lengths`: allowed national-number lengths. `mask`: `#` = digit, used for display.
 * Order is the order shown in the picker (neighbours first).
 */
export const COUNTRIES = [
    { iso: 'UZ', name: 'Oʻzbekiston', dial: '998', lengths: [9], mask: '## ### ## ##' },
    { iso: 'KZ', name: 'Qozogʻiston', dial: '7', lengths: [10], mask: '### ### ## ##' },
    { iso: 'RU', name: 'Rossiya', dial: '7', lengths: [10], mask: '### ### ## ##' },
    { iso: 'KG', name: 'Qirgʻiziston', dial: '996', lengths: [9], mask: '### ### ###' },
    { iso: 'TJ', name: 'Tojikiston', dial: '992', lengths: [9], mask: '## ### ####' },
    { iso: 'TM', name: 'Turkmaniston', dial: '993', lengths: [8], mask: '## ## ## ##' },
    { iso: 'AF', name: 'Afgʻoniston', dial: '93', lengths: [9], mask: '## ### ####' },
    { iso: 'AZ', name: 'Ozarbayjon', dial: '994', lengths: [9], mask: '## ### ## ##' },
    { iso: 'TR', name: 'Turkiya', dial: '90', lengths: [10], mask: '### ### ## ##' },
    { iso: 'AE', name: 'BAA', dial: '971', lengths: [9], mask: '## ### ####' },
    { iso: 'SA', name: 'Saudiya Arabistoni', dial: '966', lengths: [9], mask: '## ### ####' },
    { iso: 'UA', name: 'Ukraina', dial: '380', lengths: [9], mask: '## ### ## ##' },
    { iso: 'BY', name: 'Belarus', dial: '375', lengths: [9], mask: '## ### ## ##' },
    { iso: 'CN', name: 'Xitoy', dial: '86', lengths: [11], mask: '### #### ####' },
    { iso: 'KR', name: 'Janubiy Koreya', dial: '82', lengths: [9, 10], mask: '## #### ####' },
    { iso: 'IN', name: 'Hindiston', dial: '91', lengths: [10], mask: '##### #####' },
    { iso: 'US', name: 'AQSh', dial: '1', lengths: [10], mask: '### ### ####' },
    { iso: 'GB', name: 'Buyuk Britaniya', dial: '44', lengths: [10], mask: '#### ######' },
    { iso: 'DE', name: 'Germaniya', dial: '49', lengths: [10, 11], mask: '### ########' },
]

export const DEFAULT_COUNTRY = COUNTRIES[0] // Uzbekistan

const byIso = Object.fromEntries(COUNTRIES.map((c) => [c.iso, c]))
const MAX_DIGITS = 15 // E.164

export function getCountry(iso) {
    return byIso[iso] ?? DEFAULT_COUNTRY
}

/** Regional-indicator flag emoji for an ISO code (Windows shows the two letters instead). */
export function flagEmoji(iso) {
    return String.fromCodePoint(...[...iso].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65))
}

export const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '')

/**
 * Which country a full digit string belongs to: the longest matching dial code.
 * +7 is shared: Kazakhstan numbers start with 6 or 7 after the code, everything else is Russia.
 */
export function detectCountry(digits) {
    const d = onlyDigits(digits)
    if (!d) return null
    let best = null
    for (const country of COUNTRIES) {
        if (d.startsWith(country.dial) && (!best || country.dial.length > best.dial.length)) best = country
    }
    if (best?.dial === '7') return /^7[67]/.test(d) ? byIso.KZ : byIso.RU
    return best
}

/** Apply the country's mask; extra digits beyond the mask are appended as-is. */
export function formatNational(country, national) {
    const digits = onlyDigits(national)
    if (!country) return digits
    let out = ''
    let i = 0
    for (const ch of country.mask) {
        if (i >= digits.length) break
        if (ch === '#') out += digits[i++]
        else out += ch
    }
    return out + digits.slice(i)
}

export function maxNationalLength(country) {
    return Math.min(Math.max(...country.lengths), MAX_DIGITS - country.dial.length)
}

/** "998901234567" → "+998 90 123 45 67". Unknown codes fall back to "+<digits>". */
export function formatPhone(value) {
    const digits = onlyDigits(value)
    if (!digits) return ''
    const country = detectCountry(digits)
    if (!country) return `+${digits}`
    return `+${country.dial} ${formatNational(country, digits.slice(country.dial.length))}`.trim()
}

/** A complete number: a known country with a valid national length, or 8–15 digits otherwise. */
export function isValidPhone(value) {
    const digits = onlyDigits(value)
    const country = detectCountry(digits)
    if (!country) return digits.length >= 8 && digits.length <= MAX_DIGITS
    return country.lengths.includes(digits.length - country.dial.length)
}
