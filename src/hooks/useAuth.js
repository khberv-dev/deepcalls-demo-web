import { useSyncExternalStore } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login, register } from '../api/auth.js'
import { queryKeys } from '../api/queryKeys.js'
import { clearToken, getToken, setToken, subscribeToken } from '../auth/tokenStore.js'

/** Current access token, or null when signed out. Re-renders on login, logout and any 401. */
export function useAuthToken() {
    return useSyncExternalStore(subscribeToken, getToken)
}

function useSignIn(mutationFn) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn,
        onSuccess: ({ accessToken, user }) => {
            queryClient.clear() // drop anything cached for a previous user
            setToken(accessToken)
            queryClient.setQueryData(queryKeys.me, user)
            // The auth response may not carry the role/permissions; GET /user/me always does.
            queryClient.invalidateQueries({ queryKey: queryKeys.me })
        },
    })
}

export function useLogin() {
    return useSignIn(login)
}

export function useRegister() {
    return useSignIn(register)
}

/** There's no logout endpoint: clearing the token is the logout (the cache is cleared in queryClient.js). */
export function useLogout() {
    return clearToken
}
