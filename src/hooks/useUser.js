import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { changePassword, getMe, updateMe } from '../api/user.js'
import { queryKeys } from '../api/queryKeys.js'
import { useAuthToken } from './useAuth.js'

export function useMe() {
    const token = useAuthToken()
    return useQuery({ queryKey: queryKeys.me, queryFn: getMe, enabled: !!token })
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
