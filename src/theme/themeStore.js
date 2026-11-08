// Light/dark theme. The choice is stored per browser; without one, the OS preference decides.
// index.html applies the stored theme before React loads, so the first paint already has the right colors.

const STORAGE_KEY = 'deepcalls.theme'
const listeners = new Set()

function systemTheme() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStored() {
    try {
        const value = localStorage.getItem(STORAGE_KEY)
        return value === 'light' || value === 'dark' ? value : null
    } catch {
        return null
    }
}

let theme = readStored() ?? systemTheme()

function apply() {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b0d12' : '#ffffff')
}
apply()

// Follow OS changes until the user picks a theme explicitly.
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (readStored()) return
    theme = systemTheme()
    apply()
    listeners.forEach((l) => l())
})

export function getTheme() {
    return theme
}

export function setTheme(next) {
    theme = next
    try {
        localStorage.setItem(STORAGE_KEY, next)
    } catch {
        // still applied for this session
    }
    apply()
    listeners.forEach((l) => l())
}

export function subscribeTheme(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}
