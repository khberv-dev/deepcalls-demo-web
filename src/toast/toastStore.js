import { getErrorMessage } from '../api/client.js'

// Minimal global toast store (read with useSyncExternalStore in <Toaster/>).
let toasts = []
let nextId = 1
const listeners = new Set()

function emit() {
    listeners.forEach((listener) => listener())
}

export function subscribeToasts(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export function getToasts() {
    return toasts
}

export function dismissToast(id) {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
}

export function toast(message, type = 'info') {
    const id = nextId++
    toasts = [...toasts, { id, message, type }]
    emit()
    setTimeout(() => dismissToast(id), type === 'error' ? 6000 : 3500)
}

export function toastSuccess(message) {
    toast(message, 'success')
}

export function toastError(error) {
    toast(typeof error === 'string' ? error : getErrorMessage(error), 'error')
}
