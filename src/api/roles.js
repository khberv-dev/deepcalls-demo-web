import { api } from './client.js'

// Roles. Reading needs `canReadRole`, changes need `canWriteRole` (403 otherwise).
// System roles (`isSystem: true`, the built-in Admin) can't be edited or deleted (409).

export async function getRoles() {
    const { data } = await api.get('/roles')
    return data
}

export async function getRole(id) {
    const { data } = await api.get(`/roles/${id}`)
    return data
}

/** `name` plus optional boolean permission flags (omitted = false). */
export async function createRole(body) {
    const { data } = await api.post('/roles', body)
    return data
}

/** Omitted permissions stay unchanged. Takes effect at once for every user with this role. */
export async function updateRole({ id, ...body }) {
    const { data } = await api.patch(`/roles/${id}`, body)
    return data
}

/** 409 if the role is assigned to users or is a system role. */
export async function deleteRole(id) {
    await api.delete(`/roles/${id}`)
}
