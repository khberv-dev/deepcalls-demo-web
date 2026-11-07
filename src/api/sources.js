import { api } from './client.js'

export async function getSources() {
    const { data } = await api.get('/sources')
    return data
}

export async function getSource(id) {
    const { data } = await api.get(`/sources/${id}`)
    return data
}

/** @param {{ name: string, icon?: string | null }} body */
export async function createSource(body) {
    const { data } = await api.post('/sources', body)
    return data
}

/** @param {{ id: string, name?: string, icon?: string | null }} params */
export async function updateSource({ id, ...body }) {
    const { data } = await api.patch(`/sources/${id}`, body)
    return data
}

export async function deleteSource(id) {
    await api.delete(`/sources/${id}`)
}
