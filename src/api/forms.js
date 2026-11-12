import { api } from './client.js'

// Public lead forms. Private to their owner, like pipelines and sources. Each submission (on the public page at
// `form.link`) creates a contact for the owner in the form's source and stage, plus a note with the other answers.
// Every endpoint that changes a form returns the whole updated form.

/** Newest first. */
export async function getForms() {
    const { data } = await api.get('/forms')
    return data
}

export async function getForm(id) {
    const { data } = await api.get(`/forms/${id}`)
    return data
}

/**
 * @param {{ name: string, fields: { key?: string, type: string, label: string, placeholder?: string | null,
 *   required?: boolean, options?: string[] }[], isActive?: boolean, sourceId?: string | null,
 *   pipelineId?: string, stageId?: string | null }} body
 * Placement follows the contact rules: `stageId` wins, `pipelineId` alone means its first stage.
 */
export async function createForm(body) {
    const { data } = await api.post('/forms', body)
    return data
}

/** Any of the create fields. `fields` replaces the whole list; `stageId: null` stops placing new contacts in a pipeline. */
export async function updateForm({ id, ...body }) {
    const { data } = await api.patch(`/forms/${id}`, body)
    return data
}

/** An inactive form's link shows "not active" and rejects submissions (410). */
export async function setFormActive({ id, isActive }) {
    const { data } = await api.post(`/forms/${id}/${isActive ? 'activate' : 'deactivate'}`)
    return data
}

/** New slug and link; the old link stops working immediately. */
export async function regenerateFormLink(id) {
    const { data } = await api.post(`/forms/${id}/link`)
    return data
}

/** png, jpeg, webp or gif, at most 2 MB (415 / 413 otherwise). Replaces the previous logo. */
export async function uploadFormLogo({ id, file }) {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post(`/forms/${id}/logo`, formData)
    return data
}

export async function deleteFormLogo(id) {
    const { data } = await api.delete(`/forms/${id}/logo`)
    return data
}

/** Contacts created by the form are kept. */
export async function deleteForm(id) {
    await api.delete(`/forms/${id}`)
}
