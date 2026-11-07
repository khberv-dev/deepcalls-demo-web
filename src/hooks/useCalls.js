import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteCall, getContactCalls, retryCall, uploadCall } from '../api/calls.js'
import { queryKeys } from '../api/queryKeys.js'

const isPending = (call) => call.status === 'created' || call.status === 'analyzing'

/** Patch one call inside the contact's cached call list. Returns false if the call isn't cached. */
export function patchCachedCall(queryClient, contactId, callId, patch) {
    let found = false
    queryClient.setQueryData(queryKeys.calls.list(contactId), (data) => {
        if (!data) return data
        return {
            ...data,
            items: data.items.map((call) => {
                if (call.id !== callId) return call
                found = true
                return { ...call, ...patch }
            }),
        }
    })
    return found
}

function upsertCachedCall(queryClient, call) {
    queryClient.setQueryData(queryKeys.calls.list(call.contactId), (data) => {
        if (!data) return data
        const exists = data.items.some((c) => c.id === call.id)
        return exists
            ? { ...data, items: data.items.map((c) => (c.id === call.id ? call : c)) }
            : { ...data, items: [call, ...data.items], total: data.total + 1 }
    })
}

/**
 * The contact's calls (newest first). Status changes to done/failed arrive over the WebSocket; the server
 * doesn't push created → analyzing, so while a call is pending the list also refreshes every 15 s as a fallback.
 */
export function useContactCalls(contactId) {
    return useQuery({
        queryKey: queryKeys.calls.list(contactId),
        queryFn: () => getContactCalls(contactId, { limit: 100 }),
        enabled: !!contactId,
        refetchInterval: (query) => (query.state.data?.items.some(isPending) ? 15_000 : false),
    })
}

export function useUploadCall() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: uploadCall,
        onSuccess: (call) => upsertCachedCall(queryClient, call),
    })
}

export function useRetryCall() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: retryCall,
        onSuccess: (call) => upsertCachedCall(queryClient, call),
    })
}

/** @param {{ id: string, contactId: string }} vars */
export function useDeleteCall() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id }) => deleteCall(id),
        onSuccess: (_, { id, contactId }) => {
            queryClient.setQueryData(queryKeys.calls.list(contactId), (data) =>
                data ? { ...data, items: data.items.filter((c) => c.id !== id), total: data.total - 1 } : data,
            )
            // The call's AI comment stays but its callId becomes null.
            queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(contactId) })
        },
    })
}
