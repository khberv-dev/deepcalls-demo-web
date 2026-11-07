import { useState } from 'react'
import Modal from './Modal.jsx'
import { getErrorMessage } from '../api/client.js'
import { useCreateRole, useUpdateRole } from '../hooks/useRoles.js'
import { PERMISSION_RESOURCES } from '../labels.js'
import { toastSuccess } from '../toast/toastStore.js'

const FLAGS = PERMISSION_RESOURCES.flatMap(({ key }) => [`canRead${key}`, `canWrite${key}`])

/** Create (no `role`) or edit `role`. Write implies read, so ticking "write" also ticks "read". */
export default function RoleModal({ role, onClose }) {
    const isEdit = !!role
    const [name, setName] = useState(role?.name ?? '')
    const [flags, setFlags] = useState(() => Object.fromEntries(FLAGS.map((f) => [f, !!role?.[f]])))
    const createRole = useCreateRole()
    const updateRole = useUpdateRole()
    const save = isEdit ? updateRole : createRole

    const toggle = (resource, kind, value) =>
        setFlags((f) => {
            const next = { ...f, [`can${kind}${resource}`]: value }
            if (kind === 'Write' && value) next[`canRead${resource}`] = true
            if (kind === 'Read' && !value) next[`canWrite${resource}`] = false
            return next
        })

    const handleSubmit = (e) => {
        e.preventDefault()
        const body = { name: name.trim(), ...flags }
        save.mutate(isEdit ? { id: role.id, ...body } : body, {
            onSuccess: () => {
                toastSuccess(isEdit ? 'Rol saqlandi' : 'Rol yaratildi')
                onClose()
            },
        })
    }

    return (
        <Modal
            title={isEdit ? 'Rolni tahrirlash' : 'Yangi rol'}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="button button--ghost" onClick={onClose}>
                        Bekor qilish
                    </button>
                    <button type="submit" form="role-form" className="button" disabled={save.isPending}>
                        {save.isPending ? 'Saqlanmoqda…' : 'Saqlash'}
                    </button>
                </>
            }
        >
            <form id="role-form" className="form" onSubmit={handleSubmit}>
                <label className="field">
                    <span className="field-label">Nomi *</span>
                    <input
                        className="input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={100}
                        autoFocus
                    />
                </label>
                <table className="table perm-table">
                    <thead>
                        <tr>
                            <th>Ruxsat</th>
                            <th>Koʻrish</th>
                            <th>Tahrirlash</th>
                        </tr>
                    </thead>
                    <tbody>
                        {PERMISSION_RESOURCES.map(({ key, label, read, write }) => (
                            <tr key={key}>
                                <td className="strong-plain">{label}</td>
                                <td>
                                    <label className="check" title={read}>
                                        <input
                                            type="checkbox"
                                            checked={flags[`canRead${key}`]}
                                            onChange={(e) => toggle(key, 'Read', e.target.checked)}
                                        />
                                        <span className="muted small">{read}</span>
                                    </label>
                                </td>
                                <td>
                                    <label className="check" title={write}>
                                        <input
                                            type="checkbox"
                                            checked={flags[`canWrite${key}`]}
                                            onChange={(e) => toggle(key, 'Write', e.target.checked)}
                                        />
                                        <span className="muted small">{write}</span>
                                    </label>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="muted small">
                    Foydalanuvchi oʻz yozuvlari bilan har doim ishlay oladi. Ruxsatlar boshqa foydalanuvchilarning yozuvlariga
                    kirishni beradi. Oʻzgarishlar darhol kuchga kiradi.
                </p>
                {save.error && <p className="error">{getErrorMessage(save.error)}</p>}
            </form>
        </Modal>
    )
}
