import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createComment, deleteComment, getContactComments, updateComment } from '../api/comments.js'
import { queryKeys } from '../api/queryKeys.js'

const PAGE_SIZE = 20

// Comments are cached as an infinite query: { pages: [{ items, total, page, limit }], pageParams }.

function mapPages(data, fn) {
    if (!data) return data
    return { ...data, pages: data.pages.map(fn) }
}

/** Put a new comment at the top of the contact's feed (from the composer or a WebSocket event). */
export function prependCachedComment(queryClient, comment) {
    queryClient.setQueryData(queryKeys.comments.list(comment.contactId), (data) => {
        if (!data) return data
        if (data.pages.some((p) => p.items.some((c) => c.id === comment.id))) return data
        return mapPages(data, (page, i) => ({
            ...page,
            items: i === 0 ? [comment, ...page.items] : page.items,
            total: page.total + 1,
        }))
    })
}

/** The contact's timeline: notes and AI call summaries, newest first, loaded page by page. */
export function useContactComments(contactId) {
    return useInfiniteQuery({
        queryKey: queryKeys.comments.list(contactId),
        queryFn: ({ pageParam }) => getContactComments(contactId, { page: pageParam, limit: PAGE_SIZE }),
        initialPageParam: 1,
        getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
        enabled: !!contactId,
        // A comment can shift onto the next page when new ones are prepended; drop duplicates.
        select: (data) => {
            const seen = new Set()
            const items = []
            for (const page of data.pages) {
                for (const comment of page.items) {
                    if (seen.has(comment.id)) continue
                    seen.add(comment.id)
                    items.push(comment)
                }
            }
            return { items, total: data.pages.at(-1)?.total ?? 0 }
        },
    })
}

export function useCreateComment() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createComment,
        onSuccess: (comment) => prependCachedComment(queryClient, comment),
    })
}

export function useUpdateComment() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateComment,
        onSuccess: (comment) => {
            queryClient.setQueryData(queryKeys.comments.list(comment.contactId), (data) =>
                mapPages(data, (page) => ({
                    ...page,
                    items: page.items.map((c) => (c.id === comment.id ? comment : c)),
                })),
            )
        },
    })
}

/** @param {{ id: string, contactId: string }} vars */
export function useDeleteComment() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id }) => deleteComment(id),
        onSuccess: (_, { id, contactId }) => {
            queryClient.setQueryData(queryKeys.comments.list(contactId), (data) =>
                mapPages(data, (page) => ({
                    ...page,
                    items: page.items.filter((c) => c.id !== id),
                    total: page.total - 1,
                })),
            )
        },
    })
}
