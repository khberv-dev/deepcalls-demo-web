export function fullName(contact) {
    if (!contact) return ''
    return [contact.firstName, contact.lastName].filter(Boolean).join(' ')
}

export function initials(nameOrContact) {
    const text = typeof nameOrContact === 'string' ? nameOrContact : fullName(nameOrContact)
    return text
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('')
}

const pad = (n) => String(n).padStart(2, '0')

/** dd.mm.yyyy */
export function formatDate(iso) {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

/** dd.mm.yyyy hh:mm */
export function formatDateTime(iso) {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return `${formatDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Phone display lives in ./phone.js (country-aware); re-exported here for existing imports.
export { formatPhone } from './phone.js'

export function formatSize(bytes) {
    if (bytes == null) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const STAGE_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#22C55E', '#EF4444', '#0EA5E9', '#EC4899', '#64748B']

// Icon names the source form offers (rendered by <SourceIcon/>).
export const ICON_PRESETS = ['phone', 'instagram', 'telegram', 'globe', 'users', 'facebook', 'youtube', 'whatsapp', 'mail']
