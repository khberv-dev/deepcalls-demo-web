import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createSource, deleteSource, getSource, getSources, updateSource } from '../api/sources.js'
import { queryKeys } from '../api/queryKeys.js'

export function useSources() {
    return useQuery({ queryKey: queryKeys.sources.all, queryFn: getSources })
}

export function useSource(id) {
    return useQuery({ queryKey: queryKeys.sources.detail(id), queryFn: () => getSource(id), enabled: !!id })
}

export function useCreateSource() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createSource,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sources.all }),
    })
}

export function useUpdateSource() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateSource,
        onSuccess: (source) => {
            queryClient.setQueryData(queryKeys.sources.detail(source.id), source)
            queryClient.invalidateQueries({ queryKey: queryKeys.sources.all })
            // contacts and forms embed their source
            queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all })
            queryClient.invalidateQueries({ queryKey: queryKeys.forms.all })
        },
    })
}

/** Contacts from a deleted source stay, with `source: null`. */
export function useDeleteSource() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteSource,
        onSuccess: (_, id) => {
            queryClient.removeQueries({ queryKey: queryKeys.sources.detail(id) })
            queryClient.invalidateQueries({ queryKey: queryKeys.sources.all })
            queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all })
            queryClient.invalidateQueries({ queryKey: queryKeys.forms.all })
        },
    })
}
