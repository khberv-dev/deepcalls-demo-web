import { api, cleanParams } from './client.js'

/**
 * @param {{ search?: string, sourceId?: string, pipelineId?: string, stageId?: string, page?: number, limit?: number }} params
 * @returns {Promise<{ items: object[], total: number, page: number, limit: number }>}
 */
export async function getContacts(params) {
    const { data } = await api.get('/contacts', { params: cleanParams(params) })
    return data
}

export async function getContact(id) {
    const { data } = await api.get(`/contacts/${id}`)
    return data
}

/**
 * Pipeline placement: `stageId` moves to that stage, `pipelineId` alone moves to the pipeline's first stage,
 * `stageId: null` removes the contact from its pipeline. The server rejects unknown fields, so send only documented ones.
 */
export async function createContact(body) {
    const { data } = await api.post('/contacts', body)
    return data
}

/** Only sent fields change; `phones`/`emails` replace the whole list. */
export async function updateContact({ id, ...body }) {
    const { data } = await api.patch(`/contacts/${id}`, body)
    return data
}

export async function deleteContact(id) {
    await api.delete(`/contacts/${id}`)
}
