import { NavLink, Outlet } from 'react-router'
import { Contact, Kanban, LogOut, Settings, Tag } from 'lucide-react'
import { useLogout } from '../hooks/useAuth.js'
import { useRealtimeNotifications } from '../hooks/useRealtime.js'
import { useMe } from '../hooks/useUser.js'
import { fullName, initials } from '../utils/format.js'

const NAV = [
    { to: '/pipelines', label: 'Voronka', icon: Kanban },
    { to: '/contacts', label: 'Kontaktlar', icon: Contact },
    { to: '/sources', label: 'Manbalar', icon: Tag },
    { to: '/settings', label: 'Sozlamalar', icon: Settings },
]

export default function Layout() {
    const { data: me } = useMe()
    const logout = useLogout()
    useRealtimeNotifications()
    const name = fullName(me)

    return (
        <div className="app">
            <aside className="sidebar">
                <div className="brand">DeepCalls</div>
                <nav className="nav">
                    {NAV.map(({ to, label, icon: Icon }) => (
                        <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>
                            <Icon size={18} aria-hidden="true" />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-user">
                    <span className="avatar">{initials(name) || '?'}</span>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{name || '…'}</span>
                        <span className="muted small">{me?.email}</span>
                    </div>
                    <button className="icon-button" onClick={logout} title="Chiqish" aria-label="Chiqish">
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>
            <main className="main">
                <Outlet />
            </main>
        </div>
    )
}
