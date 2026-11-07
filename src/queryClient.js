import { QueryClient } from '@tanstack/react-query'
import { getToken, subscribeToken } from './auth/tokenStore.js'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            // Don't retry client errors (401/404/...); retry once on network or 5xx failures.
            retry: (failureCount, error) => {
                const status = error?.response?.status
                if (status && status < 500) return false
                return failureCount < 1
            },
        },
        mutations: { retry: 0 },
    },
})

// Signed out (logout, or a 401 cleared the token): drop the previous user's cached data.
subscribeToken(() => {
    if (!getToken()) queryClient.clear()
})
