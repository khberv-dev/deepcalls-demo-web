import { useInfiniteQuery } from '@tanstack/react-query'
import { getContactHistory } from '../api/history.js'
import { queryKeys } from '../api/queryKeys.js'

// History lists are infinite queries keyed ['history', contactId, type] where type is 'all' | 'comment' | 'call' |
// 'pipeline'. Each cached value: { pages: [{ items, total, page, limit }], pageParams }.

const isPendingCall = (item) => item.type === 'call' && ['created', 'analyzing'].includes(item.entity?.status)

/**
 * A contact's history, newest first, loaded page by page. `type` narrows it to one entry type.
 * While a call is waiting for or undergoing analysis the list refreshes every 15 s: the server only pushes the
 * final done/failed change over the WebSocket, not created → analyzing.
 */
export function useContactHistory(contactId, type = 'all', { limit = 20 } = {}) {
    return useInfiniteQuery({
        queryKey: queryKeys.history.list(contactId, type),
        queryFn: ({ pageParam }) =>
            getContactHistory(contactId, { type: type === 'all' ? undefined : type, page: pageParam, limit }),
        initialPageParam: 1,
        getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
        enabled: !!contactId,
        refetchInterval: (query) =>
            query.state.data?.pages.some((p) => p.items.some(isPendingCall)) ? 15_000 : false,
        // Prepended items can shift an entry onto the next page; drop duplicates.
        select: (data) => {
            const seen = new Set()
            const items = []
            for (const page of data.pages) {
                for (const item of page.items) {
                    if (seen.has(item.id)) continue
                    seen.add(item.id)
                    items.push(item)
                }
            }
            return { items, total: data.pages.at(-1)?.total ?? 0 }
        },
    })
}

/** Apply `fn(items, type)` to every cached history list of the contact. */
function updateLists(queryClient, contactId, fn) {
    queryClient.setQueriesData({ queryKey: queryKeys.history.contact(contactId) }, (data) => {
        if (!data?.pages) return data
        return { ...data, pages: data.pages.map((page) => fn(page)) }
    })
}

/** Merge `patch` into the `entity` of every entry pointing at `entityId`. */
export function patchHistoryEntity(queryClient, contactId, entityId, patch) {
    updateLists(queryClient, contactId, (page) => ({
        ...page,
        items: page.items.map((item) =>
            item.entityId === entityId ? { ...item, entity: { ...item.entity, ...patch } } : item,
        ),
    }))
}

/** Remove the entries pointing at `entityId` (after deleting that comment or call). */
export function removeHistoryEntity(queryClient, contactId, entityId) {
    updateLists(queryClient, contactId, (page) => {
        const items = page.items.filter((item) => item.entityId !== entityId)
        return { ...page, items, total: page.total - (page.items.length - items.length) }
    })
}

/** Put a new entry at the top of the matching lists (all + its own type). */
export function prependHistoryItem(queryClient, item) {
    for (const type of ['all', item.type]) {
        queryClient.setQueryData(queryKeys.history.list(item.contactId, type), (data) => {
            if (!data?.pages?.length) return data
            if (data.pages.some((p) => p.items.some((i) => i.id === item.id))) return data
            return {
                ...data,
                pages: data.pages.map((page, i) => ({
                    ...page,
                    items: i === 0 ? [item, ...page.items] : page.items,
                    total: page.total + 1,
                })),
            }
        })
    }
}

export function invalidateContactHistory(queryClient, contactId) {
    return queryClient.invalidateQueries({ queryKey: queryKeys.history.contact(contactId) })
}
