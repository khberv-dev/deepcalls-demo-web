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

/**
 * The server stores phones as digits only ("998901234567"). Display with "+" and grouping:
 * Uzbek numbers as "+998 90 123 45 67", anything else as "+<digits>".
 */
export function formatPhone(digits) {
    if (!digits) return ''
    const d = String(digits).replace(/\D/g, '')
    if (d.length === 12 && d.startsWith('998')) {
        return `+998 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`
    }
    return `+${d}`
}

export function formatSize(bytes) {
    if (bytes == null) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const STAGE_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#22C55E', '#EF4444', '#0EA5E9', '#EC4899', '#64748B']

// Icon names the source form offers (rendered by <SourceIcon/>).
export const ICON_PRESETS = ['phone', 'instagram', 'telegram', 'globe', 'users', 'facebook', 'youtube', 'whatsapp', 'mail']
