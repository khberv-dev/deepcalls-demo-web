import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createUser, deleteUser, getUsers, updateUser } from '../api/users.js'
import { queryKeys } from '../api/queryKeys.js'
import { fullName } from '../utils/format.js'
import { usePermissions } from './usePermissions.js'

/** @param {{ search?: string, roleId?: string, page?: number, limit?: number }} params */
export function useUsers(params = {}, { enabled = true } = {}) {
    return useQuery({
        queryKey: queryKeys.users.list(params),
        queryFn: () => getUsers(params),
        placeholderData: keepPreviousData,
        enabled,
    })
}

/**
 * id → display name for users, for showing comment authors and contact owners.
 * Only available with `canReadUser`; otherwise the map is empty.
 */
export function useUserNames() {
    const { canReadUser } = usePermissions()
    const { data } = useUsers({ limit: 100 }, { enabled: canReadUser })
    const names = {}
    for (const user of data?.items ?? []) names[user.id] = fullName(user)
    return names
}

function useInvalidateUsers() {
    const queryClient = useQueryClient()
    return () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
        // An admin may have edited themselves (name, email).
        queryClient.invalidateQueries({ queryKey: queryKeys.me })
    }
}

export function useCreateUser() {
    const invalidate = useInvalidateUsers()
    return useMutation({ mutationFn: createUser, onSuccess: invalidate })
}

export function useUpdateUser() {
    const invalidate = useInvalidateUsers()
    return useMutation({ mutationFn: updateUser, onSuccess: invalidate })
}

/** Deletes the user with everything they own, which can include records shown anywhere in the app. */
export function useDeleteUser() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
            queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all })
            queryClient.invalidateQueries({ queryKey: queryKeys.calls.all })
            queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
        },
    })
}
