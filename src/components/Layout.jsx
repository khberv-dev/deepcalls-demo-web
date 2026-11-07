import { NavLink, Outlet } from 'react-router'
import { Contact, Kanban, LogOut, Settings, ShieldCheck, Tag, Users } from 'lucide-react'
import Brand from './Brand.jsx'
import { useLogout } from '../hooks/useAuth.js'
import { usePermissions } from '../hooks/usePermissions.js'
import { useRealtimeNotifications } from '../hooks/useRealtime.js'
import { useMe } from '../hooks/useUser.js'
import { fullName, initials } from '../utils/format.js'

const NAV_GROUPS = [
    {
        label: 'CRM',
        items: [
            { to: '/pipelines', label: 'Voronka', icon: Kanban },
            { to: '/contacts', label: 'Kontaktlar', icon: Contact },
            { to: '/sources', label: 'Manbalar', icon: Tag },
        ],
    },
    {
        label: 'Boshqaruv',
        items: [
            { to: '/users', label: 'Foydalanuvchilar', icon: Users, permission: 'canReadUser' },
            { to: '/roles', label: 'Rollar', icon: ShieldCheck, permission: 'canReadRole' },
            { to: '/settings', label: 'Sozlamalar', icon: Settings },
        ],
    },
]

export default function Layout() {
    const { data: me } = useMe()
    const logout = useLogout()
    useRealtimeNotifications()
    const permissions = usePermissions()
    const name = fullName(me)

    return (
        <div className="app">
            <aside className="sidebar">
                <Brand />
                <nav className="nav">
                    {NAV_GROUPS.map((group) => {
                        const items = group.items.filter((item) => !item.permission || permissions[item.permission])
                        if (!items.length) return null
                        return (
                            <div key={group.label} className="nav-group">
                                <span className="nav-group-label">{group.label}</span>
                                {items.map(({ to, label, icon: Icon }) => (
                                    <NavLink
                                        key={to}
                                        to={to}
                                        className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
                                    >
                                        <Icon size={16} aria-hidden="true" />
                                        <span>{label}</span>
                                    </NavLink>
                                ))}
                            </div>
                        )
                    })}
                </nav>
                <div className="sidebar-user">
                    <span className="avatar">{initials(name) || '?'}</span>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{name || '…'}</span>
                        <span className="sidebar-user-meta">{me?.role?.name ?? me?.email}</span>
                    </div>
                    <button className="icon-button" onClick={logout} title="Chiqish" aria-label="Chiqish">
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>
            <main className="main">
                <Outlet />
            </main>
        </div>
    )
}
