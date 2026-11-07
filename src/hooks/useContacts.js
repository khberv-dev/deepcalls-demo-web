import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContact, deleteContact, getContact, getContacts, updateContact } from '../api/contacts.js'
import { queryKeys } from '../api/queryKeys.js'
import { invalidateContactHistory } from './useHistory.js'

/**
 * Paged contact list. Keeps the previous page visible while the next one loads.
 * @param {{ search?: string, sourceId?: string, pipelineId?: string, stageId?: string, page?: number, limit?: number }} params
 */
export function useContacts(params = {}) {
    return useQuery({
        queryKey: queryKeys.contacts.list(params),
        queryFn: () => getContacts(params),
        placeholderData: keepPreviousData,
    })
}

export function useContact(id) {
    return useQuery({ queryKey: queryKeys.contacts.detail(id), queryFn: () => getContact(id), enabled: !!id })
}

// Contact changes affect contact lists and the stage `contactsCount` in pipelines.
function invalidateContactData(queryClient) {
    queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.all })
}

export function useCreateContact() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createContact,
        onSuccess: (contact) => {
            queryClient.setQueryData(queryKeys.contacts.detail(contact.id), contact)
            invalidateContactData(queryClient)
        },
    })
}

/** Also used to move a kanban card: `mutate({ id, stageId })`. */
export function useUpdateContact() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateContact,
        onSuccess: (contact) => {
            queryClient.setQueryData(queryKeys.contacts.detail(contact.id), contact)
            invalidateContactData(queryClient)
            // A stage change adds a `pipeline` history entry.
            invalidateContactHistory(queryClient, contact.id)
        },
    })
}

const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)

/**
 * Move a contact to another stage (kanban drag-and-drop). Optimistically moves the card between the cached
 * per-stage lists and adjusts stage counts; rolls back if the server rejects it.
 * @param {{ id: string, stageId: string, fromStageId: string | null }} vars
 */
export function useMoveContact() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, stageId }) => updateContact({ id, stageId }),
        onMutate: async ({ id, stageId, fromStageId }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.contacts.all })
            await queryClient.cancelQueries({ queryKey: queryKeys.pipelines.all })

            const lists = queryClient.getQueriesData({ queryKey: queryKeys.contacts.lists })
            const pipelines = queryClient.getQueriesData({ queryKey: queryKeys.pipelines.all })

            const contact = lists.flatMap(([, data]) => data?.items ?? []).find((c) => c.id === id)
            let targetStage = null
            for (const [, data] of pipelines) {
                for (const pipeline of Array.isArray(data) ? data : data ? [data] : []) {
                    const stage = pipeline.stages.find((s) => s.id === stageId)
                    if (stage) targetStage = { ...stage, pipelineId: pipeline.id }
                }
            }

            if (contact) {
                const stage = targetStage && {
                    ...contact.stage,
                    id: targetStage.id,
                    pipelineId: targetStage.pipelineId,
                    name: targetStage.name,
                    type: targetStage.type,
                    color: targetStage.color,
                    position: targetStage.position,
                }
                const moved = { ...contact, stageId, stage: stage ?? contact.stage }
                for (const [key, data] of lists) {
                    const params = key[2] ?? {}
                    if (!data) continue
                    if (params.stageId === fromStageId) {
                        queryClient.setQueryData(key, {
                            ...data,
                            items: data.items.filter((c) => c.id !== id),
                            total: Math.max(0, data.total - 1),
                        })
                    } else if (params.stageId === stageId) {
                        queryClient.setQueryData(key, {
                            ...data,
                            items: [moved, ...data.items.filter((c) => c.id !== id)].sort(byNewest),
                            total: data.total + 1,
                        })
                    }
                }
            }

            const adjustCounts = (pipeline) => ({
                ...pipeline,
                stages: pipeline.stages.map((s) => {
                    if (s.id === fromStageId) return { ...s, contactsCount: Math.max(0, s.contactsCount - 1) }
                    if (s.id === stageId) return { ...s, contactsCount: s.contactsCount + 1 }
                    return s
                }),
            })
            for (const [key, data] of pipelines) {
                if (!data) continue
                queryClient.setQueryData(key, Array.isArray(data) ? data.map(adjustCounts) : adjustCounts(data))
            }

            return { lists, pipelines }
        },
        onError: (_error, _vars, context) => {
            context?.lists.forEach(([key, data]) => queryClient.setQueryData(key, data))
            context?.pipelines.forEach(([key, data]) => queryClient.setQueryData(key, data))
        },
        onSettled: (_data, _error, { id }) => {
            invalidateContactData(queryClient)
            invalidateContactHistory(queryClient, id)
        },
    })
}

export function useDeleteContact() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteContact,
        onSuccess: (_, id) => {
            // Deleting a contact also deletes its calls, comments and history.
            queryClient.removeQueries({ queryKey: queryKeys.contacts.detail(id) })
            queryClient.removeQueries({ queryKey: queryKeys.history.contact(id) })
            invalidateContactData(queryClient)
        },
    })
}
