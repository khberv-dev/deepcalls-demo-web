import { api, cleanParams } from './client.js'

// Comment types: `note` (written by the user) and `call_analysis` (created by the AI, `details` holds the analysis).

/** @returns {Promise<{ items: object[], total: number, page: number, limit: number }>} newest first */
export async function getContactComments(contactId, params) {
    const { data } = await api.get(`/contacts/${contactId}/comments`, { params: cleanParams(params) })
    return data
}

/** Adds a `note`. AI comments can't be created through the API. */
export async function createComment({ contactId, text }) {
    const { data } = await api.post(`/contacts/${contactId}/comments`, { text })
    return data
}

export async function getComment(id) {
    const { data } = await api.get(`/comments/${id}`)
    return data
}

/** Works for notes and AI comments; an AI comment's `details` never change. */
export async function updateComment({ id, text }) {
    const { data } = await api.patch(`/comments/${id}`, { text })
    return data
}

export async function deleteComment(id) {
    await api.delete(`/comments/${id}`)
}
