import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../api/queryKeys.js'
import { clearToken } from '../auth/tokenStore.js'
import { connectNotifications } from '../realtime/notifications.js'
import { toast } from '../toast/toastStore.js'
import { fullName } from '../utils/format.js'
import { useAuthToken } from './useAuth.js'
import { patchHistoryEntity, prependHistoryItem } from './useHistory.js'

function handleCallStatusChanged(queryClient, { callId, contactId, status, error, comment, history }) {
    // The call's own entry shows its current status; on success the new AI comment's entry goes on top.
    patchHistoryEntity(queryClient, contactId, callId, {
        status,
        error,
        ...(status === 'done' ? { analyzedAt: comment?.createdAt ?? new Date().toISOString() } : {}),
    })
    if (history) prependHistoryItem(queryClient, history)

    const contact = queryClient.getQueryData(queryKeys.contacts.detail(contactId))
    const who = contact ? `${fullName(contact)}: ` : ''
    if (status === 'done') toast(`${who}Qoʻngʻiroq tahlili tayyor`, 'success')
    else toast(`${who}Qoʻngʻiroq tahlilida xatolik${error ? ` — ${error}` : ''}`, 'error')
}

/**
 * A contact was created outside the app (today only by a form submission). Only its owner gets this. Board columns
 * and the list are paged and filtered, so they're reloaded instead of patched; pipelines carry per-stage counts and
 * forms their `submissionsCount`.
 */
function handleLeadCreated(queryClient, { contact, origin }) {
    if (contact?.id) queryClient.setQueryData(queryKeys.contacts.detail(contact.id), contact)
    queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists })
    queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.all })
    if (origin?.type === 'form') queryClient.invalidateQueries({ queryKey: queryKeys.forms.all })

    // More origin types may be added; for unknown ones the toast just has no suffix.
    const from = origin?.type === 'form' && origin.name ? ` (${origin.name})` : ''
    toast(`Yangi lid: ${fullName(contact) || 'nomaʼlum'}${from}`, 'success')
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
                else if (event === 'lead.created') handleLeadCreated(queryClient, data)
            },
            // Events sent while disconnected are lost: after a reconnect, reload whatever they would have changed.
            onReady: (isReconnect) => {
                if (!isReconnect) return
                queryClient.invalidateQueries({ queryKey: queryKeys.history.all })
                queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists })
                queryClient.invalidateQueries({ queryKey: queryKeys.pipelines.all })
                queryClient.invalidateQueries({ queryKey: queryKeys.forms.all })
            },
            onUnauthorized: clearToken,
        })
    }, [token, queryClient])
}
