import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteCall, retryCall, uploadCall } from '../api/calls.js'
import { invalidateContactHistory, patchHistoryEntity, removeHistoryEntity } from './useHistory.js'

// Calls are listed through the contact's history (useContactHistory(contactId, 'call')).

/** Upload adds a `call` history entry on the server, so the contact's history is reloaded. */
export function useUploadCall() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: uploadCall,
        onSuccess: (call) => invalidateContactHistory(queryClient, call.contactId),
    })
}

export function useRetryCall() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: retryCall,
        onSuccess: (call) => patchHistoryEntity(queryClient, call.contactId, call.id, call),
    })
}

/**
 * The call's history entry goes away; its AI comment stays with `callId: null`, so the history is reloaded to
 * pick that up. @param {{ id: string, contactId: string }} vars
 */
export function useDeleteCall() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id }) => deleteCall(id),
        onSuccess: (_, { id, contactId }) => {
            removeHistoryEntity(queryClient, contactId, id)
            invalidateContactHistory(queryClient, contactId)
        },
    })
}
