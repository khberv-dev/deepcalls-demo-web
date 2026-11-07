import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createComment, deleteComment, updateComment } from '../api/comments.js'
import { invalidateContactHistory, patchHistoryEntity, removeHistoryEntity } from './useHistory.js'

// Comments are listed through the contact's history (useContactHistory(contactId, 'comment')).

/** The new note's history entry is created by the server, so the contact's history is reloaded. */
export function useCreateComment() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createComment,
        onSuccess: (comment) => invalidateContactHistory(queryClient, comment.contactId),
    })
}

export function useUpdateComment() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateComment,
        onSuccess: (comment) => patchHistoryEntity(queryClient, comment.contactId, comment.id, comment),
    })
}

/** @param {{ id: string, contactId: string }} vars */
export function useDeleteComment() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id }) => deleteComment(id),
        onSuccess: (_, { id, contactId }) => removeHistoryEntity(queryClient, contactId, id),
    })
}
