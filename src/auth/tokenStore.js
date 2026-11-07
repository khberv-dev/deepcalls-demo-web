// Access token storage. localStorage can throw (private mode, blocked storage), so every access is guarded
// and the in-memory value is the source of truth for the current tab.

const STORAGE_KEY = 'deepcalls.accessToken'
const listeners = new Set()

function readStored() {
    try {
        return localStorage.getItem(STORAGE_KEY)
    } catch {
        return null
    }
}

let token = readStored()

function emit() {
    listeners.forEach((listener) => listener())
}

export function getToken() {
    return token
}

export function setToken(value) {
    token = value
    try {
        localStorage.setItem(STORAGE_KEY, value)
    } catch {
        // keep the in-memory token only
    }
    emit()
}

export function clearToken() {
    if (token === null) return
    token = null
    try {
        localStorage.removeItem(STORAGE_KEY)
    } catch {
        // nothing to clear
    }
    emit()
}

export function subscribeToken(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

// Keep tabs in sync: logging in or out in one tab applies to the others.
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key !== STORAGE_KEY) return
        token = event.newValue
        emit()
    })
}
