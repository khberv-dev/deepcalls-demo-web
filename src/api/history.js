import { api, cleanParams } from './client.js'

/**
 * A contact's timeline, newest first: the only way to list its comments and calls.
 * Each item: { id, contactId, type: 'comment' | 'call' | 'pipeline', entityId, userId, user, entity, createdAt }
 * where `entity` is the current Comment, Call or StageChange.
 * @param {string} contactId
 * @param {{ type?: 'comment' | 'call' | 'pipeline', page?: number, limit?: number }} params
 */
export async function getContactHistory(contactId, params) {
    const { data } = await api.get(`/contacts/${contactId}/history`, { params: cleanParams(params) })
    return data
}
