import { useState } from 'react'
import Modal from './Modal.jsx'
import { getErrorMessage } from '../api/client.js'
import { usePermissions } from '../hooks/usePermissions.js'
import { useRoles } from '../hooks/useRoles.js'
import { useCreateUser, useUpdateUser } from '../hooks/useUsers.js'
import { toastSuccess } from '../toast/toastStore.js'

/** Create (no `user`) or edit `user`. The role picker needs `canReadRole` to list roles. */
export default function UserModal({ user, onClose }) {
    const isEdit = !!user
    const { userId, canReadRole } = usePermissions()
    const { data: roles = [] } = useRoles({ enabled: canReadRole })
    const isSelf = user?.id === userId

    const [form, setForm] = useState(() => ({
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        email: user?.email ?? '',
        password: '',
        roleId: user?.role?.id ?? '',
    }))
    const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

    const createUser = useCreateUser()
    const updateUser = useUpdateUser()
    const save = isEdit ? updateUser : createUser

    const handleSubmit = (e) => {
        e.preventDefault()
        const body = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim() || null,
            email: form.email.trim(),
        }
        if (form.password) body.password = form.password
        // Admins can't change their own role; without canReadRole the picker isn't shown, so leave the role alone.
        if (canReadRole && !isSelf) body.roleId = form.roleId || null

        save.mutate(isEdit ? { id: user.id, ...body } : body, {
            onSuccess: () => {
                toastSuccess(isEdit ? 'Foydalanuvchi saqlandi' : 'Foydalanuvchi yaratildi')
                onClose()
            },
        })
    }

    return (
        <Modal
            title={isEdit ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="button button--ghost" onClick={onClose}>
                        Bekor qilish
                    </button>
                    <button type="submit" form="user-form" className="button" disabled={save.isPending}>
                        {save.isPending ? 'Saqlanmoqda…' : 'Saqlash'}
                    </button>
                </>
            }
        >
            <form id="user-form" className="form" onSubmit={handleSubmit}>
                <div className="grid-2">
                    <label className="field">
                        <span className="field-label">Ism *</span>
                        <input className="input" value={form.firstName} onChange={set('firstName')} required maxLength={100} autoFocus />
                    </label>
                    <label className="field">
                        <span className="field-label">Familiya</span>
                        <input className="input" value={form.lastName} onChange={set('lastName')} maxLength={100} />
                    </label>
                </div>
                <label className="field">
                    <span className="field-label">Email *</span>
                    <input
                        className="input"
                        type="email"
                        value={form.email}
                        onChange={set('email')}
                        required
                        maxLength={254}
                        autoComplete="off"
                    />
                </label>
                <div className="grid-2">
                    <label className="field">
                        <span className="field-label">{isEdit ? 'Yangi parol' : 'Parol *'}</span>
                        <input
                            className="input"
                            type="password"
                            value={form.password}
                            onChange={set('password')}
                            required={!isEdit}
                            minLength={8}
                            maxLength={128}
                            autoComplete="new-password"
                            placeholder={isEdit ? 'Oʻzgartirmaslik uchun boʻsh qoldiring' : 'Kamida 8 ta belgi'}
                        />
                    </label>
                    {canReadRole && (
                        <label className="field">
                            <span className="field-label">Rol</span>
                            <select className="input" value={form.roleId} onChange={set('roleId')} disabled={isSelf}>
                                <option value="">— Rolsiz —</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                            {isSelf && <span className="muted small">Oʻz rolingizni oʻzgartira olmaysiz</span>}
                        </label>
                    )}
                </div>
                {!isEdit && (
                    <p className="muted small">Yangi foydalanuvchiga standart voronka va manbalar avtomatik yaratiladi.</p>
                )}
                {save.error && <p className="error">{getErrorMessage(save.error)}</p>}
            </form>
        </Modal>
    )
}
