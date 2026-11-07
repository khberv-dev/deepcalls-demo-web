import { api, cleanParams } from './client.js'

// User management. Reading needs `canReadUser`, changes need `canWriteUser` (403 otherwise).

/**
 * @param {{ search?: string, roleId?: string, page?: number, limit?: number }} params
 * @returns {Promise<{ items: object[], total: number, page: number, limit: number }>} oldest first
 */
export async function getUsers(params) {
    const { data } = await api.get('/users', { params: cleanParams(params) })
    return data
}

export async function getUser(id) {
    const { data } = await api.get(`/users/${id}`)
    return data
}

/** @param {{ firstName: string, lastName?: string | null, email: string, password: string, roleId?: string | null }} body */
export async function createUser(body) {
    const { data } = await api.post('/users', body)
    return data
}

/** All fields optional. `password` sets a new one without the old; `roleId: null` removes the role. */
export async function updateUser({ id, ...body }) {
    const { data } = await api.patch(`/users/${id}`, body)
    return data
}

/** Deletes the user and everything they own. 400 when deleting yourself. */
export async function deleteUser(id) {
    await api.delete(`/users/${id}`)
}
