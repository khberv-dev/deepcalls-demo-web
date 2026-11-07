import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthToken } from '../hooks/useAuth.js'

/** Only for signed-in users; otherwise redirect to /login and come back afterwards. */
export function RequireAuth() {
    const token = useAuthToken()
    const location = useLocation()
    if (!token) return <Navigate to="/login" replace state={{ from: location }} />
    return <Outlet />
}

/**
 * Login/register pages: signed-in users go straight to the app. This also performs the redirect after a
 * successful login (back to the page that sent the user to /login, if any).
 */
export function PublicOnly() {
    const token = useAuthToken()
    const location = useLocation()
    if (token) {
        const from = location.state?.from
        const to = from ? `${from.pathname}${from.search ?? ''}` : '/'
        return <Navigate to={to} replace />
    }
    return <Outlet />
}
