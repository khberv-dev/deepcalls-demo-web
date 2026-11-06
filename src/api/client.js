import axios from 'axios'

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://192.168.1.35:8000',
})

// Turn an axios error into a readable message (FastAPI-style `detail` supported).
export function getErrorMessage(error) {
    const detail = error?.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.map((d) => d.msg ?? JSON.stringify(d)).join('; ')
    if (error?.response) return `Request failed with status ${error.response.status}`
    return error?.message ?? 'Unknown error'
}
