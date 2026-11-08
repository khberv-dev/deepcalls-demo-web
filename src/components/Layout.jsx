import { NavLink, Outlet } from 'react-router'
import { Kanban, ShieldCheck, Tag, Users } from 'lucide-react'
import Brand from './Brand.jsx'
import SidebarFooter from './SidebarFooter.jsx'
import { usePermissions } from '../hooks/usePermissions.js'
import { useRealtimeNotifications } from '../hooks/useRealtime.js'

const NAV_GROUPS = [
    {
        label: 'CRM',
        items: [
            { to: '/leads', label: 'Lidlar', icon: Kanban },
            { to: '/sources', label: 'Manbalar', icon: Tag },
        ],
    },
    {
        label: 'Boshqaruv',
        items: [
            { to: '/users', label: 'Foydalanuvchilar', icon: Users, permission: 'canReadUser' },
            { to: '/roles', label: 'Rollar', icon: ShieldCheck, permission: 'canReadRole' },
        ],
    },
]

export default function Layout() {
    useRealtimeNotifications()
    const permissions = usePermissions()

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
                <SidebarFooter />
            </aside>
            <main className="main">
                <Outlet />
            </main>
        </div>
    )
}
