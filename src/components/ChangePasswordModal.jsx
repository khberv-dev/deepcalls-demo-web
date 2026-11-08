import { useState } from 'react'
import Modal from './Modal.jsx'
import { getErrorMessage } from '../api/client.js'
import { useChangePassword } from '../hooks/useUser.js'
import { toastSuccess } from '../toast/toastStore.js'

/** PUT /user/password. The current token stays valid afterwards. */
export default function ChangePasswordModal({ onClose }) {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const changePassword = useChangePassword()
    const mismatch = confirm.length > 0 && newPassword !== confirm

    const handleSubmit = (e) => {
        e.preventDefault()
        if (mismatch) return
        changePassword.mutate(
            { currentPassword, newPassword },
            {
                onSuccess: () => {
                    toastSuccess('Parol oʻzgartirildi')
                    onClose()
                },
            },
        )
    }

    return (
        <Modal
            title="Parolni oʻzgartirish"
            onClose={onClose}
            size="sm"
            footer={
                <>
                    <button type="button" className="button button--ghost" onClick={onClose}>
                        Bekor qilish
                    </button>
                    <button
                        type="submit"
                        form="password-form"
                        className="button"
                        disabled={changePassword.isPending || mismatch}
                    >
                        {changePassword.isPending ? 'Saqlanmoqda…' : 'Saqlash'}
                    </button>
                </>
            }
        >
            <form id="password-form" className="form" onSubmit={handleSubmit}>
                <label className="field">
                    <span className="field-label">Joriy parol</span>
                    <input
                        className="input"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        autoFocus
                    />
                </label>
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
                    <span className="muted small">Kamida 8 ta belgi</span>
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
                {mismatch && <p className="error">Parollar mos kelmadi</p>}
                {changePassword.isError && <p className="error">{getErrorMessage(changePassword.error)}</p>}
            </form>
        </Modal>
    )
}
