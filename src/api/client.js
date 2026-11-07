import axios from 'axios'
import { clearToken, getToken } from '../auth/tokenStore.js'

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://192.168.1.35:8000/api',
    timeout: 30_000,
})

api.interceptors.request.use((config) => {
    const token = getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Any 401 outside the login/register calls means the token is missing, invalid or expired.
        // Clearing it switches the app back to the login screen (see useAuthToken).
        const isAuthCall = error.config?.url?.startsWith('/auth/')
        if (error.response?.status === 401 && !isAuthCall) clearToken()
        return Promise.reject(error)
    },
)

const STATUS_MESSAGES = {
    401: 'Avtorizatsiyadan oʻtilmagan',
    404: 'Maʼlumot topilmadi',
    413: 'Fayl hajmi juda katta',
}

/**
 * Readable message from an API error. The server responds with
 * `{ statusCode, message, error }`, where `message` is a string or, for validation errors, an array of strings.
 */
export function getErrorMessage(error) {
    const message = error?.response?.data?.message
    if (Array.isArray(message)) return message.join('; ')
    if (typeof message === 'string' && message) return message

    const status = error?.response?.status
    if (status) return STATUS_MESSAGES[status] ?? `Soʻrov bajarilmadi (status ${status})`
    if (error?.code === 'ECONNABORTED') return 'Server javob bermadi (vaqt tugadi)'
    if (error?.request) return 'Server bilan bogʻlanib boʻlmadi'
    return error?.message ?? 'Nomaʼlum xatolik'
}

/** Drop undefined, null and empty-string params so they aren't sent as `?search=`. */
export function cleanParams(params = {}) {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    )
}
