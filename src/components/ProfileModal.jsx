import { useState } from 'react'
import Modal from './Modal.jsx'
import { getErrorMessage } from '../api/client.js'
import { useUpdateMe } from '../hooks/useUser.js'
import { toastSuccess } from '../toast/toastStore.js'
import { formatDate } from '../utils/format.js'

/** Edit the current user's name (PATCH /user/me). Email can't be changed. */
export default function ProfileModal({ me, onClose }) {
    const [firstName, setFirstName] = useState(me.firstName)
    const [lastName, setLastName] = useState(me.lastName ?? '')
    const updateMe = useUpdateMe()

    const handleSubmit = (e) => {
        e.preventDefault()
        updateMe.mutate(
            { firstName: firstName.trim(), lastName: lastName.trim() || null },
            {
                onSuccess: () => {
                    toastSuccess('Profil saqlandi')
                    onClose()
                },
            },
        )
    }

    return (
        <Modal
            title="Profil"
            onClose={onClose}
            size="sm"
            footer={
                <>
                    <button type="button" className="button button--ghost" onClick={onClose}>
                        Bekor qilish
                    </button>
                    <button type="submit" form="profile-form" className="button" disabled={updateMe.isPending}>
                        {updateMe.isPending ? 'Saqlanmoqda…' : 'Saqlash'}
                    </button>
                </>
            }
        >
            <form id="profile-form" className="form" onSubmit={handleSubmit}>
                <div className="grid-2">
                    <label className="field">
                        <span className="field-label">Ism *</span>
                        <input
                            className="input"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            maxLength={100}
                            autoFocus
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
                </label>
                <label className="field">
                    <span className="field-label">Rol</span>
                    <input className="input" value={me.role?.name ?? 'Rolsiz'} disabled />
                </label>
                <p className="muted small">Emailni oʻzgartirib boʻlmaydi · Roʻyxatdan oʻtilgan: {formatDate(me.createdAt)}</p>
                {updateMe.isError && <p className="error">{getErrorMessage(updateMe.error)}</p>}
            </form>
        </Modal>
    )
}
