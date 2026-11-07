import { useMe } from './useUser.js'

const RESOURCES = ['User', 'Role', 'Contact', 'Comment']

/**
 * The signed-in user's effective permissions (from GET /user/me). Write implies read.
 * Only for showing/hiding UI: the server enforces every rule itself.
 * @returns {{ userId?: string, loaded: boolean, failed: boolean,
 *   canReadUser: boolean, canWriteUser: boolean, canReadRole: boolean, canWriteRole: boolean,
 *   canReadContact: boolean, canWriteContact: boolean, canReadComment: boolean, canWriteComment: boolean }}
 */
export function usePermissions() {
    const { data: me, isError } = useMe()
    const raw = me?.permissions ?? {}
    // `me` seeded from the login response may lack `permissions` until GET /user/me returns.
    const result = { userId: me?.id, loaded: !!me?.permissions, failed: isError }
    for (const resource of RESOURCES) {
        const write = !!raw[`canWrite${resource}`]
        result[`canWrite${resource}`] = write
        result[`canRead${resource}`] = write || !!raw[`canRead${resource}`]
    }
    return result
}
