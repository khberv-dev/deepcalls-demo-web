import { api, cleanParams } from './client.js'

/**
 * Upload a call recording for a contact. Returns at once with `status: "created"`; the AI analysis runs in the
 * background and its result arrives as a `call_analysis` comment plus a `call.status_changed` WebSocket event.
 * @param {{ contactId: string, file: File, onUploadProgress?: (event: import('axios').AxiosProgressEvent) => void }} params
 */
export async function uploadCall({ contactId, file, onUploadProgress }) {
    const formData = new FormData()
    formData.append('file', file)
    // No timeout: large recordings can take a while to upload.
    const { data } = await api.post(`/contacts/${contactId}/calls`, formData, { onUploadProgress, timeout: 0 })
    return data
}

/** @returns {Promise<{ items: object[], total: number, page: number, limit: number }>} newest first */
export async function getContactCalls(contactId, params) {
    const { data } = await api.get(`/contacts/${contactId}/calls`, { params: cleanParams(params) })
    return data
}

export async function getCall(id) {
    const { data } = await api.get(`/calls/${id}`)
    return data
}

/**
 * The recording needs the Authorization header, so it can't be an <audio src> URL directly:
 * fetch it as a Blob and play it from an object URL.
 */
export async function fetchCallAudio(callId) {
    const { data } = await api.get(`/calls/${callId}/audio`, { responseType: 'blob', timeout: 0 })
    return data
}

/** Only failed calls can be retried (409 otherwise). */
export async function retryCall(id) {
    const { data } = await api.post(`/calls/${id}/retry`)
    return data
}

/** 409 while the call is being analyzed. The call's AI comment is kept, with `callId: null`. */
export async function deleteCall(id) {
    await api.delete(`/calls/${id}`)
}
