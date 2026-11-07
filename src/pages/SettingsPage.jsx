import { useState } from 'react'
import { LogOut } from 'lucide-react'
import Spinner from '../components/Spinner.jsx'
import { getErrorMessage } from '../api/client.js'
import { useLogout } from '../hooks/useAuth.js'
import { useChangePassword, useMe, useUpdateMe } from '../hooks/useUser.js'
import { toastSuccess } from '../toast/toastStore.js'
import { formatDate } from '../utils/format.js'

function ProfileForm({ me }) {
    const [firstName, setFirstName] = useState(me.firstName)
    const [lastName, setLastName] = useState(me.lastName ?? '')
    const updateMe = useUpdateMe()

    const handleSubmit = (e) => {
        e.preventDefault()
        updateMe.mutate(
            { firstName: firstName.trim(), lastName: lastName.trim() || null },
            { onSuccess: () => toastSuccess('Profil saqlandi') },
        )
    }

    return (
        <form className="card form" onSubmit={handleSubmit}>
            <h2 className="card-title">Profil</h2>
            <div className="grid-2">
                <label className="field">
                    <span className="field-label">Ism *</span>
                    <input
                        className="input"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        maxLength={100}
                    />
                </label>
                <label className="field">
                    <span className="field-label">Familiya</span>
                    <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={100} />
                </label>
            </div>
            <label className="field">
                <span className="field-label">Email</span>
                <input className="input" value={me.email} disabled />
                <span className="muted small">Emailni oʻzgartirib boʻlmaydi · Roʻyxatdan oʻtilgan: {formatDate(me.createdAt)}</span>
            </label>
            {updateMe.isError && <p className="error">{getErrorMessage(updateMe.error)}</p>}
            <button className="button" type="submit" disabled={updateMe.isPending}>
                {updateMe.isPending ? 'Saqlanmoqda…' : 'Saqlash'}
            </button>
        </form>
    )
}

function PasswordForm() {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const changePassword = useChangePassword()
    const mismatch = confirm && newPassword !== confirm

    const handleSubmit = (e) => {
        e.preventDefault()
        if (mismatch) return
        changePassword.mutate(
            { currentPassword, newPassword },
            {
                onSuccess: () => {
                    toastSuccess('Parol oʻzgartirildi')
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirm('')
                },
            },
        )
    }

    return (
        <form className="card form" onSubmit={handleSubmit}>
            <h2 className="card-title">Parolni oʻzgartirish</h2>
            <label className="field">
                <span className="field-label">Joriy parol</span>
                <input
                    className="input"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                />
            </label>
            <div className="grid-2">
                <label className="field">
                    <span className="field-label">Yangi parol</span>
                    <input
                        className="input"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        minLength={8}
                        maxLength={128}
                    />
                </label>
                <label className="field">
                    <span className="field-label">Yangi parolni takrorlang</span>
                    <input
                        className="input"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="new-password"
                        required
                    />
                </label>
            </div>
            {mismatch && <p className="error">Parollar mos kelmadi</p>}
            {changePassword.isError && <p className="error">{getErrorMessage(changePassword.error)}</p>}
            <button className="button" type="submit" disabled={changePassword.isPending || mismatch}>
                {changePassword.isPending ? 'Saqlanmoqda…' : 'Parolni oʻzgartirish'}
            </button>
        </form>
    )
}

export default function SettingsPage() {
    const { data: me, isLoading, error } = useMe()
    const logout = useLogout()

    return (
        <div className="page page--narrow">
            <header className="page-header">
                <h1 className="page-title">Sozlamalar</h1>
                <button className="button button--ghost" onClick={logout}>
                    <LogOut size={16} /> Chiqish
                </button>
            </header>
            {isLoading ? (
                <Spinner />
            ) : error ? (
                <p className="error">{getErrorMessage(error)}</p>
            ) : (
                <>
                    <ProfileForm key={me.id} me={me} />
                    <PasswordForm />
                </>
            )}
        </div>
    )
}
