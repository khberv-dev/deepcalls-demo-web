import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    addStage,
    createPipeline,
    deletePipeline,
    deleteStage,
    getPipeline,
    getPipelines,
    renamePipeline,
    reorderStages,
    updateStage,
} from '../api/pipelines.js'
import { queryKeys } from '../api/queryKeys.js'

export function usePipelines() {
    return useQuery({ queryKey: queryKeys.pipelines.all, queryFn: getPipelines })
}

export function usePipeline(id) {
    return useQuery({ queryKey: queryKeys.pipelines.detail(id), queryFn: () => getPipeline(id), enabled: !!id })
}

/** Write a pipeline returned by the server into both the detail and the list cache. */
function storePipeline(queryClient, pipeline) {
    queryClient.setQueryData(queryKeys.pipelines.detail(pipeline.id), pipeline)
    queryClient.setQueryData(queryKeys.pipelines.all, (list) => {
        if (!list) return list
        const exists = list.some((p) => p.id === pipeline.id)
        return exists ? list.map((p) => (p.id === pipeline.id ? pipeline : p)) : [...list, pipeline]
    })
}

/** Mutation whose response is the whole updated pipeline. */
function usePipelineMutation(mutationFn, { touchesContacts = false } = {}) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn,
        onSuccess: (pipeline) => {
            storePipeline(queryClient, pipeline)
            // contacts embed their stage (name, color, position)
            if (touchesContacts) queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all })
        },
    })
}

export function useCreatePipeline() {
    return usePipelineMutation(createPipeline)
}

export function useRenamePipeline() {
    return usePipelineMutation(renamePipeline)
}

export function useAddStage() {
    return usePipelineMutation(addStage)
}

export function useUpdateStage() {
    return usePipelineMutation(updateStage, { touchesContacts: true })
}

/** 409 if the stage has contacts or is the pipeline's last stage. */
export function useDeleteStage() {
    return usePipelineMutation(deleteStage, { touchesContacts: true })
}

/** 409 if the pipeline still has contacts. */
export function useDeletePipeline() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deletePipeline,
        onSuccess: (_, id) => {
            queryClient.removeQueries({ queryKey: queryKeys.pipelines.detail(id) })
            queryClient.setQueryData(queryKeys.pipelines.all, (list) => list?.filter((p) => p.id !== id))
        },
    })
}

/** Reorder kanban columns. Applied optimistically and rolled back if the server rejects it. */
export function useReorderStages() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: reorderStages,
        onMutate: async ({ pipelineId, stageIds }) => {
            const key = queryKeys.pipelines.detail(pipelineId)
            await queryClient.cancelQueries({ queryKey: key })
            const previous = queryClient.getQueryData(key)
            if (previous) {
                const byId = new Map(previous.stages.map((s) => [s.id, s]))
                const stages = stageIds.map((id, position) => ({ ...byId.get(id), position }))
                storePipeline(queryClient, { ...previous, stages })
            }
            return { previous }
        },
        onError: (_error, _vars, context) => {
            if (context?.previous) storePipeline(queryClient, context.previous)
        },
        onSuccess: (pipeline) => {
            storePipeline(queryClient, pipeline)
            queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all })
        },
    })
}
