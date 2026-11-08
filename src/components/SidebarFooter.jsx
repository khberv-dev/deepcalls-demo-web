import { useCallback, useRef, useState } from 'react'
import { ChevronsUpDown, KeyRound, LogOut, Moon, Sun, UserRound } from 'lucide-react'
import ChangePasswordModal from './ChangePasswordModal.jsx'
import ProfileModal from './ProfileModal.jsx'
import { useLogout } from '../hooks/useAuth.js'
import { useDismiss } from '../hooks/useDismiss.js'
import { useTheme } from '../hooks/useTheme.js'
import { useMe } from '../hooks/useUser.js'
import { fullName, initials } from '../utils/format.js'

function ThemeToggle() {
    const [theme, setTheme] = useTheme()
    const dark = theme === 'dark'
    return (
        <button
            type="button"
            className="theme-toggle"
            role="switch"
            aria-checked={dark}
            onClick={() => setTheme(dark ? 'light' : 'dark')}
            title={dark ? 'Yorugʻ rejimga oʻtish' : 'Tungi rejimga oʻtish'}
        >
            {dark ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
            <span className="theme-toggle-label">Tungi rejim</span>
            <span className="switch" aria-hidden="true">
                <span className="switch-thumb" />
            </span>
        </button>
    )
}

/** Sidebar footer: dark-mode switch, then the profile card with its menu (profile, password, logout). */
export default function SidebarFooter() {
    const { data: me } = useMe()
    const logout = useLogout()
    const [open, setOpen] = useState(false)
    const [dialog, setDialog] = useState(null) // 'profile' | 'password'
    const rootRef = useRef(null)
    const close = useCallback(() => setOpen(false), [])
    useDismiss(rootRef, open, close)

    const name = fullName(me)
    const openDialog = (which) => {
        close()
        setDialog(which)
    }

    return (
        <div className="sidebar-footer">
            <ThemeToggle />

            <div className="profile-menu" ref={rootRef}>
                <button
                    type="button"
                    className="sidebar-user"
                    onClick={() => setOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={open}
                >
                    <span className="avatar">{initials(name) || '?'}</span>
                    <span className="sidebar-user-info">
                        <span className="sidebar-user-name">{name || '…'}</span>
                        <span className="sidebar-user-meta">{me?.role?.name ?? me?.email}</span>
                    </span>
                    <ChevronsUpDown size={15} className="sidebar-user-chevron" aria-hidden="true" />
                </button>

                {open && (
                    <div className="menu" role="menu">
                        <div className="menu-header">
                            <span className="strong-plain">{name}</span>
                            <span className="muted small">{me?.email}</span>
                        </div>
                        <button type="button" role="menuitem" className="menu-item" onClick={() => openDialog('profile')}>
                            <UserRound size={15} aria-hidden="true" /> Profilni tahrirlash
                        </button>
                        <button type="button" role="menuitem" className="menu-item" onClick={() => openDialog('password')}>
                            <KeyRound size={15} aria-hidden="true" /> Parolni oʻzgartirish
                        </button>
                        <div className="menu-separator" />
                        <button type="button" role="menuitem" className="menu-item menu-item--danger" onClick={logout}>
                            <LogOut size={15} aria-hidden="true" /> Chiqish
                        </button>
                    </div>
                )}
            </div>

            {dialog === 'profile' && me && <ProfileModal me={me} onClose={() => setDialog(null)} />}
            {dialog === 'password' && <ChangePasswordModal onClose={() => setDialog(null)} />}
        </div>
    )
}
