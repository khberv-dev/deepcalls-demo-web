import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { changePassword, getMe, updateMe } from '../api/user.js'
import { queryKeys } from '../api/queryKeys.js'
import { useAuthToken } from './useAuth.js'

export function useMe() {
    const token = useAuthToken()
    // Permissions can change at any time (an admin edits a role), so refresh on focus and every few minutes.
    return useQuery({
        queryKey: queryKeys.me,
        queryFn: getMe,
        enabled: !!token,
        refetchOnWindowFocus: true,
        refetchInterval: 5 * 60_000,
    })
}

export function useUpdateMe() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateMe,
        onSuccess: (user) => queryClient.setQueryData(queryKeys.me, user),
    })
}

export function useChangePassword() {
    return useMutation({ mutationFn: changePassword })
}
