import { api } from './client.js'

export async function getMe() {
    const { data } = await api.get('/user/me')
    return data
}

/** @param {{ firstName?: string, lastName?: string | null }} body */
export async function updateMe(body) {
    const { data } = await api.patch('/user/me', body)
    return data
}

/** @param {{ currentPassword: string, newPassword: string }} body */
export async function changePassword(body) {
    await api.put('/user/password', body)
}
