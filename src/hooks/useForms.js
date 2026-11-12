import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    createForm,
    deleteForm,
    deleteFormLogo,
    getForms,
    regenerateFormLink,
    setFormActive,
    updateForm,
    uploadFormLogo,
} from '../api/forms.js'
import { queryKeys } from '../api/queryKeys.js'

/** `submissionsCount` grows while the page is open elsewhere, so this list refetches on focus. */
export function useForms() {
    return useQuery({ queryKey: queryKeys.forms.all, queryFn: getForms, refetchOnWindowFocus: true })
}

/** Write a form returned by the server into the list cache. */
function storeForm(queryClient, form) {
    queryClient.setQueryData(queryKeys.forms.detail(form.id), form)
    queryClient.setQueryData(queryKeys.forms.all, (list) => {
        if (!list) return list
        const exists = list.some((f) => f.id === form.id)
        return exists ? list.map((f) => (f.id === form.id ? form : f)) : [form, ...list]
    })
}

/** Mutation whose response is the whole updated form. */
function useFormMutation(mutationFn) {
    const queryClient = useQueryClient()
    return useMutation({ mutationFn, onSuccess: (form) => storeForm(queryClient, form) })
}

export function useCreateForm() {
    return useFormMutation(createForm)
}

export function useUpdateForm() {
    return useFormMutation(updateForm)
}

export function useSetFormActive() {
    return useFormMutation(setFormActive)
}

export function useRegenerateFormLink() {
    return useFormMutation(regenerateFormLink)
}

export function useUploadFormLogo() {
    return useFormMutation(uploadFormLogo)
}

export function useDeleteFormLogo() {
    return useFormMutation(deleteFormLogo)
}

export function useDeleteForm() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteForm,
        onSuccess: (_, id) => {
            queryClient.removeQueries({ queryKey: queryKeys.forms.detail(id) })
            queryClient.setQueryData(queryKeys.forms.all, (list) => list?.filter((f) => f.id !== id))
        },
    })
}
