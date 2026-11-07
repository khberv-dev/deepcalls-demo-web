import { api } from './client.js'

// Every call that changes a pipeline or its stages returns the whole updated pipeline
// (except DELETE /pipelines/:id, which returns 204).

export async function getPipelines() {
    const { data } = await api.get('/pipelines')
    return data
}

export async function getPipeline(id) {
    const { data } = await api.get(`/pipelines/${id}`)
    return data
}

/**
 * @param {{ name: string, stages: { name: string, type?: 'open' | 'won' | 'lost', color?: string | null }[] }} body
 * `stages` is required (1–30, in order): new accounts start with no pipelines and nothing is created by default.
 */
export async function createPipeline(body) {
    const { data } = await api.post('/pipelines', body)
    return data
}

/** @param {{ id: string, name: string }} params */
export async function renamePipeline({ id, name }) {
    const { data } = await api.patch(`/pipelines/${id}`, { name })
    return data
}

export async function deletePipeline(id) {
    await api.delete(`/pipelines/${id}`)
}

/** Adds a stage at the end. @param {{ pipelineId: string, name: string, type?: string, color?: string | null }} params */
export async function addStage({ pipelineId, ...body }) {
    const { data } = await api.post(`/pipelines/${pipelineId}/stages`, body)
    return data
}

/** @param {{ pipelineId: string, stageId: string, name?: string, type?: string, color?: string | null }} params */
export async function updateStage({ pipelineId, stageId, ...body }) {
    const { data } = await api.patch(`/pipelines/${pipelineId}/stages/${stageId}`, body)
    return data
}

/** @param {{ pipelineId: string, stageId: string }} params */
export async function deleteStage({ pipelineId, stageId }) {
    const { data } = await api.delete(`/pipelines/${pipelineId}/stages/${stageId}`)
    return data
}

/** `stageIds` must list every stage of the pipeline exactly once, in the new order. */
export async function reorderStages({ pipelineId, stageIds }) {
    const { data } = await api.put(`/pipelines/${pipelineId}/stages/order`, { stageIds })
    return data
}
