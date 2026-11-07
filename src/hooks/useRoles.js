import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRole, deleteRole, getRoles, updateRole } from '../api/roles.js'
import { queryKeys } from '../api/queryKeys.js'

export function useRoles({ enabled = true } = {}) {
    return useQuery({ queryKey: queryKeys.roles.all, queryFn: getRoles, enabled })
}

// Role changes apply at once to every user with the role, the current user included,
// and users embed their role.
function useRoleMutation(mutationFn) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.roles.all })
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
            queryClient.invalidateQueries({ queryKey: queryKeys.me })
        },
    })
}

export function useCreateRole() {
    return useRoleMutation(createRole)
}

export function useUpdateRole() {
    return useRoleMutation(updateRole)
}

export function useDeleteRole() {
    return useRoleMutation(deleteRole)
}
