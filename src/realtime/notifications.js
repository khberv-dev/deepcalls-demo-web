import { api } from '../api/client.js'

// Live notifications over WebSocket. Browsers can't send an Authorization header on a WebSocket, so the token
// goes in the first message. Close code 4401 means the token is invalid/expired: log out, don't reconnect.

const AUTH_CLOSE_CODE = 4401
const MAX_RETRY_MS = 30_000

/** ws(s)://host:port/api/ws, derived from the HTTP base URL unless VITE_WS_URL is set. */
function wsUrl() {
    if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
    const url = new URL(api.defaults.baseURL, window.location.href)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = `${url.pathname.replace(/\/$/, '')}/ws`
    return url.toString()
}

/**
 * @param {string} token
 * @param {{ onEvent: (event: string, data: object) => void, onReady?: (isReconnect: boolean) => void, onUnauthorized: () => void }} handlers
 * @returns {() => void} disconnect
 */
export function connectNotifications(token, { onEvent, onReady, onUnauthorized }) {
    let socket
    let retryMs = 1000
    let retryTimer
    let stopped = false
    let connectedBefore = false

    function open() {
        socket = new WebSocket(wsUrl())

        socket.onopen = () => {
            socket.send(JSON.stringify({ event: 'auth', data: { token } }))
        }

        socket.onmessage = (e) => {
            let message
            try {
                message = JSON.parse(e.data)
            } catch {
                return
            }
            if (message.event === 'ready') {
                retryMs = 1000
                onReady?.(connectedBefore)
                connectedBefore = true
                return
            }
            onEvent(message.event, message.data)
        }

        socket.onclose = (e) => {
            if (stopped) return
            if (e.code === AUTH_CLOSE_CODE) {
                onUnauthorized()
                return
            }
            // Network drop or server restart: reconnect with exponential backoff.
            retryTimer = setTimeout(open, retryMs)
            retryMs = Math.min(retryMs * 2, MAX_RETRY_MS)
        }
    }

    open()

    return () => {
        stopped = true
        clearTimeout(retryTimer)
        socket?.close()
    }
}
