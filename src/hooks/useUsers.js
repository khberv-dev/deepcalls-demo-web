import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createUser, deleteUser, getUsers, updateUser } from '../api/users.js'
import { queryKeys } from '../api/queryKeys.js'

/** @param {{ search?: string, roleId?: string, page?: number, limit?: number }} params */
export function useUsers(params = {}, { enabled = true } = {}) {
    return useQuery({
        queryKey: queryKeys.users.list(params),
        queryFn: () => getUsers(params),
        placeholderData: keepPreviousData,
        enabled,
    })
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
            queryClient.invalidateQueries({ queryKey: queryKeys.history.all })
        },
    })
}
