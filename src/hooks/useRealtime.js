import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../api/queryKeys.js'
import { clearToken } from '../auth/tokenStore.js'
import { connectNotifications } from '../realtime/notifications.js'
import { toast } from '../toast/toastStore.js'
import { fullName } from '../utils/format.js'
import { useAuthToken } from './useAuth.js'
import { patchCachedCall } from './useCalls.js'
import { prependCachedComment } from './useComments.js'

function handleCallStatusChanged(queryClient, { callId, contactId, status, error, comment }) {
    const found = patchCachedCall(queryClient, contactId, callId, {
        status,
        error,
        ...(status === 'done' ? { analyzedAt: comment?.createdAt ?? new Date().toISOString() } : {}),
    })
    if (!found) queryClient.invalidateQueries({ queryKey: queryKeys.calls.list(contactId) })
    if (comment) prependCachedComment(queryClient, comment)

    const contact = queryClient.getQueryData(queryKeys.contacts.detail(contactId))
    const who = contact ? `${fullName(contact)}: ` : ''
    if (status === 'done') toast(`${who}Qoʻngʻiroq tahlili tayyor`, 'success')
    else toast(`${who}Qoʻngʻiroq tahlilida xatolik${error ? ` — ${error}` : ''}`, 'error')
}

/** Keeps a WebSocket open while signed in and applies server events to the query cache. Mount once (in Layout). */
export function useRealtimeNotifications() {
    const token = useAuthToken()
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!token) return undefined
        return connectNotifications(token, {
            onEvent: (event, data) => {
                if (event === 'call.status_changed') handleCallStatusChanged(queryClient, data)
            },
            // Events sent while disconnected are lost: after a reconnect, reload calls and comments.
            onReady: (isReconnect) => {
                if (!isReconnect) return
                queryClient.invalidateQueries({ queryKey: queryKeys.calls.all })
                queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
            },
            onUnauthorized: clearToken,
        })
    }, [token, queryClient])
}
