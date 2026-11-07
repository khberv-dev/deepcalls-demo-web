import { api } from './client.js'

// Comment types: `note` (written by the user) and `call_analysis` (created by the AI, `details` holds the analysis).
// Comments are listed through the contact's history (api/history.js); there's no list endpoint.

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
